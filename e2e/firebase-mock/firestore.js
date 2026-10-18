import {
  Timestamp,
  canRead,
  clone,
  commitWrites,
  currentUid,
  isPendingPath,
  localView,
  server,
  setNotifier,
  SERVER_DELAY,
} from "./store";
import { FirebaseError } from "./app";

export { Timestamp };

const SERVER_TS = { __sentinel: "serverTimestamp" };
export function serverTimestamp() {
  return SERVER_TS;
}
export function arrayUnion(...items) {
  return { __sentinel: "arrayUnion", items };
}

export function getFirestore() {
  return { __db: true };
}

function joinPath(segments) {
  return segments.filter((s) => s !== undefined && s !== null).join("/");
}
function randomId() {
  return Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
}

export function collection(parent, ...segments) {
  const base = parent && parent.__db ? [] : [parent.path];
  return { type: "collection", path: joinPath([...base, ...segments]) };
}

export function doc(parent, ...segments) {
  let path;
  if (parent && parent.type === "collection") {
    path = joinPath([parent.path, segments.length ? segments.join("/") : randomId()]);
  } else {
    path = joinPath(segments);
  }
  const id = path.split("/").pop();
  return { type: "doc", path, id };
}

export function where(field, op, value) {
  return { kind: "where", field, op, value };
}
export function orderBy(field, dir = "asc") {
  return { kind: "orderBy", field, dir };
}
export function query(coll, ...constraints) {
  return { type: "query", path: coll.path, constraints };
}

function cmp(a, b) {
  const av = a instanceof Timestamp ? a.toMillis() : a;
  const bv = b instanceof Timestamp ? b.toMillis() : b;
  return av < bv ? -1 : av > bv ? 1 : 0;
}
function getField(data, field) {
  return field.split(".").reduce((o, k) => (o == null ? undefined : o[k]), data);
}

function resolveValue(v, prev) {
  if (v === SERVER_TS) return Timestamp.now();
  if (v && v.__sentinel === "arrayUnion") {
    const base = Array.isArray(prev) ? prev.slice() : [];
    for (const it of v.items) if (!base.includes(it)) base.push(it);
    return base;
  }
  return v;
}

function applySet(prev, data, merge) {
  const out = merge && prev ? clone(prev) : {};
  for (const k of Object.keys(data)) out[k] = resolveValue(data[k], out[k]);
  return out;
}

function applyUpdate(prev, data) {
  const out = clone(prev);
  for (const k of Object.keys(data)) {
    const parts = k.split(".");
    let o = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof o[parts[i]] !== "object" || o[parts[i]] === null) o[parts[i]] = {};
      o = o[parts[i]];
    }
    const last = parts[parts.length - 1];
    o[last] = resolveValue(data[k], o[last]);
  }
  return out;
}

function permissionDenied() {
  return new FirebaseError("permission-denied", "Missing or insufficient permissions.");
}

function makeDocSnap(path, data, hasPendingWrites) {
  return {
    id: path.split("/").pop(),
    ref: { path },
    exists: () => data !== undefined,
    data: () => (data === undefined ? undefined : clone(data)),
    metadata: { hasPendingWrites, fromCache: false },
  };
}

// ----- Yazma -----

function checkWrite(path, view) {
  // Yazma yetkisi: users/{uid} sadece kendin; households alt verisi sadece üyeler.
  const uid = currentUid();
  if (!uid) throw permissionDenied();
  const parts = path.split("/");
  if (parts[0] === "users" && parts[1] !== uid) throw permissionDenied();
  if (parts[0] === "households" && parts.length > 2) {
    const h = view.get(`households/${parts[1]}`);
    if (!h || !h.members.includes(uid)) throw permissionDenied();
  }
}

export async function setDoc(ref, data, options) {
  const view = localView();
  checkWrite(ref.path, view);
  await commitWrites([{ path: ref.path, data: applySet(view.get(ref.path), data, options && options.merge) }]);
}

export async function addDoc(coll, data) {
  const ref = doc(coll);
  await setDoc(ref, data);
  return ref;
}

export async function updateDoc(ref, data) {
  const view = localView();
  const prev = view.get(ref.path);
  if (!prev) throw new FirebaseError("not-found", "No document to update");
  checkWrite(ref.path, view);
  await commitWrites([{ path: ref.path, data: applyUpdate(prev, data) }]);
}

export async function deleteDoc(ref) {
  checkWrite(ref.path, localView());
  await commitWrites([{ path: ref.path, data: null }]);
}

export function writeBatch() {
  const ops = [];
  return {
    set(ref, data, options) {
      ops.push({ kind: "set", ref, data, options });
    },
    update(ref, data) {
      ops.push({ kind: "update", ref, data });
    },
    delete(ref) {
      ops.push({ kind: "delete", ref });
    },
    async commit() {
      const view = localView();
      const writes = [];
      for (const op of ops) {
        const prev = view.get(op.ref.path);
        let data;
        if (op.kind === "set") data = applySet(prev, op.data, op.options && op.options.merge);
        else if (op.kind === "update") {
          if (!prev) throw new FirebaseError("not-found", "No document to update");
          data = applyUpdate(prev, op.data);
        } else data = null;
        view.set(op.ref.path, data);
        writes.push({ path: op.ref.path, data });
      }
      await commitWrites(writes);
    },
  };
}

// ----- Okuma -----

export function getDoc(ref) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!canRead(ref.path, currentUid())) return reject(permissionDenied());
      resolve(makeDocSnap(ref.path, server.get(ref.path), false));
    }, 60);
  });
}

function runQuery(q, view) {
  const prefix = q.path + "/";
  const depth = q.path.split("/").length + 1;
  let rows = [];
  for (const [path, data] of view) {
    if (!path.startsWith(prefix) || path.split("/").length !== depth) continue;
    let ok = true;
    for (const c of q.constraints) {
      if (c.kind !== "where") continue;
      const v = getField(data, c.field);
      if (c.op === "==") ok = ok && cmp(v, c.value) === 0;
      else if (c.op === ">=") ok = ok && v !== undefined && cmp(v, c.value) >= 0;
      else if (c.op === "<") ok = ok && v !== undefined && cmp(v, c.value) < 0;
      else if (c.op === "array-contains") ok = ok && Array.isArray(v) && v.includes(c.value);
    }
    if (ok) rows.push({ path, data });
  }
  const order = q.constraints.find((c) => c.kind === "orderBy");
  if (order) {
    rows.sort((a, b) => cmp(getField(a.data, order.field), getField(b.data, order.field)) * (order.dir === "desc" ? -1 : 1));
  }
  return rows;
}

const listeners = new Set();

function fingerprint(x) {
  return JSON.stringify(x, (k, v) => (v instanceof Timestamp ? { __ts: v.toMillis() } : v));
}

function deliver(l) {
  const view = localView();
  if (l.target.type === "doc") {
    const data = view.get(l.target.path);
    const pend = isPendingPath(l.target.path);
    const dataKey = fingerprint(data ?? null);
    const metaKey = dataKey + "|" + pend;
    if (l.lastData === dataKey && (!l.includeMeta || l.lastMeta === metaKey)) return;
    l.lastData = dataKey;
    l.lastMeta = metaKey;
    l.next(makeDocSnap(l.target.path, data, pend));
  } else {
    const rows = runQuery(l.target, view);
    const pend = rows.some((r) => isPendingPath(r.path));
    const dataKey = fingerprint(rows.map((r) => [r.path, r.data]));
    const metaKey = dataKey + "|" + pend;
    if (l.lastData === dataKey && (!l.includeMeta || l.lastMeta === metaKey)) return;
    l.lastData = dataKey;
    l.lastMeta = metaKey;
    const docs = rows.map((r) => makeDocSnap(r.path, r.data, isPendingPath(r.path)));
    l.next({ docs, size: docs.length, empty: docs.length === 0, metadata: { hasPendingWrites: pend } });
  }
}

setNotifier(() => {
  for (const l of Array.from(listeners)) {
    // Yetki her bildirimde sunucu durumuna göre kontrol edilir.
    if (!canRead(l.target.path, currentUid())) {
      listeners.delete(l);
      l.error && l.error(permissionDenied());
      continue;
    }
    deliver(l);
  }
});

export function onSnapshot(target, a, b, c) {
  let options = {};
  let next;
  let error;
  if (typeof a === "function") {
    next = a;
    error = b;
  } else {
    options = a || {};
    next = b;
    error = c;
  }
  const l = { target, next, error, includeMeta: !!options.includeMetadataChanges, lastData: undefined, lastMeta: undefined };
  // İlk yanıt sunucudan gelir: yetki o anki sunucu durumuna göre.
  const timer = setTimeout(() => {
    if (!canRead(target.path, currentUid())) {
      error && error(permissionDenied());
      return;
    }
    listeners.add(l);
    deliver(l);
  }, 40);
  return () => {
    clearTimeout(timer);
    listeners.delete(l);
  };
}

// Testlerin sunucu gecikmesini bilmesi için
export const __mock = { SERVER_DELAY, server };

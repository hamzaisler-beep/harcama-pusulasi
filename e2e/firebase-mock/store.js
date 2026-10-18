// Uçtan uca testler için Firebase'in tarayıcı içi sahte kopyası.
// Sadece E2E_MOCK=1 ile yapılan derlemede kullanılır (metro.config.js).
//
// Gerçeğe yakın olsun diye:
//  - Yazmalar önce yerelde "bekleyen" (hasPendingWrites) olarak görünür,
//    SERVER_DELAY ms sonra "sunucuya" işlenir.
//  - Okuma yetkisi (hane üyeliği) sunucu durumuna göre kontrol edilir;
//    yetkisiz dinleyici hata alır ve kapanır (gerçek Firestore gibi).
//  - Veri localStorage'da saklanır; sayfa yenilense de kalır.

export const SERVER_DELAY = 350;
const KEY = "__fbmock_db";

export class Timestamp {
  constructor(seconds, nanoseconds = 0) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  static fromDate(d) {
    const ms = d.getTime();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
  static fromMillis(ms) {
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
  static now() {
    return Timestamp.fromMillis(Date.now());
  }
  toMillis() {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6);
  }
  toDate() {
    return new Date(this.toMillis());
  }
}

function encode(v) {
  if (v instanceof Timestamp) return { __ts: v.toMillis() };
  if (Array.isArray(v)) return v.map(encode);
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = encode(v[k]);
    return o;
  }
  return v;
}
function decode(v) {
  if (v && typeof v === "object" && "__ts" in v) return Timestamp.fromMillis(v.__ts);
  if (Array.isArray(v)) return v.map(decode);
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = decode(v[k]);
    return o;
  }
  return v;
}
export function clone(v) {
  return decode(encode(v));
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Map();
    return new Map(Object.entries(JSON.parse(raw)).map(([k, v]) => [k, decode(v)]));
  } catch {
    return new Map();
  }
}
function save(map) {
  const o = {};
  for (const [k, v] of map) o[k] = encode(v);
  localStorage.setItem(KEY, JSON.stringify(o));
}

/** "Sunucu" durumu: path → veri */
export const server = load();
/** Henüz sunucuya ulaşmamış yazmalar: { path, data|null } */
export const pending = [];

export function localView() {
  const m = new Map(server);
  for (const p of pending) {
    if (p.data === null) m.delete(p.path);
    else m.set(p.path, p.data);
  }
  return m;
}

export function isPendingPath(path) {
  return pending.some((p) => p.path === path);
}

let notify = () => {};
export function setNotifier(fn) {
  notify = fn;
}

/** Bir grup yazmayı yerelde hemen, sunucuda gecikmeli uygular. */
export function commitWrites(writes) {
  return new Promise((resolve) => {
    for (const w of writes) pending.push(w);
    notify();
    setTimeout(() => {
      for (const w of writes) {
        const i = pending.indexOf(w);
        if (i >= 0) pending.splice(i, 1);
        if (w.data === null) server.delete(w.path);
        else server.set(w.path, w.data);
      }
      save(server);
      notify();
      resolve();
    }, SERVER_DELAY);
  });
}

export function currentUid() {
  try {
    const u = JSON.parse(localStorage.getItem("__fbmock_user") || "null");
    return u ? u.uid : null;
  } catch {
    return null;
  }
}

/** Basitleştirilmiş güvenlik kuralları (firestore.rules ile aynı mantık, okuma tarafı). */
export function canRead(path, uid) {
  if (!uid) return false;
  const parts = path.split("/");
  if (parts[0] === "users") return parts[1] === uid;
  if (parts[0] === "invites") return true;
  if (parts[0] === "households") {
    const h = server.get(`households/${parts[1]}`);
    return !!h && Array.isArray(h.members) && h.members.includes(uid);
  }
  return true;
}

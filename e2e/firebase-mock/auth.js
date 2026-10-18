import { FirebaseError } from "./app";

const USERS_KEY = "__fbmock_users";
const CURRENT_KEY = "__fbmock_user";

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeUsers(u) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

const auth = { currentUser: null };
const observers = new Set();

function toUser(rec) {
  if (!rec) return null;
  return { uid: rec.uid, email: rec.email, displayName: rec.displayName || null };
}

function setCurrent(rec) {
  if (rec) localStorage.setItem(CURRENT_KEY, JSON.stringify(rec));
  else localStorage.removeItem(CURRENT_KEY);
  auth.currentUser = toUser(rec);
  for (const cb of observers) cb(auth.currentUser);
}

try {
  auth.currentUser = toUser(JSON.parse(localStorage.getItem(CURRENT_KEY) || "null"));
} catch {
  auth.currentUser = null;
}

export function getAuth() {
  return auth;
}
export function initializeAuth() {
  return auth;
}
export function getReactNativePersistence() {
  return {};
}

export function onAuthStateChanged(_auth, cb) {
  observers.add(cb);
  setTimeout(() => cb(auth.currentUser), 30);
  return () => observers.delete(cb);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function createUserWithEmailAndPassword(_auth, email, password) {
  await wait(80);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new FirebaseError("auth/invalid-email", "invalid");
  if (!password) throw new FirebaseError("auth/missing-password", "missing");
  if (password.length < 6) throw new FirebaseError("auth/weak-password", "weak");
  const users = readUsers();
  if (users[email]) throw new FirebaseError("auth/email-already-in-use", "in use");
  const rec = { uid: "u_" + Math.random().toString(36).slice(2, 10), email, password, displayName: null };
  users[email] = rec;
  writeUsers(users);
  setCurrent(rec);
  return { user: auth.currentUser };
}

export async function signInWithEmailAndPassword(_auth, email, password) {
  await wait(80);
  // Gerçek Firebase gibi: önce biçim kontrolü.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new FirebaseError("auth/invalid-email", "invalid");
  if (!password) throw new FirebaseError("auth/missing-password", "missing");
  const rec = readUsers()[email];
  if (!rec || rec.password !== password) throw new FirebaseError("auth/invalid-credential", "bad");
  setCurrent(rec);
  return { user: auth.currentUser };
}

export class GoogleAuthProvider {
  setCustomParameters() {}
}

export async function signInWithPopup() {
  await wait(80);
  const email = "google.test@example.com";
  const users = readUsers();
  if (!users[email]) {
    users[email] = { uid: "u_google", email, password: null, displayName: "Google Test" };
    writeUsers(users);
  }
  setCurrent(users[email]);
  return { user: auth.currentUser };
}

export async function updateProfile(user, { displayName }) {
  const users = readUsers();
  const rec = users[user.email];
  rec.displayName = displayName;
  writeUsers(users);
  user.displayName = displayName;
  localStorage.setItem(CURRENT_KEY, JSON.stringify(rec));
}

export async function signOut() {
  await wait(30);
  setCurrent(null);
}

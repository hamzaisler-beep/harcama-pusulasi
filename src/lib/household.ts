import type { User } from "firebase/auth";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Invite } from "../types";

// Karışabilecek karakterler (0/O, 1/I/L) yok.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_LENGTH = 6;

function randomCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function displayNameOf(user: User): string {
  return user.displayName?.trim() || user.email?.split("@")[0] || "Üye";
}

async function uniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const snap = await getDoc(doc(db, "invites", code));
    if (!snap.exists()) return code;
  }
  throw new Error("Davet kodu oluşturulamadı, lütfen tekrar dene.");
}

/** Yeni hane kurar: hane + davet kodu + kullanıcının hanesi tek seferde yazılır. */
export async function createHousehold(user: User, name: string): Promise<string> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Hane adı boş olamaz.");

  const code = await uniqueInviteCode();
  const householdRef = doc(collection(db, "households"));
  const batch = writeBatch(db);

  batch.set(householdRef, {
    name: cleanName,
    ownerId: user.uid,
    members: [user.uid],
    memberNames: { [user.uid]: displayNameOf(user) },
    inviteCode: code,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "invites", code), {
    householdId: householdRef.id,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "users", user.uid), { householdId: householdRef.id }, { merge: true });

  await batch.commit();
  return householdRef.id;
}

/** Davet koduyla mevcut haneye katılır. */
export async function joinHousehold(user: User, rawCode: string): Promise<string> {
  const code = normalizeCode(rawCode);
  if (code.length !== INVITE_CODE_LENGTH) {
    throw new Error(`Davet kodu ${INVITE_CODE_LENGTH} karakter olmalı.`);
  }

  const inviteSnap = await getDoc(doc(db, "invites", code));
  if (!inviteSnap.exists()) throw new Error("Bu davet kodu bulunamadı. Kodu kontrol et.");
  const { householdId } = inviteSnap.data() as Invite;

  const batch = writeBatch(db);
  // Güvenlik kuralı, haneye eklenmeye izin vermeden önce bu joinCode'un
  // hanenin davet koduyla aynı olduğunu kontrol eder.
  batch.set(doc(db, "users", user.uid), { householdId, joinCode: code }, { merge: true });
  batch.update(doc(db, "households", householdId), {
    members: arrayUnion(user.uid),
    [`memberNames.${user.uid}`]: displayNameOf(user),
  });

  await batch.commit();
  return householdId;
}

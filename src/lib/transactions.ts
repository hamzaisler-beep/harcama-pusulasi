import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { PaymentMethod, TransactionType } from "../types";
import { normalizeDay } from "./money";

export { kurusToInput, monthRange, normalizeDay, parseAmountToKurus } from "./money";

export interface TransactionInput {
  type: TransactionType;
  amountKurus: number;
  categoryId: string;
  date: Date;
  note: string;
  paymentMethod: PaymentMethod;
}

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "kart", label: "Kredi kartı" },
  { id: "nakit", label: "Nakit" },
  { id: "hesap", label: "Banka hesabı" },
];

function txCollection(householdId: string) {
  return collection(db, "households", householdId, "transactions");
}

function toDoc(input: TransactionInput) {
  return {
    type: input.type,
    amountKurus: input.amountKurus,
    categoryId: input.categoryId,
    date: Timestamp.fromDate(normalizeDay(input.date)),
    note: input.note.trim(),
    paymentMethod: input.paymentMethod,
  };
}

function validate(input: TransactionInput) {
  if (!Number.isInteger(input.amountKurus) || input.amountKurus <= 0) {
    throw new Error("Tutar sıfırdan büyük olmalı.");
  }
  if (input.amountKurus > 100_000_000_00) {
    throw new Error("Tutar çok büyük görünüyor, kontrol et.");
  }
  if (!input.categoryId) throw new Error("Bir kategori seç.");
}

export async function addTransaction(householdId: string, uid: string, input: TransactionInput) {
  validate(input);
  await addDoc(txCollection(householdId), {
    ...toDoc(input),
    createdBy: uid,
    source: "manual",
    createdAt: serverTimestamp(),
  });
}

export async function updateTransaction(householdId: string, id: string, input: TransactionInput) {
  validate(input);
  await updateDoc(doc(txCollection(householdId), id), {
    ...toDoc(input),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(householdId: string, id: string) {
  await deleteDoc(doc(txCollection(householdId), id));
}


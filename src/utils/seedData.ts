import { doc, setDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { subDays } from "date-fns";

const CATEGORIES = ["Market", "Eğlence", "Kira", "Ulaşım", "Eğitim", "Sağlık", "Fatura", "Diğer"];

export const seedFamilyTransactions = async (familyId: string, currentUserId: string, currentUserName: string) => {
  console.log("Seeding started for family:", familyId);
  
  const testUser = { id: "test-user-ayse", name: "Ayşe (Test)" };
  const users = [
    { id: currentUserId, name: currentUserName },
    testUser
  ];

  // Ensure Ayşe is in the members list
  try {
    const familyRef = doc(db, "familyGroups", familyId);
    await updateDoc(familyRef, {
      members: arrayUnion(testUser.id)
    });
    console.log("Test member added to family list");
  } catch (e) {
    console.error("Failed to add member to familyGroups", e);
  }

  const totalToSeed = 200; 
  const promises = [];

  for (let i = 0; i < totalToSeed; i++) {
    const user = users[i % 2];
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const amount = Math.floor(Math.random() * 2000) + 50;
    const type = Math.random() > 0.8 ? "income" : "expense";
    const date = subDays(new Date(), Math.floor(Math.random() * 365)); 
    
    const txId = `seed-${familyId}-${i}`; // Unique ID per family/seed
    const txData = {
      id: txId,
      description: `${category} Harcaması`,
      amount: type === "income" ? amount * 3 : amount,
      type,
      category,
      date: date.toISOString(),
      familyId,
      userId: user.id,
      userName: user.name,
      uploadedAt: Timestamp.now()
    };

    promises.push(setDoc(doc(db, "transactions", txId), txData));
  }

  // Seed some Accounts if none exist
  const accounts = [
    { id: `acc-cash-${familyId}`, name: "Nakit", type: "CASH", balance: 1500, color: "#22c55e", familyId },
    { id: `acc-bank-${familyId}`, name: "Banka", type: "BANK", balance: 52000, color: "#3b82f6", familyId },
  ];
  accounts.forEach(acc => promises.push(setDoc(doc(db, "accounts", acc.id), acc)));

  // Seed some Savings
  const savings = [
    { id: `sav-1-${familyId}`, type: "ALTIN", amount: 25.5, createdAt: subDays(new Date(), 10).toISOString(), familyId },
    { id: `sav-2-${familyId}`, type: "USD", amount: 1200, createdAt: subDays(new Date(), 5).toISOString(), familyId },
  ];
  savings.forEach(sav => promises.push(setDoc(doc(db, "savings", sav.id), sav)));

  // Seed some Budgets
  const budgets = [
    { id: `bud-1-${familyId}`, category: "Market", limit: 5000, period: "monthly", familyId },
    { id: `bud-2-${familyId}`, category: "Ulaşım", limit: 2000, period: "monthly", familyId },
  ];
  budgets.forEach(bud => promises.push(setDoc(doc(db, "budgets", bud.id), bud)));

  await Promise.all(promises);
  console.log("Seeding completed successfully (Transactions, Accounts, Savings, Budgets)");
  return true;
};

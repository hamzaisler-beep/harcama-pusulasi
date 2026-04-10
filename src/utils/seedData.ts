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

  await Promise.all(promises);
  console.log("Seeding completed successfully");
  return true;
};

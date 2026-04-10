// src/services/familyService.ts
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  setDoc,
  doc, 
  arrayUnion, 
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";

export interface Family {
  id: string;
  name: string;
  invitationCode: string; // Matches screenshot
  members: string[]; 
  ownerId: string; // Matches screenshot
  createdAt: any;
}

// Generate a random 6-character code (e.g. HP92X1)
const generateFamilyCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "HP";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createFamily = async (familyName: string) => {
  if (!auth.currentUser) throw new Error("Giriş yapmanız gerekiyor.");
  
  const invitationCode = generateFamilyCode();
  const familyData = {
    name: familyName,
    invitationCode: invitationCode,
    members: [auth.currentUser.uid],
    ownerId: auth.currentUser.uid,
    createdAt: new Date().toISOString(), // Using ISO string for better visibility in console
  };
 
  try {
    console.log("Saving family data to Firestore...", familyData);
    const docRef = await addDoc(collection(db, "familyGroups"), familyData).catch(e => {
      console.error("Firestore familyGroups write error", e);
      throw new Error(`Veritabanı yazma hatası (familyGroups): ${e.message}`);
    });
    
    console.log("Updating user profile with id:", auth.currentUser.uid);
    const userRef = doc(db, "users", auth.currentUser.uid);
    await setDoc(userRef, { familyId: docRef.id }, { merge: true }).catch(e => {
      console.error("Firestore user update error", e);
      throw new Error(`Kullanıcı profili güncellenirken hata: ${e.message}`);
    });

    console.log("createFamily completed successfully");
    return { id: docRef.id, invitationCode };
  } catch (error: any) {
    console.error("Detailed createFamily error", error);
    if (typeof window !== "undefined") {
      window.alert("HATA: " + error.message);
    }
    throw error;
  }
};

export const joinFamily = async (invitationCode: string) => {
  if (!auth.currentUser) throw new Error("Giriş yapmanız gerekiyor.");
  
  const q = query(collection(db, "familyGroups"), where("invitationCode", "==", invitationCode.toUpperCase()));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Geçersiz aile kodu.");
  }

  const familyDoc = querySnapshot.docs[0];
  const familyId = familyDoc.id;

  // Add user to family members
  await updateDoc(doc(db, "familyGroups", familyId), {
    members: arrayUnion(auth.currentUser.uid)
  });

  // Update user profile
  const userRef = doc(db, "users", auth.currentUser.uid);
  await setDoc(userRef, { familyId: familyId }, { merge: true });

  return { id: familyId, name: familyDoc.data().name };
};

export const getUserFamily = async () => {
  if (!auth.currentUser) return null;
  
  const userRef = doc(db, "users", auth.currentUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists() && userSnap.data().familyId) {
    const familyRef = doc(db, "familyGroups", userSnap.data().familyId);
    const familySnap = await getDoc(familyRef);
    if (familySnap.exists()) {
      const data = familySnap.data();
      return { 
        id: familySnap.id, 
        name: data.name,
        invitationCode: data.invitationCode,
        members: data.members || [],
        ownerId: data.ownerId,
        createdAt: data.createdAt
      } as Family;
    }
  }
  return null;
};

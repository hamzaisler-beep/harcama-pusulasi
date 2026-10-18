import type { Timestamp } from "firebase/firestore";

/** users/{uid} */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  householdId: string | null;
  /** Katılırken girilen davet kodu; güvenlik kuralı bununla doğrular. */
  joinCode?: string;
  createdAt?: Timestamp;
}

/** households/{hid} */
export interface Household {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  /** uid → görünen ad. Üyeler birbirinin adını görebilsin diye hanede tutulur. */
  memberNames: Record<string, string>;
  inviteCode: string;
  createdAt?: Timestamp;
}

export type TransactionType = "expense" | "income";

/** 4. aşamada gerçek hesaplara (accounts) bağlanacak; şimdilik basit seçim. */
export type PaymentMethod = "kart" | "nakit" | "hesap";

/** households/{hid}/transactions/{id} */
export interface Transaction {
  id: string;
  type: TransactionType;
  /** Kuruş cinsinden, her zaman pozitif tam sayı (12,50 ₺ → 1250). */
  amountKurus: number;
  categoryId: string;
  /** İşlemin günü (saat önemli değil). */
  date: Timestamp;
  note: string;
  paymentMethod: PaymentMethod;
  createdBy: string;
  source: "manual" | "statement";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** invites/{code} */
export interface Invite {
  householdId: string;
  createdAt?: Timestamp;
}

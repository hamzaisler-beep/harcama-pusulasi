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

/** invites/{code} */
export interface Invite {
  householdId: string;
  createdAt?: Timestamp;
}

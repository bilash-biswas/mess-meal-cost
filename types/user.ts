export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  activeMessId?: string | null;
  createdAt: string; // ISO 8601 timestamp or Firestore converted string
  updatedAt: string;
}

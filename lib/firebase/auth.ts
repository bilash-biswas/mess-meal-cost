import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "./client";
import type { UserProfile } from "@/types/user";

const LOCAL_AUTH_USER_KEY = "messcost_local_auth_user";
const LOCAL_USERS_MAP_KEY = "messcost_local_users_map";
const authListeners = new Set<(user: UserProfile | null) => void>();

function notifyLocalAuthListeners(user: UserProfile | null) {
  for (const listener of authListeners) {
    listener(user);
  }
}

function getLocalUsersMap(): Record<string, UserProfile & { password?: string }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_USERS_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUsersMap(map: Record<string, UserProfile & { password?: string }>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_USERS_MAP_KEY, JSON.stringify(map));
}

export function getLocalCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function setLocalCurrentUser(user: UserProfile | null) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(user));
    const map = getLocalUsersMap();
    map[user.uid] = { ...(map[user.uid] || {}), ...user };
    saveLocalUsersMap(map);
  } else {
    window.localStorage.removeItem(LOCAL_AUTH_USER_KEY);
  }
  notifyLocalAuthListeners(user);
}

function convertTimestamp(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "string") return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

/**
 * Ensures `users/{userId}` document exists in Firestore after login/registration.
 */
export async function ensureUserDocument(
  fbUser: FirebaseUser,
  overrideName?: string
): Promise<UserProfile> {
  const db = getFirebaseDb();
  const nowIso = new Date().toISOString();
  const defaultProfile: UserProfile = {
    uid: fbUser.uid,
    name: overrideName || fbUser.displayName || fbUser.email?.split("@")[0] || "Mess Member",
    email: fbUser.email || "",
    photoURL: fbUser.photoURL || undefined,
    activeMessId: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  if (!db) return defaultProfile;

  const userRef = doc(db, "users", fbUser.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: fbUser.uid,
      name: defaultProfile.name,
      email: defaultProfile.email,
      photoURL: defaultProfile.photoURL || null,
      activeMessId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return defaultProfile;
  }

  const data = snap.data();
  const updatedName = overrideName || data.name || defaultProfile.name;

  if (overrideName && data.name !== overrideName) {
    await updateDoc(userRef, {
      name: overrideName,
      updatedAt: serverTimestamp(),
    });
  }

  return {
    uid: fbUser.uid,
    name: updatedName,
    email: data.email || defaultProfile.email,
    photoURL: data.photoURL || fbUser.photoURL || undefined,
    activeMessId: data.activeMessId ?? null,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured) {
    const map = getLocalUsersMap();
    return map[uid] || getLocalCurrentUser();
  }
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid: snap.id,
    name: d.name || "Member",
    email: d.email || "",
    photoURL: d.photoURL || undefined,
    activeMessId: d.activeMessId ?? null,
    createdAt: convertTimestamp(d.createdAt),
    updatedAt: convertTimestamp(d.updatedAt),
  };
}

export async function updateUserActiveMess(
  uid: string,
  messId: string | null
): Promise<void> {
  if (!isFirebaseConfigured) {
    const current = getLocalCurrentUser();
    if (current && current.uid === uid) {
      setLocalCurrentUser({
        ...current,
        activeMessId: messId,
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      activeMessId: messId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<UserProfile> {
  if (!isFirebaseConfigured) {
    const map = getLocalUsersMap();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = Object.values(map).find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      const err = new Error("Email already in use") as Error & { code?: string };
      err.code = "auth/email-already-in-use";
      throw err;
    }
    const uid = `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid,
      name: name.trim(),
      email: normalizedEmail,
      activeMessId: null,
      createdAt: now,
      updatedAt: now,
    };
    map[uid] = { ...profile, password };
    saveLocalUsersMap(map);
    setLocalCurrentUser(profile);
    return profile;
  }

  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Authentication is not initialized.");

  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
  return ensureUserDocument(cred.user, name.trim());
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<UserProfile> {
  if (!isFirebaseConfigured) {
    const map = getLocalUsersMap();
    const normalizedEmail = email.trim().toLowerCase();
    const found = Object.values(map).find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (!found || (found.password && found.password !== password)) {
      const err = new Error("Invalid email or password") as Error & { code?: string };
      err.code = "auth/invalid-credential";
      throw err;
    }
    const { password: _unused, ...profile } = found;
    void _unused;
    setLocalCurrentUser(profile);
    return profile;
  }

  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Authentication is not initialized.");

  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return ensureUserDocument(cred.user);
}

export async function loginWithGoogle(): Promise<UserProfile> {
  if (!isFirebaseConfigured) {
    const now = new Date().toISOString();
    const demoGoogleUser: UserProfile = {
      uid: "user_google_bilash",
      name: "Bilash Ahmed",
      email: "bilash@messcost.app",
      activeMessId: getLocalCurrentUser()?.activeMessId ?? "mess_green_view",
      createdAt: now,
      updatedAt: now,
    };
    setLocalCurrentUser(demoGoogleUser);
    return demoGoogleUser;
  }

  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Authentication is not initialized.");

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  return ensureUserDocument(cred.user);
}

export async function resetUserPassword(email: string): Promise<void> {
  if (!isFirebaseConfigured) {
    return;
  }
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Authentication is not initialized.");
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser(): Promise<void> {
  if (!isFirebaseConfigured) {
    setLocalCurrentUser(null);
    return;
  }
  const auth = getFirebaseAuth();
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function subscribeToAuthChanges(
  callback: (user: UserProfile | null) => void
): () => void {
  if (!isFirebaseConfigured) {
    authListeners.add(callback);
    callback(getLocalCurrentUser());
    return () => {
      authListeners.delete(callback);
    };
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    try {
      const profile = await ensureUserDocument(fbUser);
      callback(profile);
    } catch {
      callback({
        uid: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split("@")[0] || "Member",
        email: fbUser.email || "",
        photoURL: fbUser.photoURL || undefined,
        activeMessId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });
}

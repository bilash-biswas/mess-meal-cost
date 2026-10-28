import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./client";
import { updateUserActiveMess } from "./auth";
import {
  formatMonthTitle,
  generateInviteCode,
  getCurrentMonthId,
  getTodayDateString,
} from "@/lib/utils";
import { calculateDailyMealTotal } from "@/lib/calculations/meal-rate";
import type {
  Mess,
  MessMember,
  MessInvitationPreview,
  MessRole,
  MealConfig,
  SharedSplitMode,
} from "@/types/mess";
import type { MessMonth, MonthClosedSnapshot } from "@/types/month";
import type { DailyMealEntry, MemberDailyMealInput } from "@/types/meal";
import type { MessExpense, ExpenseCategory, ExpenseType } from "@/types/expense";
import type { MessPayment, PaymentMethod } from "@/types/payment";

// ============================================================================
// Local Storage Fallback Store (Used when `.env.local` is not yet configured)
// ============================================================================
interface LocalStoreState {
  messes: Record<string, Mess>;
  members: Record<string, Record<string, MessMember>>; // messId -> uid -> MessMember
  months: Record<string, Record<string, MessMonth>>; // messId -> monthId -> MessMonth
  meals: Record<string, Record<string, DailyMealEntry>>; // messId -> mealId -> DailyMealEntry
  expenses: Record<string, Record<string, MessExpense>>; // messId -> expenseId -> MessExpense
  payments: Record<string, Record<string, MessPayment>>; // messId -> paymentId -> MessPayment
  invitations: Record<string, MessInvitationPreview>; // inviteCode -> preview
}

const LOCAL_DB_KEY = "messcost_local_firestore_v1";
const localListeners = new Set<() => void>();

function notifyLocalStore() {
  for (const fn of localListeners) {
    fn();
  }
}

function getDefaultDemoState(): LocalStoreState {
  const messId = "mess_green_view";
  const monthId = "2026-09";
  const prevMonthId = "2026-08";
  const now = "2026-09-26T10:00:00.000Z";

  const demoMembers: Record<string, MessMember> = {
    user_google_bilash: {
      uid: "user_google_bilash",
      messId,
      name: "Bilash",
      email: "bilash@messcost.app",
      role: "owner",
      isActive: true,
      joinedAt: now,
    },
    user_rahim: {
      uid: "user_rahim",
      messId,
      name: "Rahim",
      email: "rahim@messcost.app",
      role: "admin",
      isActive: true,
      joinedAt: now,
    },
    user_karim: {
      uid: "user_karim",
      messId,
      name: "Karim",
      email: "karim@messcost.app",
      role: "member",
      isActive: true,
      joinedAt: now,
    },
    user_hasan: {
      uid: "user_hasan",
      messId,
      name: "Hasan",
      email: "hasan@messcost.app",
      role: "member",
      isActive: true,
      joinedAt: now,
    },
    user_sakib: {
      uid: "user_sakib",
      messId,
      name: "Sakib",
      email: "sakib@messcost.app",
      role: "member",
      isActive: true,
      joinedAt: now,
    },
  };

  return {
    messes: {
      [messId]: {
        id: messId,
        name: "Green View Mess",
        address: "Mirpur, Dhaka",
        description: "Student & bachelor shared mess (মেসের হিসাব)",
        ownerId: "user_google_bilash",
        inviteCode: "GV-82X4K",
        monthStartDay: 1,
        activeMonthId: monthId,
        defaultMealConfig: { breakfast: 1, lunch: 1, dinner: 1 },
        sharedExpenseSplitMode: "equal",
        allowMemberMealEntry: true,
        memberCount: 5,
        createdAt: now,
        updatedAt: now,
      },
    },
    members: {
      [messId]: demoMembers,
    },
    months: {
      [messId]: {
        [monthId]: {
          id: monthId,
          messId,
          title: "September 2026",
          status: "open",
          sharedSplitMode: "equal",
          createdAt: now,
          updatedAt: now,
        },
        [prevMonthId]: {
          id: prevMonthId,
          messId,
          title: "August 2026",
          status: "closed",
          sharedSplitMode: "equal",
          closedAt: "2026-09-01T18:00:00.000Z",
          closedBy: "user_google_bilash",
          closedByName: "Bilash",
          snapshot: {
            totalMealExpense: 22400,
            totalOtherExpense: 7450,
            totalExpense: 29850,
            totalMeals: 215,
            mealRate: 104.19,
            totalPayments: 29850,
            memberSummaries: [
              {
                userId: "user_google_bilash",
                memberName: "Bilash",
                meals: 44,
                mealCost: 4584.19,
                sharedExpenseShare: 1490,
                customExpenseShare: 0,
                totalCost: 6074.19,
                totalPaid: 6074.19,
                balance: 0,
                balanceStatus: "settled",
              },
              {
                userId: "user_rahim",
                memberName: "Rahim",
                meals: 42,
                mealCost: 4375.81,
                sharedExpenseShare: 1490,
                customExpenseShare: 0,
                totalCost: 5865.81,
                totalPaid: 5865.81,
                balance: 0,
                balanceStatus: "settled",
              },
            ],
          },
          createdAt: "2026-08-01T09:00:00.000Z",
          updatedAt: "2026-09-01T18:00:00.000Z",
        },
      },
    },
    meals: {
      [messId]: {
        "2026-09-26_user_google_bilash": {
          id: "2026-09-26_user_google_bilash",
          messId,
          monthId,
          date: "2026-09-26",
          userId: "user_google_bilash",
          memberName: "Bilash",
          breakfast: 1,
          lunch: 1,
          dinner: 1,
          total: 3,
          updatedBy: "user_google_bilash",
          updatedAt: now,
        },
        "2026-09-26_user_rahim": {
          id: "2026-09-26_user_rahim",
          messId,
          monthId,
          date: "2026-09-26",
          userId: "user_rahim",
          memberName: "Rahim",
          breakfast: 0,
          lunch: 1,
          dinner: 1,
          total: 2,
          updatedBy: "user_google_bilash",
          updatedAt: now,
        },
        "2026-09-26_user_karim": {
          id: "2026-09-26_user_karim",
          messId,
          monthId,
          date: "2026-09-26",
          userId: "user_karim",
          memberName: "Karim",
          breakfast: 1,
          lunch: 1,
          dinner: 0,
          total: 2,
          updatedBy: "user_google_bilash",
          updatedAt: now,
        },
        "2026-09-26_user_hasan": {
          id: "2026-09-26_user_hasan",
          messId,
          monthId,
          date: "2026-09-26",
          userId: "user_hasan",
          memberName: "Hasan",
          breakfast: 1,
          lunch: 1,
          dinner: 1,
          total: 3,
          updatedBy: "user_google_bilash",
          updatedAt: now,
        },
        "2026-09-26_user_sakib": {
          id: "2026-09-26_user_sakib",
          messId,
          monthId,
          date: "2026-09-26",
          userId: "user_sakib",
          memberName: "Sakib",
          breakfast: 0,
          lunch: 1,
          dinner: 1,
          total: 2,
          updatedBy: "user_google_bilash",
          updatedAt: now,
        },
        "2026-09-15_user_google_bilash": {
          id: "2026-09-15_user_google_bilash",
          messId,
          monthId,
          date: "2026-09-15",
          userId: "user_google_bilash",
          memberName: "Bilash",
          breakfast: 14,
          lunch: 14,
          dinner: 14,
          total: 42,
          updatedBy: "user_google_bilash",
          updatedAt: now,
        },
        "2026-09-15_user_rahim": {
          id: "2026-09-15_user_rahim",
          messId,
          monthId,
          date: "2026-09-15",
          userId: "user_rahim",
          memberName: "Rahim",
          breakfast: 10,
          lunch: 15,
          dinner: 15,
          total: 40,
          updatedBy: "user_google_bilash",
          updatedAt: now,
        },
        "2026-09-15_user_karim": {
          id: "2026-09-15_user_karim",
          messId,
          monthId,
          date: "2026-09-15",
          userId: "user_karim",
          memberName: "Karim",
          breakfast: 15,
          lunch: 16,
          dinner: 15,
          total: 46,
          updatedBy: "user_google_bilash",
          updatedAt: now,
        },
        "2026-09-15_user_hasan": {
          id: "2026-09-15_user_hasan",
          messId,
          monthId,
          date: "2026-09-15",
          userId: "user_hasan",
          memberName: "Hasan",
          breakfast: 14,
          lunch: 14,
          dinner: 13,
          total: 41,
          updatedBy: "user_google_bilash",
          updatedAt: now,
        },
        "2026-09-15_user_sakib": {
          id: "2026-09-15_user_sakib",
          messId,
          monthId,
          date: "2026-09-15",
          userId: "user_sakib",
          memberName: "Sakib",
          breakfast: 12,
          lunch: 15,
          dinner: 15,
          total: 42,
          updatedBy: "user_google_bilash",
          updatedAt: now,
        },
      },
    },
    expenses: {
      [messId]: {
        exp_1: {
          id: "exp_1",
          messId,
          monthId,
          date: "2026-09-26",
          category: "vegetables",
          amount: 850,
          paidBy: "user_google_bilash",
          paidByName: "Bilash",
          expenseType: "meal",
          splitMode: "equal",
          description: "Vegetables and potatoes (কাঁচাবাজার ও আলু)",
          receiptUrl: null,
          createdBy: "user_google_bilash",
          createdAt: "2026-09-26T09:30:00.000Z",
          updatedAt: "2026-09-26T09:30:00.000Z",
        },
        exp_2: {
          id: "exp_2",
          messId,
          monthId,
          date: "2026-09-22",
          category: "rice",
          amount: 7200,
          paidBy: "user_rahim",
          paidByName: "Rahim",
          expenseType: "meal",
          splitMode: "equal",
          description: "Miniket Rice 2 sacks + Masoor Dal + Soybean Oil",
          receiptUrl: null,
          createdBy: "user_rahim",
          createdAt: "2026-09-22T11:00:00.000Z",
          updatedAt: "2026-09-22T11:00:00.000Z",
        },
        exp_3: {
          id: "exp_3",
          messId,
          monthId,
          date: "2026-09-18",
          category: "fish",
          amount: 8450,
          paidBy: "user_karim",
          paidByName: "Karim",
          expenseType: "meal",
          splitMode: "equal",
          description: "Rui fish, broiler chicken, and farm eggs",
          receiptUrl: null,
          createdBy: "user_karim",
          createdAt: "2026-09-18T10:00:00.000Z",
          updatedAt: "2026-09-18T10:00:00.000Z",
        },
        exp_4: {
          id: "exp_4",
          messId,
          monthId,
          date: "2026-09-10",
          category: "meat",
          amount: 8000,
          paidBy: "user_hasan",
          paidByName: "Hasan",
          expenseType: "meal",
          splitMode: "equal",
          description: "Beef bazar, spices, onion, garlic & ginger",
          receiptUrl: null,
          createdBy: "user_hasan",
          createdAt: "2026-09-10T12:00:00.000Z",
          updatedAt: "2026-09-10T12:00:00.000Z",
        },
        exp_5: {
          id: "exp_5",
          messId,
          monthId,
          date: "2026-09-05",
          category: "electricity",
          amount: 2500,
          paidBy: "user_google_bilash",
          paidByName: "Bilash",
          expenseType: "other",
          splitMode: "equal",
          description: "DESCO Electricity Bill (বিদ্যুৎ বিল)",
          receiptUrl: null,
          createdBy: "user_google_bilash",
          createdAt: "2026-09-05T14:00:00.000Z",
          updatedAt: "2026-09-05T14:00:00.000Z",
        },
        exp_6: {
          id: "exp_6",
          messId,
          monthId,
          date: "2026-09-05",
          category: "gas",
          amount: 900,
          paidBy: "user_rahim",
          paidByName: "Rahim",
          expenseType: "other",
          splitMode: "equal",
          description: "Titas Gas & Water utility bill",
          receiptUrl: null,
          createdBy: "user_rahim",
          createdAt: "2026-09-05T14:15:00.000Z",
          updatedAt: "2026-09-05T14:15:00.000Z",
        },
        exp_7: {
          id: "exp_7",
          messId,
          monthId,
          date: "2026-09-04",
          category: "internet",
          amount: 800,
          paidBy: "user_karim",
          paidByName: "Karim",
          expenseType: "other",
          splitMode: "equal",
          description: "ISP Fiber Broadband Wi-Fi Bill",
          receiptUrl: null,
          createdBy: "user_karim",
          createdAt: "2026-09-04T16:00:00.000Z",
          updatedAt: "2026-09-04T16:00:00.000Z",
        },
        exp_8: {
          id: "exp_8",
          messId,
          monthId,
          date: "2026-09-02",
          category: "maid",
          amount: 3750,
          paidBy: "user_google_bilash",
          paidByName: "Bilash",
          expenseType: "other",
          splitMode: "equal",
          description: "Cook / Khala monthly salary & cleaning supplies",
          receiptUrl: null,
          createdBy: "user_google_bilash",
          createdAt: "2026-09-02T09:00:00.000Z",
          updatedAt: "2026-09-02T09:00:00.000Z",
        },
      },
    },
    payments: {
      [messId]: {
        pay_1: {
          id: "pay_1",
          messId,
          monthId,
          date: "2026-09-26",
          userId: "user_google_bilash",
          memberName: "Bilash",
          amount: 5000,
          method: "cash",
          note: "September payment (জমা)",
          createdBy: "user_google_bilash",
          createdAt: "2026-09-26T09:00:00.000Z",
          updatedAt: "2026-09-26T09:00:00.000Z",
        },
        pay_2: {
          id: "pay_2",
          messId,
          monthId,
          date: "2026-09-20",
          userId: "user_rahim",
          memberName: "Rahim",
          amount: 7200,
          method: "mobile_banking",
          note: "September mess advance & bazar adjustment",
          createdBy: "user_rahim",
          createdAt: "2026-09-20T10:00:00.000Z",
          updatedAt: "2026-09-20T10:00:00.000Z",
        },
        pay_3: {
          id: "pay_3",
          messId,
          monthId,
          date: "2026-09-18",
          userId: "user_karim",
          memberName: "Karim",
          amount: 6864,
          method: "bank_transfer",
          note: "Full meal + shared bill deposit",
          createdBy: "user_karim",
          createdAt: "2026-09-18T11:00:00.000Z",
          updatedAt: "2026-09-18T11:00:00.000Z",
        },
        pay_4: {
          id: "pay_4",
          messId,
          monthId,
          date: "2026-09-14",
          userId: "user_hasan",
          memberName: "Hasan",
          amount: 5500,
          method: "cash",
          note: "First installment",
          createdBy: "user_hasan",
          createdAt: "2026-09-14T15:00:00.000Z",
          updatedAt: "2026-09-14T15:00:00.000Z",
        },
        pay_5: {
          id: "pay_5",
          messId,
          monthId,
          date: "2026-09-12",
          userId: "user_sakib",
          memberName: "Sakib",
          amount: 5000,
          method: "mobile_banking",
          note: "September deposit",
          createdBy: "user_sakib",
          createdAt: "2026-09-12T18:00:00.000Z",
          updatedAt: "2026-09-12T18:00:00.000Z",
        },
      },
    },
    invitations: {
      "GV-82X4K": {
        messId,
        name: "Green View Mess",
        address: "Mirpur, Dhaka",
        description: "Student & bachelor shared mess (মেসের হিসাব)",
        inviteCode: "GV-82X4K",
        memberCount: 5,
        ownerId: "user_google_bilash",
      },
    },
  };
}

function getLocalStore(): LocalStoreState {
  if (typeof window === "undefined") return getDefaultDemoState();
  try {
    const raw = window.localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) {
      const initial = getDefaultDemoState();
      window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as LocalStoreState;
  } catch {
    return getDefaultDemoState();
  }
}

function saveLocalStore(state: LocalStoreState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(state));
  notifyLocalStore();
}

function tsToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "string") return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

// ============================================================================
// 1. Mess & Invitation Operations (Phase 3)
// ============================================================================

export async function createMess(params: {
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  name: string;
  address: string;
  description: string;
  monthStartDay: number;
  defaultMealConfig: MealConfig;
}): Promise<Mess> {
  const {
    userId,
    userName,
    userEmail,
    userPhotoURL,
    name,
    address,
    description,
    monthStartDay,
    defaultMealConfig,
  } = params;

  const inviteCode = generateInviteCode(name);
  const activeMonthId = getCurrentMonthId();
  const nowIso = new Date().toISOString();

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const messId = `mess_${Date.now().toString(36)}`;
    const newMess: Mess = {
      id: messId,
      name: name.trim(),
      address: address.trim(),
      description: description.trim(),
      ownerId: userId,
      inviteCode,
      monthStartDay,
      activeMonthId,
      defaultMealConfig,
      sharedExpenseSplitMode: "equal",
      allowMemberMealEntry: true,
      memberCount: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    state.messes[messId] = newMess;
    state.members[messId] = {
      [userId]: {
        uid: userId,
        messId,
        name: userName,
        email: userEmail,
        photoURL: userPhotoURL,
        role: "owner",
        isActive: true,
        joinedAt: nowIso,
      },
    };
    state.months[messId] = {
      [activeMonthId]: {
        id: activeMonthId,
        messId,
        title: formatMonthTitle(activeMonthId),
        status: "open",
        sharedSplitMode: "equal",
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    };
    state.invitations[inviteCode] = {
      messId,
      name: newMess.name,
      address: newMess.address,
      description: newMess.description,
      inviteCode,
      memberCount: 1,
      ownerId: userId,
    };
    saveLocalStore(state);
    await updateUserActiveMess(userId, messId);
    return newMess;
  }

  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore is not initialized.");

  const messRef = doc(collection(db, "messes"));
  const messId = messRef.id;

  // Step 1: Commit mess document, owner member document, and user profile (with merge: true)
  const batch1 = writeBatch(db);

  batch1.set(messRef, {
    name: name.trim(),
    address: address.trim(),
    description: description.trim(),
    ownerId: userId,
    inviteCode,
    monthStartDay,
    activeMonthId,
    defaultMealConfig,
    sharedExpenseSplitMode: "equal",
    allowMemberMealEntry: true,
    memberCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Owner member doc
  const memberRef = doc(db, "messes", messId, "members", userId);
  batch1.set(memberRef, {
    uid: userId,
    messId,
    name: userName,
    email: userEmail,
    photoURL: userPhotoURL || null,
    role: "owner",
    isActive: true,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Upsert user's activeMessId (works even if user signed in before rules were published)
  const userRef = doc(db, "users", userId);
  batch1.set(
    userRef,
    {
      uid: userId,
      name: userName,
      email: userEmail,
      photoURL: userPhotoURL || null,
      activeMessId: messId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch1.commit();

  // Step 2: Now that memberRef exists in Firestore, create initial month and invitation docs
  const batch2 = writeBatch(db);

  const monthRef = doc(db, "messes", messId, "months", activeMonthId);
  batch2.set(monthRef, {
    id: activeMonthId,
    messId,
    title: formatMonthTitle(activeMonthId),
    status: "open",
    sharedSplitMode: "equal",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const inviteRef = doc(db, "messes", messId, "invitations", inviteCode);
  batch2.set(inviteRef, {
    messId,
    name: name.trim(),
    address: address.trim(),
    description: description.trim(),
    inviteCode,
    memberCount: 1,
    ownerId: userId,
    createdAt: serverTimestamp(),
  });

  await batch2.commit();

  return {
    id: messId,
    name: name.trim(),
    address: address.trim(),
    description: description.trim(),
    ownerId: userId,
    inviteCode,
    monthStartDay,
    activeMonthId,
    defaultMealConfig,
    sharedExpenseSplitMode: "equal",
    allowMemberMealEntry: true,
    memberCount: 1,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Looks up a mess by its unique invitation code (e.g. "GV-82X4K")
 * so the user can preview Mess Name, Address, and Number of Members before joining.
 */
export async function lookupMessByInviteCode(
  rawCode: string
): Promise<MessInvitationPreview | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const invite = state.invitations[code];
    if (invite) {
      const m = state.messes[invite.messId];
      const count = Object.keys(state.members[invite.messId] || {}).length;
      return {
        ...invite,
        memberCount: m ? m.memberCount : count,
      };
    }
    const foundMess = Object.values(state.messes).find(
      (m) => m.inviteCode.toUpperCase() === code
    );
    if (!foundMess) return null;
    return {
      messId: foundMess.id,
      name: foundMess.name,
      address: foundMess.address,
      description: foundMess.description,
      inviteCode: foundMess.inviteCode,
      memberCount: foundMess.memberCount,
      ownerId: foundMess.ownerId,
    };
  }

  const db = getFirebaseDb();
  if (!db) return null;

  const q = query(
    collection(db, "messes"),
    where("inviteCode", "==", code),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const d = snap.docs[0];
  const data = d.data();
  return {
    messId: d.id,
    name: data.name || "Mess",
    address: data.address || "",
    description: data.description || "",
    inviteCode: data.inviteCode || code,
    memberCount: Number(data.memberCount || 1),
    ownerId: data.ownerId || "",
  };
}

/**
 * Joins an existing mess using its invitation code.
 * Prevents duplicate membership.
 */
export async function joinMessByCode(params: {
  inviteCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
}): Promise<Mess> {
  const preview = await lookupMessByInviteCode(params.inviteCode);
  if (!preview) {
    throw new Error("The invitation code is invalid or expired.");
  }

  const { messId } = preview;
  const nowIso = new Date().toISOString();

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const mess = state.messes[messId];
    if (!mess) throw new Error("The invitation code is invalid or expired.");

    const existingMember = state.members[messId]?.[params.userId];
    if (existingMember && existingMember.isActive) {
      await updateUserActiveMess(params.userId, messId);
      throw new Error("You are already a member of this mess.");
    }

    if (!state.members[messId]) state.members[messId] = {};
    state.members[messId][params.userId] = {
      uid: params.userId,
      messId,
      name: params.userName,
      email: params.userEmail,
      photoURL: params.userPhotoURL,
      role: "member",
      isActive: true,
      joinedAt: nowIso,
    };

    const activeCount = Object.values(state.members[messId]).filter(
      (m) => m.isActive
    ).length;
    mess.memberCount = activeCount;
    mess.updatedAt = nowIso;
    if (state.invitations[mess.inviteCode]) {
      state.invitations[mess.inviteCode].memberCount = activeCount;
    }

    saveLocalStore(state);
    await updateUserActiveMess(params.userId, messId);
    return mess;
  }

  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore is not initialized.");

  const memberRef = doc(db, "messes", messId, "members", params.userId);
  const existingSnap = await getDoc(memberRef);

  if (existingSnap.exists() && existingSnap.data()?.isActive !== false) {
    await updateUserActiveMess(params.userId, messId);
    throw new Error("You are already a member of this mess.");
  }

  const messRef = doc(db, "messes", messId);
  const messSnap = await getDoc(messRef);
  if (!messSnap.exists()) {
    throw new Error("The invitation code is invalid or expired.");
  }

  const messData = messSnap.data();
  const nextCount = Number(messData.memberCount || 1) + 1;

  const batch = writeBatch(db);
  batch.set(memberRef, {
    uid: params.userId,
    messId,
    name: params.userName,
    email: params.userEmail,
    photoURL: params.userPhotoURL || null,
    role: "member",
    isActive: true,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(messRef, {
    memberCount: nextCount,
    updatedAt: serverTimestamp(),
  });

  batch.set(
    doc(db, "users", params.userId),
    {
      uid: params.userId,
      name: params.userName,
      email: params.userEmail,
      photoURL: params.userPhotoURL || null,
      activeMessId: messId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  return {
    id: messId,
    name: messData.name,
    address: messData.address,
    description: messData.description || "",
    ownerId: messData.ownerId,
    inviteCode: messData.inviteCode,
    monthStartDay: Number(messData.monthStartDay || 1),
    activeMonthId: messData.activeMonthId || getCurrentMonthId(),
    defaultMealConfig: messData.defaultMealConfig || {
      breakfast: 1,
      lunch: 1,
      dinner: 1,
    },
    sharedExpenseSplitMode: messData.sharedExpenseSplitMode || "equal",
    allowMemberMealEntry: messData.allowMemberMealEntry !== false,
    memberCount: nextCount,
    createdAt: tsToIso(messData.createdAt),
    updatedAt: nowIso,
  };
}

// ============================================================================
// 2. Mess Settings & Member Role Management
// ============================================================================

export async function updateMessSettings(
  messId: string,
  updates: Partial<{
    name: string;
    address: string;
    description: string;
    monthStartDay: number;
    activeMonthId: string;
    defaultMealConfig: MealConfig;
    sharedExpenseSplitMode: SharedSplitMode;
    allowMemberMealEntry: boolean;
  }>
): Promise<void> {
  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const mess = state.messes[messId];
    if (!mess) throw new Error("You are not a member of this mess.");
    state.messes[messId] = {
      ...mess,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveLocalStore(state);
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;
  await updateDoc(doc(db, "messes", messId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function updateMemberRole(params: {
  messId: string;
  targetUserId: string;
  newRole: MessRole;
}): Promise<void> {
  const { messId, targetUserId, newRole } = params;
  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const member = state.members[messId]?.[targetUserId];
    if (!member) throw new Error("Member not found.");
    member.role = newRole;
    member.updatedAt = new Date().toISOString();
    saveLocalStore(state);
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;
  await updateDoc(doc(db, "messes", messId, "members", targetUserId), {
    role: newRole,
    updatedAt: serverTimestamp(),
  });
}

export async function removeMessMember(params: {
  messId: string;
  targetUserId: string;
}): Promise<void> {
  const { messId, targetUserId } = params;

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const member = state.members[messId]?.[targetUserId];
    if (!member) return;
    if (member.role === "owner") {
      throw new Error("Cannot remove the mess owner.");
    }
    delete state.members[messId][targetUserId];
    const activeCount = Object.values(state.members[messId]).filter(
      (m) => m.isActive
    ).length;
    if (state.messes[messId]) {
      state.messes[messId].memberCount = activeCount;
    }
    saveLocalStore(state);
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;
  const memberRef = doc(db, "messes", messId, "members", targetUserId);
  const snap = await getDoc(memberRef);
  if (snap.exists() && snap.data()?.role === "owner") {
    throw new Error("Cannot remove the mess owner.");
  }

  await deleteDoc(memberRef);
}

export async function deleteEntireMess(messId: string, ownerId: string): Promise<void> {
  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const mess = state.messes[messId];
    if (!mess || mess.ownerId !== ownerId) {
      throw new Error("You don't have permission to perform this action.");
    }
    delete state.invitations[mess.inviteCode];
    delete state.messes[messId];
    delete state.members[messId];
    delete state.months[messId];
    delete state.meals[messId];
    delete state.expenses[messId];
    delete state.payments[messId];
    saveLocalStore(state);
    await updateUserActiveMess(ownerId, null);
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;
  await deleteDoc(doc(db, "messes", messId));
  await updateUserActiveMess(ownerId, null);
}

// ============================================================================
// 3. Monthly Account Lifecycle (Open / Close / Reopen / Switch Month)
// ============================================================================

export async function ensureMonthExists(
  messId: string,
  monthId: string,
  sharedSplitMode: SharedSplitMode = "equal"
): Promise<MessMonth> {
  const nowIso = new Date().toISOString();

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    if (!state.months[messId]) state.months[messId] = {};
    const existing = state.months[messId][monthId];
    if (existing) return existing;

    const created: MessMonth = {
      id: monthId,
      messId,
      title: formatMonthTitle(monthId),
      status: "open",
      sharedSplitMode,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    state.months[messId][monthId] = created;
    saveLocalStore(state);
    return created;
  }

  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore is not initialized.");

  const monthRef = doc(db, "messes", messId, "months", monthId);
  const snap = await getDoc(monthRef);

  if (snap.exists()) {
    const d = snap.data();
    return {
      id: snap.id,
      messId,
      title: d.title || formatMonthTitle(monthId),
      status: d.status || "open",
      sharedSplitMode: d.sharedSplitMode || "equal",
      customSharedShares: d.customSharedShares || {},
      snapshot: d.snapshot || null,
      closedAt: d.closedAt ? tsToIso(d.closedAt) : null,
      closedBy: d.closedBy || null,
      closedByName: d.closedByName || null,
      reopenedAt: d.reopenedAt ? tsToIso(d.reopenedAt) : null,
      reopenedBy: d.reopenedBy || null,
      reopenedByName: d.reopenedByName || null,
      createdAt: tsToIso(d.createdAt),
      updatedAt: tsToIso(d.updatedAt),
    };
  }

  const created: MessMonth = {
    id: monthId,
    messId,
    title: formatMonthTitle(monthId),
    status: "open",
    sharedSplitMode,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await setDoc(monthRef, {
    ...created,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return created;
}

export async function closeMessMonth(params: {
  messId: string;
  monthId: string;
  closedBy: string;
  closedByName: string;
  snapshot: MonthClosedSnapshot;
}): Promise<void> {
  const { messId, monthId, closedBy, closedByName, snapshot } = params;
  const nowIso = new Date().toISOString();

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const month = state.months[messId]?.[monthId];
    if (!month) throw new Error("Month record not found.");
    month.status = "closed";
    month.closedAt = nowIso;
    month.closedBy = closedBy;
    month.closedByName = closedByName;
    month.snapshot = snapshot;
    month.updatedAt = nowIso;
    saveLocalStore(state);
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;

  await updateDoc(doc(db, "messes", messId, "months", monthId), {
    status: "closed",
    closedAt: serverTimestamp(),
    closedBy,
    closedByName,
    snapshot,
    updatedAt: serverTimestamp(),
  });
}

export async function reopenMessMonth(params: {
  messId: string;
  monthId: string;
  reopenedBy: string;
  reopenedByName: string;
}): Promise<void> {
  const { messId, monthId, reopenedBy, reopenedByName } = params;
  const nowIso = new Date().toISOString();

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const month = state.months[messId]?.[monthId];
    if (!month) throw new Error("Month record not found.");
    month.status = "open";
    month.reopenedAt = nowIso;
    month.reopenedBy = reopenedBy;
    month.reopenedByName = reopenedByName;
    month.updatedAt = nowIso;
    saveLocalStore(state);
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;

  await updateDoc(doc(db, "messes", messId, "months", monthId), {
    status: "open",
    reopenedAt: serverTimestamp(),
    reopenedBy,
    reopenedByName,
    updatedAt: serverTimestamp(),
  });
}

export async function updateMonthCustomSplit(params: {
  messId: string;
  monthId: string;
  sharedSplitMode: SharedSplitMode;
  customSharedShares: Record<string, number>;
}): Promise<void> {
  const { messId, monthId, sharedSplitMode, customSharedShares } = params;

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const month = state.months[messId]?.[monthId];
    if (!month) return;
    if (month.status === "closed") {
      throw new Error("This month is already closed.");
    }
    month.sharedSplitMode = sharedSplitMode;
    month.customSharedShares = customSharedShares;
    month.updatedAt = new Date().toISOString();
    saveLocalStore(state);
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;

  await updateDoc(doc(db, "messes", messId, "months", monthId), {
    sharedSplitMode,
    customSharedShares,
    updatedAt: serverTimestamp(),
  });
}

export async function listMessMonths(messId: string): Promise<MessMonth[]> {
  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const map = state.months[messId] || {};
    return Object.values(map).sort((a, b) => b.id.localeCompare(a.id));
  }

  const db = getFirebaseDb();
  if (!db) return [];

  const snap = await getDocs(collection(db, "messes", messId, "months"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        messId,
        title: data.title || formatMonthTitle(d.id),
        status: data.status || "open",
        sharedSplitMode: data.sharedSplitMode || "equal",
        customSharedShares: data.customSharedShares || {},
        snapshot: data.snapshot || null,
        closedAt: data.closedAt ? tsToIso(data.closedAt) : null,
        closedBy: data.closedBy || null,
        closedByName: data.closedByName || null,
        reopenedAt: data.reopenedAt ? tsToIso(data.reopenedAt) : null,
        reopenedBy: data.reopenedBy || null,
        reopenedByName: data.reopenedByName || null,
        createdAt: tsToIso(data.createdAt),
        updatedAt: tsToIso(data.updatedAt),
      } satisfies MessMonth;
    })
    .sort((a, b) => b.id.localeCompare(a.id));
}

// ============================================================================
// 4. Daily Meal Batch Operations (Phase 4)
// ============================================================================

/**
 * Saves daily meals for multiple members in a single atomic batch write.
 * Avoids per-stepper Firestore writes to stay well within free-tier quotas.
 */
export async function saveDailyMealsBatch(params: {
  messId: string;
  monthId: string;
  date: string;
  entries: MemberDailyMealInput[];
  updatedBy: string;
  isMonthClosed?: boolean;
}): Promise<void> {
  const { messId, monthId, date, entries, updatedBy, isMonthClosed } = params;

  if (isMonthClosed) {
    throw new Error("This month is already closed.");
  }

  const nowIso = new Date().toISOString();

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    if (state.months[messId]?.[monthId]?.status === "closed") {
      throw new Error("This month is already closed.");
    }
    if (!state.meals[messId]) state.meals[messId] = {};
    for (const entry of entries) {
      const mealId = `${date}_${entry.userId}`;
      const total = calculateDailyMealTotal(entry);
      state.meals[messId][mealId] = {
        id: mealId,
        messId,
        monthId,
        date,
        userId: entry.userId,
        memberName: entry.memberName,
        breakfast: entry.breakfast,
        lunch: entry.lunch,
        dinner: entry.dinner,
        total,
        updatedBy,
        updatedAt: nowIso,
      };
    }
    saveLocalStore(state);
    return;
  }

  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore is not initialized.");

  const batch = writeBatch(db);
  for (const entry of entries) {
    const mealId = `${date}_${entry.userId}`;
    const total = calculateDailyMealTotal(entry);
    const mealRef = doc(db, "messes", messId, "meals", mealId);
    batch.set(
      mealRef,
      {
        id: mealId,
        messId,
        monthId,
        date,
        userId: entry.userId,
        memberName: entry.memberName,
        breakfast: entry.breakfast,
        lunch: entry.lunch,
        dinner: entry.dinner,
        total,
        updatedBy,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();
}

export async function getMealsForDate(
  messId: string,
  date: string
): Promise<DailyMealEntry[]> {
  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const all = Object.values(state.meals[messId] || {});
    return all.filter((m) => m.date === date);
  }

  const db = getFirebaseDb();
  if (!db) return [];

  const q = query(
    collection(db, "messes", messId, "meals"),
    where("date", "==", date)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      messId,
      monthId: data.monthId,
      date: data.date,
      userId: data.userId,
      memberName: data.memberName || "Member",
      breakfast: Number(data.breakfast || 0),
      lunch: Number(data.lunch || 0),
      dinner: Number(data.dinner || 0),
      total: Number(data.total || 0),
      updatedBy: data.updatedBy || "",
      updatedAt: tsToIso(data.updatedAt),
    };
  });
}

// ============================================================================
// 5. Expense CRUD Operations (Phase 5)
// ============================================================================

export async function addMessExpense(params: {
  id?: string;
  messId: string;
  monthId: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  paidBy: string;
  paidByName: string;
  expenseType: ExpenseType;
  splitMode?: SharedSplitMode;
  customShares?: Record<string, number>;
  description: string;
  receiptUrl?: string | null;
  createdBy: string;
  isMonthClosed?: boolean;
}): Promise<MessExpense> {
  if (params.isMonthClosed) {
    throw new Error("This month is already closed.");
  }

  const nowIso = new Date().toISOString();
  const expenseId = params.id || `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const record: MessExpense = {
    id: expenseId,
    messId: params.messId,
    monthId: params.monthId,
    date: params.date,
    category: params.category,
    amount: Number(params.amount),
    paidBy: params.paidBy,
    paidByName: params.paidByName,
    expenseType: params.expenseType,
    splitMode: params.splitMode || "equal",
    customShares: params.customShares || undefined,
    description: params.description.trim(),
    receiptUrl: params.receiptUrl || null,
    createdBy: params.createdBy,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    if (state.months[params.messId]?.[params.monthId]?.status === "closed") {
      throw new Error("This month is already closed.");
    }
    if (!state.expenses[params.messId]) state.expenses[params.messId] = {};
    state.expenses[params.messId][expenseId] = record;
    saveLocalStore(state);
    return record;
  }

  const db = getFirebaseDb();
  if (!db) throw new Error("Unable to save expense. Please try again.");

  const expRef = doc(db, "messes", params.messId, "expenses", expenseId);
  await setDoc(expRef, {
    ...record,
    customShares: record.customShares || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return record;
}

export async function updateMessExpense(params: {
  expenseId: string;
  messId: string;
  monthId: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  paidBy: string;
  paidByName: string;
  expenseType: ExpenseType;
  splitMode?: SharedSplitMode;
  customShares?: Record<string, number>;
  description: string;
  receiptUrl?: string | null;
  isMonthClosed?: boolean;
}): Promise<void> {
  if (params.isMonthClosed) {
    throw new Error("This month is already closed.");
  }

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    if (state.months[params.messId]?.[params.monthId]?.status === "closed") {
      throw new Error("This month is already closed.");
    }
    const existing = state.expenses[params.messId]?.[params.expenseId];
    if (!existing) throw new Error("Expense not found.");
    state.expenses[params.messId][params.expenseId] = {
      ...existing,
      date: params.date,
      monthId: params.monthId,
      category: params.category,
      amount: Number(params.amount),
      paidBy: params.paidBy,
      paidByName: params.paidByName,
      expenseType: params.expenseType,
      splitMode: params.splitMode || "equal",
      customShares: params.customShares,
      description: params.description.trim(),
      receiptUrl:
        params.receiptUrl !== undefined ? params.receiptUrl : existing.receiptUrl,
      updatedAt: new Date().toISOString(),
    };
    saveLocalStore(state);
    return;
  }

  const db = getFirebaseDb();
  if (!db) throw new Error("Unable to save expense. Please try again.");

  const expRef = doc(db, "messes", params.messId, "expenses", params.expenseId);
  await updateDoc(expRef, {
    date: params.date,
    monthId: params.monthId,
    category: params.category,
    amount: Number(params.amount),
    paidBy: params.paidBy,
    paidByName: params.paidByName,
    expenseType: params.expenseType,
    splitMode: params.splitMode || "equal",
    customShares: params.customShares || null,
    description: params.description.trim(),
    ...(params.receiptUrl !== undefined ? { receiptUrl: params.receiptUrl } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMessExpense(params: {
  messId: string;
  monthId: string;
  expenseId: string;
  isMonthClosed?: boolean;
}): Promise<void> {
  if (params.isMonthClosed) {
    throw new Error("This month is already closed.");
  }

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    if (state.months[params.messId]?.[params.monthId]?.status === "closed") {
      throw new Error("This month is already closed.");
    }
    if (state.expenses[params.messId]) {
      delete state.expenses[params.messId][params.expenseId];
      saveLocalStore(state);
    }
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;
  await deleteDoc(doc(db, "messes", params.messId, "expenses", params.expenseId));
}

/**
 * Paginated one-time query for historical expenses (minimizes Firestore reads).
 */
export async function fetchPaginatedExpenses(params: {
  messId: string;
  monthId: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<{
  items: MessExpense[];
  nextCursor: QueryDocumentSnapshot<DocumentData> | null;
}> {
  const { messId, monthId, pageSize = 25, cursor } = params;

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    const list = Object.values(state.expenses[messId] || {})
      .filter((e) => e.monthId === monthId)
      .sort((a, b) => b.date.localeCompare(a.date));
    return { items: list.slice(0, pageSize), nextCursor: null };
  }

  const db = getFirebaseDb();
  if (!db) return { items: [], nextCursor: null };

  const baseQuery = cursor
    ? query(
        collection(db, "messes", messId, "expenses"),
        where("monthId", "==", monthId),
        orderBy("date", "desc"),
        startAfter(cursor),
        limit(pageSize)
      )
    : query(
        collection(db, "messes", messId, "expenses"),
        where("monthId", "==", monthId),
        orderBy("date", "desc"),
        limit(pageSize)
      );

  const snap = await getDocs(baseQuery);
  const items: MessExpense[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      messId,
      monthId: data.monthId,
      date: data.date,
      category: data.category,
      amount: Number(data.amount || 0),
      paidBy: data.paidBy,
      paidByName: data.paidByName || "Member",
      expenseType: data.expenseType || "meal",
      splitMode: data.splitMode || "equal",
      customShares: data.customShares || undefined,
      description: data.description || "",
      receiptUrl: data.receiptUrl || null,
      createdBy: data.createdBy || "",
      createdAt: tsToIso(data.createdAt),
      updatedAt: tsToIso(data.updatedAt),
    };
  });

  const nextCursor =
    snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
}

// ============================================================================
// 6. Payment CRUD Operations (Phase 6)
// ============================================================================

export async function addMessPayment(params: {
  messId: string;
  monthId: string;
  date: string;
  userId: string;
  memberName: string;
  amount: number;
  method: PaymentMethod;
  note: string;
  createdBy: string;
  isMonthClosed?: boolean;
}): Promise<MessPayment> {
  if (params.isMonthClosed) {
    throw new Error("This month is already closed.");
  }

  const nowIso = new Date().toISOString();
  const paymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const record: MessPayment = {
    id: paymentId,
    messId: params.messId,
    monthId: params.monthId,
    date: params.date,
    userId: params.userId,
    memberName: params.memberName,
    amount: Number(params.amount),
    method: params.method,
    note: params.note.trim(),
    createdBy: params.createdBy,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    if (state.months[params.messId]?.[params.monthId]?.status === "closed") {
      throw new Error("This month is already closed.");
    }
    if (!state.payments[params.messId]) state.payments[params.messId] = {};
    state.payments[params.messId][paymentId] = record;
    saveLocalStore(state);
    return record;
  }

  const db = getFirebaseDb();
  if (!db) throw new Error("Unable to save payment. Please try again.");

  const payRef = doc(db, "messes", params.messId, "payments", paymentId);
  await setDoc(payRef, {
    ...record,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return record;
}

export async function updateMessPayment(params: {
  paymentId: string;
  messId: string;
  monthId: string;
  date: string;
  userId: string;
  memberName: string;
  amount: number;
  method: PaymentMethod;
  note: string;
  isMonthClosed?: boolean;
}): Promise<void> {
  if (params.isMonthClosed) {
    throw new Error("This month is already closed.");
  }

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    if (state.months[params.messId]?.[params.monthId]?.status === "closed") {
      throw new Error("This month is already closed.");
    }
    const existing = state.payments[params.messId]?.[params.paymentId];
    if (!existing) throw new Error("Payment not found.");
    state.payments[params.messId][params.paymentId] = {
      ...existing,
      date: params.date,
      monthId: params.monthId,
      userId: params.userId,
      memberName: params.memberName,
      amount: Number(params.amount),
      method: params.method,
      note: params.note.trim(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalStore(state);
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;

  await updateDoc(doc(db, "messes", params.messId, "payments", params.paymentId), {
    date: params.date,
    monthId: params.monthId,
    userId: params.userId,
    memberName: params.memberName,
    amount: Number(params.amount),
    method: params.method,
    note: params.note.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMessPayment(params: {
  messId: string;
  monthId: string;
  paymentId: string;
  isMonthClosed?: boolean;
}): Promise<void> {
  if (params.isMonthClosed) {
    throw new Error("This month is already closed.");
  }

  if (!isFirebaseConfigured) {
    const state = getLocalStore();
    if (state.months[params.messId]?.[params.monthId]?.status === "closed") {
      throw new Error("This month is already closed.");
    }
    if (state.payments[params.messId]) {
      delete state.payments[params.messId][params.paymentId];
      saveLocalStore(state);
    }
    return;
  }

  const db = getFirebaseDb();
  if (!db) return;
  await deleteDoc(doc(db, "messes", params.messId, "payments", params.paymentId));
}

// ============================================================================
// 7. Scoped Real-Time Subscriptions (Minimized Firestore Reads)
// ============================================================================

export function subscribeToMessAndMembers(
  messId: string,
  callbacks: {
    onMess: (mess: Mess | null) => void;
    onMembers: (members: MessMember[]) => void;
    onMonth: (month: MessMonth | null) => void;
  },
  selectedMonthId?: string
): () => void {
  if (!isFirebaseConfigured) {
    const emit = () => {
      const state = getLocalStore();
      const mess = state.messes[messId] || null;
      callbacks.onMess(mess);
      const members = Object.values(state.members[messId] || {}).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      callbacks.onMembers(members);
      const targetMonthId = selectedMonthId || mess?.activeMonthId || getCurrentMonthId();
      const month = state.months[messId]?.[targetMonthId] || {
        id: targetMonthId,
        messId,
        title: formatMonthTitle(targetMonthId),
        status: "open",
        sharedSplitMode: mess?.sharedExpenseSplitMode || "equal",
        createdAt: getTodayDateString(),
        updatedAt: getTodayDateString(),
      };
      callbacks.onMonth(month);
    };
    localListeners.add(emit);
    emit();
    return () => {
      localListeners.delete(emit);
    };
  }

  const db = getFirebaseDb();
  if (!db) return () => {};

  const unsubMess = onSnapshot(doc(db, "messes", messId), (snap) => {
    if (!snap.exists()) {
      callbacks.onMess(null);
      return;
    }
    const d = snap.data();
    callbacks.onMess({
      id: snap.id,
      name: d.name || "Mess",
      address: d.address || "",
      description: d.description || "",
      ownerId: d.ownerId || "",
      inviteCode: d.inviteCode || "",
      monthStartDay: Number(d.monthStartDay || 1),
      activeMonthId: d.activeMonthId || getCurrentMonthId(),
      defaultMealConfig: d.defaultMealConfig || {
        breakfast: 1,
        lunch: 1,
        dinner: 1,
      },
      sharedExpenseSplitMode: d.sharedExpenseSplitMode || "equal",
      allowMemberMealEntry: d.allowMemberMealEntry !== false,
      memberCount: Number(d.memberCount || 1),
      createdAt: tsToIso(d.createdAt),
      updatedAt: tsToIso(d.updatedAt),
    });
  });

  const unsubMembers = onSnapshot(
    collection(db, "messes", messId, "members"),
    (snap) => {
      const list: MessMember[] = snap.docs
        .map((docSnap) => {
          const d = docSnap.data();
          return {
            uid: docSnap.id,
            messId,
            name: d.name || "Member",
            email: d.email || "",
            photoURL: d.photoURL || undefined,
            role: (d.role as MessRole) || "member",
            isActive: d.isActive !== false,
            customSharedAmount:
              typeof d.customSharedAmount === "number"
                ? d.customSharedAmount
                : undefined,
            joinedAt: tsToIso(d.joinedAt),
            updatedAt: tsToIso(d.updatedAt),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      callbacks.onMembers(list);
    }
  );

  const monthIdToWatch = selectedMonthId || getCurrentMonthId();
  const unsubMonth = onSnapshot(
    doc(db, "messes", messId, "months", monthIdToWatch),
    (snap) => {
      if (!snap.exists()) {
        callbacks.onMonth({
          id: monthIdToWatch,
          messId,
          title: formatMonthTitle(monthIdToWatch),
          status: "open",
          sharedSplitMode: "equal",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return;
      }
      const d = snap.data();
      callbacks.onMonth({
        id: snap.id,
        messId,
        title: d.title || formatMonthTitle(snap.id),
        status: d.status || "open",
        sharedSplitMode: d.sharedSplitMode || "equal",
        customSharedShares: d.customSharedShares || {},
        snapshot: d.snapshot || null,
        closedAt: d.closedAt ? tsToIso(d.closedAt) : null,
        closedBy: d.closedBy || null,
        closedByName: d.closedByName || null,
        reopenedAt: d.reopenedAt ? tsToIso(d.reopenedAt) : null,
        reopenedBy: d.reopenedBy || null,
        reopenedByName: d.reopenedByName || null,
        createdAt: tsToIso(d.createdAt),
        updatedAt: tsToIso(d.updatedAt),
      });
    }
  );

  return () => {
    unsubMess();
    unsubMembers();
    unsubMonth();
  };
}

export function subscribeToMonthMeals(
  messId: string,
  monthId: string,
  onMeals: (meals: DailyMealEntry[]) => void
): () => void {
  if (!isFirebaseConfigured) {
    const emit = () => {
      const state = getLocalStore();
      const list = Object.values(state.meals[messId] || {}).filter(
        (m) => m.monthId === monthId
      );
      onMeals(list);
    };
    localListeners.add(emit);
    emit();
    return () => {
      localListeners.delete(emit);
    };
  }

  const db = getFirebaseDb();
  if (!db) return () => {};

  const q = query(
    collection(db, "messes", messId, "meals"),
    where("monthId", "==", monthId)
  );

  return onSnapshot(q, (snap) => {
    const list: DailyMealEntry[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        messId,
        monthId: data.monthId,
        date: data.date,
        userId: data.userId,
        memberName: data.memberName || "Member",
        breakfast: Number(data.breakfast || 0),
        lunch: Number(data.lunch || 0),
        dinner: Number(data.dinner || 0),
        total: Number(data.total || 0),
        updatedBy: data.updatedBy || "",
        updatedAt: tsToIso(data.updatedAt),
      };
    });
    onMeals(list);
  });
}

export function subscribeToMonthExpenses(
  messId: string,
  monthId: string,
  onExpenses: (expenses: MessExpense[]) => void
): () => void {
  if (!isFirebaseConfigured) {
    const emit = () => {
      const state = getLocalStore();
      const list = Object.values(state.expenses[messId] || {})
        .filter((e) => e.monthId === monthId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      onExpenses(list);
    };
    localListeners.add(emit);
    emit();
    return () => {
      localListeners.delete(emit);
    };
  }

  const db = getFirebaseDb();
  if (!db) return () => {};

  const q = query(
    collection(db, "messes", messId, "expenses"),
    where("monthId", "==", monthId)
  );

  return onSnapshot(q, (snap) => {
    const list: MessExpense[] = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          messId,
          monthId: data.monthId,
          date: data.date,
          category: data.category,
          amount: Number(data.amount || 0),
          paidBy: data.paidBy,
          paidByName: data.paidByName || "Member",
          expenseType: data.expenseType || "meal",
          splitMode: data.splitMode || "equal",
          customShares: data.customShares || undefined,
          description: data.description || "",
          receiptUrl: data.receiptUrl || null,
          createdBy: data.createdBy || "",
          createdAt: tsToIso(data.createdAt),
          updatedAt: tsToIso(data.updatedAt),
        };
      })
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );
    onExpenses(list);
  });
}

export function subscribeToMonthPayments(
  messId: string,
  monthId: string,
  onPayments: (payments: MessPayment[]) => void
): () => void {
  if (!isFirebaseConfigured) {
    const emit = () => {
      const state = getLocalStore();
      const list = Object.values(state.payments[messId] || {})
        .filter((p) => p.monthId === monthId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      onPayments(list);
    };
    localListeners.add(emit);
    emit();
    return () => {
      localListeners.delete(emit);
    };
  }

  const db = getFirebaseDb();
  if (!db) return () => {};

  const q = query(
    collection(db, "messes", messId, "payments"),
    where("monthId", "==", monthId)
  );

  return onSnapshot(q, (snap) => {
    const list: MessPayment[] = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          messId,
          monthId: data.monthId,
          date: data.date,
          userId: data.userId,
          memberName: data.memberName || "Member",
          amount: Number(data.amount || 0),
          method: data.method || "cash",
          note: data.note || "",
          createdBy: data.createdBy || "",
          createdAt: tsToIso(data.createdAt),
          updatedAt: tsToIso(data.updatedAt),
        };
      })
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );
    onPayments(list);
  });
}

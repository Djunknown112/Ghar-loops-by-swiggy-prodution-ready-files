import { db, auth, googleProvider, signInWithPopup, signOut } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { UserProfile, ScheduleItem, OrderRecord, ApprovalRequest, AppNotification } from "../types";
import { mockProducts } from "../data/mockProducts";

// --- MOCK PRE-POPULATED DATA FOR NEW USER & GUEST MODE ---
export const DEFAULT_PROFILE: UserProfile = {
  uid: "guest-user",
  displayName: "Dheeraj Joshi",
  email: "guest@gharloop.com",
  phoneNumber: "+919876543210",
  monthlyBudget: 5500,
  persona: "Family Planner",
  developerMode: false,
  hasSeenOnboarding: false,
  hasSetupProfile: false
};

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  {
    id: "sch_01",
    productId: "im_milk_01",
    productName: "Nandini Fresh Pasteurized Milk",
    brand: "Nandini",
    price: 27,
    unit: "500 ml",
    category: "Groceries",
    quantity: 2,
    frequency: "Daily",
    nextDue: new Date().toISOString().split("T")[0], // Today
    automationLevel: "Auto-order"
  },
  {
    id: "sch_02",
    productId: "im_toor_01",
    productName: "Tata Sampann Unpolished Toor Dal",
    brand: "Tata Sampann",
    price: 185,
    unit: "1 kg",
    category: "Groceries",
    quantity: 1,
    frequency: "Monthly",
    nextDue: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
    automationLevel: "Ask me first"
  },
  {
    id: "sch_03",
    productId: "med_para_01",
    productName: "Crocin Advance 650mg Paracetamol",
    brand: "Crocin",
    price: 32,
    unit: "15 tablets",
    category: "Medicines",
    quantity: 1,
    frequency: "Monthly",
    nextDue: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
    automationLevel: "Remind me"
  },
  {
    id: "sch_04",
    productId: "im_butter_01",
    productName: "Amul Butter Pasteurized",
    brand: "Amul",
    price: 56,
    unit: "100 g",
    category: "Groceries",
    quantity: 1,
    frequency: "Weekly",
    nextDue: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    automationLevel: "Auto-order"
  },
  {
    id: "sch_05",
    productId: "sub_coconut_daily",
    name: "Tender Coconut Water Subscription",
    brand: "Organic Farms",
    price: 65,
    unit: "1 Piece per day",
    category: "Subscriptions",
    quantity: 1,
    frequency: "Daily",
    nextDue: new Date().toISOString().split("T")[0], // Today
    automationLevel: "Auto-order"
  } as any // Cast for ease, mapped in components safely
];

// Mock Order History of last 30 days totaling ~3,200 INR (so progress ring shows 58%)
export const INITIAL_ORDER_HISTORY: OrderRecord[] = [
  {
    id: "ord_01",
    productName: "Nandini Fresh Pasteurized Milk",
    brand: "Nandini",
    price: 27,
    quantity: 2,
    date: "2026-06-10",
    category: "Groceries"
  },
  {
    id: "ord_02",
    productName: "Tata Sampann Unpolished Toor Dal",
    brand: "Tata Sampann",
    price: 185,
    quantity: 1,
    date: "2026-06-12",
    category: "Groceries"
  },
  {
    id: "ord_03",
    productName: "Ghee Masala Dosa with Sambar",
    brand: "MTR Restaurant",
    price: 120,
    quantity: 2,
    date: "2026-06-14",
    category: "Meals"
  },
  {
    id: "ord_04",
    productName: "Butter Chicken with 2 Butter Naan",
    brand: "Moti Mahal Deluxe",
    price: 299,
    quantity: 1,
    date: "2026-06-18",
    category: "Meals"
  },
  {
    id: "ord_05",
    productName: "Crocin Advance 650mg Paracetamol",
    brand: "Crocin",
    price: 32,
    quantity: 1,
    date: "2026-06-20",
    category: "Medicines"
  },
  {
    id: "ord_06",
    productName: "Daily Amul Gold Milk Subscription",
    brand: "Amul Daily",
    price: 66,
    quantity: 1,
    date: "2026-06-22",
    category: "Subscriptions"
  },
  {
    id: "ord_07",
    productName: "Weekly Organic Salad & Veggie Basket",
    brand: "Instamart Green",
    price: 299,
    quantity: 3, // 3 orders placed in 3 weeks
    date: "2026-06-25",
    category: "Subscriptions"
  },
  {
    id: "ord_08",
    productName: "Nandini Fresh Pasteurized Milk",
    brand: "Nandini",
    price: 27,
    quantity: 2,
    date: "2026-06-28",
    category: "Groceries"
  }
];

export const INITIAL_APPROVALS: ApprovalRequest[] = [
  {
    id: "app_01",
    itemId: "sch_02",
    productName: "Tata Sampann Unpolished Toor Dal",
    brand: "Tata Sampann",
    price: 185,
    quantity: 1,
    category: "Groceries",
    status: "pending",
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0]
  },
  {
    id: "app_02",
    itemId: "food_pizza_01", // Mock pizza ordering
    productName: "Double Cheese Margherita Pizza (Medium)",
    brand: "La Pinoz",
    price: 279,
    quantity: 1,
    category: "Meals",
    status: "pending",
    createdAt: new Date().toISOString(),
    dueDate: new Date().toISOString().split("T")[0]
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "not_01",
    message: "Reminder: Paracetamol stock-up is due today.",
    createdAt: new Date().toISOString(),
    read: false,
    type: "reminder"
  },
  {
    id: "not_02",
    message: "Auto-ordered Nandini Milk (2x). Placed via Instamart.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    type: "auto_order"
  }
];

// --- LOCAL STORAGE HELPERS FOR GUEST MODE ---
const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
};

const setLocalStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// --- AUTHENTICATED USER GUARD ---
const checkAuthUser = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Authentication Error: You must be signed in to perform this action.");
  }
  return user.uid;
};

// --- CORE DB AND AUTH SERVICE ---
export const dbService = {
  // Authentication Actions
  async signInWithGoogle(): Promise<UserProfile> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user document already exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let profile: UserProfile;
    if (userSnap.exists()) {
      profile = userSnap.data() as UserProfile;
    } else {
      // Create new user profile — genuinely empty, no hasSetupProfile until they complete it
      profile = {
        uid: user.uid,
        displayName: user.displayName || "GharLoop Resident",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        monthlyBudget: 5500,
        persona: "Family Planner",
        developerMode: false,
        hasSeenOnboarding: false,
        hasSetupProfile: false
      };
      await setDoc(userRef, profile);
    }
    return profile;
    // NOTE: intentionally no try/catch here — if sign-in fails, the error
    // should propagate to the UI so the user sees a real error message,
    // not be silently logged in as a fake guest profile.
  },

  async signOutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase Sign-Out failed:", error);
    }
  },

  // Profile management
  async getUserProfile(isGuest: boolean, uid?: string): Promise<UserProfile> {
    if (isGuest || !uid) {
      return getLocalStorage<UserProfile>("gharloop_profile", DEFAULT_PROFILE);
    }
    
    // Auth guard
    checkAuthUser();
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      } else {
        // Create profile if missing
        const newProfile: UserProfile = {
          uid,
          displayName: auth.currentUser?.displayName || "User",
          email: auth.currentUser?.email || "",
          phoneNumber: auth.currentUser?.phoneNumber || "",
          monthlyBudget: 5500,
          persona: "Family Planner",
          hasSeenOnboarding: false,
          hasSetupProfile: false
        };
        await setDoc(userRef, newProfile);
        return newProfile;
      }
    } catch (e) {
      console.warn("Firestore error getting profile, using local:", e);
      return getLocalStorage<UserProfile>("gharloop_profile", DEFAULT_PROFILE);
    }
  },

  async updateUserProfile(isGuest: boolean, profile: Partial<UserProfile>): Promise<UserProfile> {
    if (isGuest) {
      const current = getLocalStorage<UserProfile>("gharloop_profile", DEFAULT_PROFILE);
      const updated = { ...current, ...profile };
      setLocalStorage("gharloop_profile", updated);
      return updated;
    }

    const uid = checkAuthUser();
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, profile, { merge: true });
      const snap = await getDoc(userRef);
      return snap.data() as UserProfile;
    } catch (e) {
      console.error("Firestore error updating profile:", e);
      const current = getLocalStorage<UserProfile>("gharloop_profile", DEFAULT_PROFILE);
      const updated = { ...current, ...profile };
      setLocalStorage("gharloop_profile", updated);
      return updated;
    }
  },

  // Schedule management
  async getSchedules(isGuest: boolean): Promise<ScheduleItem[]> {
    if (isGuest) {
      return getLocalStorage<ScheduleItem[]>("gharloop_schedules", INITIAL_SCHEDULE);
    }

    const uid = checkAuthUser();
    try {
      const colRef = collection(db, "users", uid, "schedule");
      const snap = await getDocs(colRef);
      const items: ScheduleItem[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ScheduleItem);
      });
      // Real users start with a genuinely empty schedule — no mock seeding.
      return items;
    } catch (e) {
      console.warn("Firestore error getting schedules, using local:", e);
      return getLocalStorage<ScheduleItem[]>("gharloop_schedules", []);
    }
  },

  async addScheduleItem(isGuest: boolean, item: Omit<ScheduleItem, "id">): Promise<ScheduleItem> {
    const id = "sch_" + Date.now().toString(36);
    const newItem: ScheduleItem = { id, ...item };

    if (isGuest) {
      const current = getLocalStorage<ScheduleItem[]>("gharloop_schedules", INITIAL_SCHEDULE);
      const updated = [newItem, ...current];
      setLocalStorage("gharloop_schedules", updated);
      return newItem;
    }

    const uid = checkAuthUser();
    try {
      await setDoc(doc(db, "users", uid, "schedule", id), newItem);
      return newItem;
    } catch (e) {
      console.error("Firestore add item error:", e);
      const current = getLocalStorage<ScheduleItem[]>("gharloop_schedules", INITIAL_SCHEDULE);
      const updated = [newItem, ...current];
      setLocalStorage("gharloop_schedules", updated);
      return newItem;
    }
  },

  async updateScheduleItem(isGuest: boolean, itemId: string, itemUpdates: Partial<ScheduleItem>): Promise<void> {
    if (isGuest) {
      const current = getLocalStorage<ScheduleItem[]>("gharloop_schedules", INITIAL_SCHEDULE);
      const updated = current.map((i) => (i.id === itemId ? { ...i, ...itemUpdates } : i));
      setLocalStorage("gharloop_schedules", updated);
      return;
    }

    const uid = checkAuthUser();
    try {
      await updateDoc(doc(db, "users", uid, "schedule", itemId), itemUpdates);
    } catch (e) {
      console.error("Firestore update schedule error:", e);
      const current = getLocalStorage<ScheduleItem[]>("gharloop_schedules", INITIAL_SCHEDULE);
      const updated = current.map((i) => (i.id === itemId ? { ...i, ...itemUpdates } : i));
      setLocalStorage("gharloop_schedules", updated);
    }
  },

  async deleteScheduleItem(isGuest: boolean, itemId: string): Promise<void> {
    if (isGuest) {
      const current = getLocalStorage<ScheduleItem[]>("gharloop_schedules", INITIAL_SCHEDULE);
      const updated = current.filter((i) => i.id !== itemId);
      setLocalStorage("gharloop_schedules", updated);
      return;
    }

    const uid = checkAuthUser();
    try {
      await deleteDoc(doc(db, "users", uid, "schedule", itemId));
    } catch (e) {
      console.error("Firestore delete schedule error:", e);
      const current = getLocalStorage<ScheduleItem[]>("gharloop_schedules", INITIAL_SCHEDULE);
      const updated = current.filter((i) => i.id !== itemId);
      setLocalStorage("gharloop_schedules", updated);
    }
  },

  // Order history
  async getOrderHistory(isGuest: boolean): Promise<OrderRecord[]> {
    if (isGuest) {
      return getLocalStorage<OrderRecord[]>("gharloop_orders", INITIAL_ORDER_HISTORY);
    }

    const uid = checkAuthUser();
    try {
      const colRef = collection(db, "users", uid, "orderHistory");
      const snap = await getDocs(colRef);
      const items: OrderRecord[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as OrderRecord);
      });
      // Real users start with genuinely empty order history — no mock seeding.
      return items.sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) {
      console.warn("Firestore error getting orders, using local:", e);
      return getLocalStorage<OrderRecord[]>("gharloop_orders", []).sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async addOrderRecord(isGuest: boolean, order: Omit<OrderRecord, "id">): Promise<OrderRecord> {
    const id = "ord_" + Date.now().toString(36);
    const newOrder: OrderRecord = { id, ...order };

    if (isGuest) {
      const current = getLocalStorage<OrderRecord[]>("gharloop_orders", INITIAL_ORDER_HISTORY);
      const updated = [newOrder, ...current];
      setLocalStorage("gharloop_orders", updated);
      return newOrder;
    }

    const uid = checkAuthUser();
    try {
      await setDoc(doc(db, "users", uid, "orderHistory", id), newOrder);
      return newOrder;
    } catch (e) {
      console.error("Firestore add order error:", e);
      const current = getLocalStorage<OrderRecord[]>("gharloop_orders", INITIAL_ORDER_HISTORY);
      const updated = [newOrder, ...current];
      setLocalStorage("gharloop_orders", updated);
      return newOrder;
    }
  },

  // Approvals management
  async getApprovals(isGuest: boolean): Promise<ApprovalRequest[]> {
    if (isGuest) {
      return getLocalStorage<ApprovalRequest[]>("gharloop_approvals", INITIAL_APPROVALS);
    }

    const uid = checkAuthUser();
    try {
      const colRef = collection(db, "users", uid, "approvals");
      const snap = await getDocs(colRef);
      const items: ApprovalRequest[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ApprovalRequest);
      });
      // Real users start with genuinely empty approvals — no mock seeding.
      return items;
    } catch (e) {
      console.warn("Firestore error getting approvals, using local:", e);
      return getLocalStorage<ApprovalRequest[]>("gharloop_approvals", []);
    }
  },

  async addApprovalRequest(isGuest: boolean, appReq: Omit<ApprovalRequest, "id">): Promise<ApprovalRequest> {
    const id = "app_" + Date.now().toString(36);
    const newRequest: ApprovalRequest = { id, ...appReq };

    if (isGuest) {
      const current = getLocalStorage<ApprovalRequest[]>("gharloop_approvals", INITIAL_APPROVALS);
      const updated = [newRequest, ...current];
      setLocalStorage("gharloop_approvals", updated);
      return newRequest;
    }

    const uid = checkAuthUser();
    try {
      await setDoc(doc(db, "users", uid, "approvals", id), newRequest);
      return newRequest;
    } catch (e) {
      console.error("Firestore add approval error:", e);
      const current = getLocalStorage<ApprovalRequest[]>("gharloop_approvals", INITIAL_APPROVALS);
      const updated = [newRequest, ...current];
      setLocalStorage("gharloop_approvals", updated);
      return newRequest;
    }
  },

  async updateApprovalStatus(isGuest: boolean, approvalId: string, status: "pending" | "approved" | "skipped" | "rescheduled"): Promise<void> {
    if (isGuest) {
      const current = getLocalStorage<ApprovalRequest[]>("gharloop_approvals", INITIAL_APPROVALS);
      const updated = current.map((a) => (a.id === approvalId ? { ...a, status } : a));
      setLocalStorage("gharloop_approvals", updated);
      return;
    }

    const uid = checkAuthUser();
    try {
      await updateDoc(doc(db, "users", uid, "approvals", approvalId), { status });
    } catch (e) {
      console.error("Firestore update approval error:", e);
      const current = getLocalStorage<ApprovalRequest[]>("gharloop_approvals", INITIAL_APPROVALS);
      const updated = current.map((a) => (a.id === approvalId ? { ...a, status } : a));
      setLocalStorage("gharloop_approvals", updated);
    }
  },

  async getNotifications(isGuest: boolean): Promise<AppNotification[]> {
    if (isGuest) {
      return getLocalStorage<AppNotification[]>("gharloop_notifications", INITIAL_NOTIFICATIONS);
    }

    const uid = checkAuthUser();
    try {
      const colRef = collection(db, "users", uid, "notifications");
      const snap = await getDocs(colRef);
      const items: AppNotification[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
      });
      // Real users start with genuinely empty notifications — no mock seeding.
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (e) {
      console.warn("Firestore error getting notifications, using local:", e);
      return getLocalStorage<AppNotification[]>("gharloop_notifications", []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  async addNotificationRecord(isGuest: boolean, notification: Omit<AppNotification, "id">): Promise<AppNotification> {
    const id = "not_" + Math.random().toString(36).substring(2, 11);
    const newNotification: AppNotification = { id, ...notification };

    if (isGuest) {
      const current = getLocalStorage<AppNotification[]>("gharloop_notifications", INITIAL_NOTIFICATIONS);
      const updated = [newNotification, ...current].slice(0, 50);
      setLocalStorage("gharloop_notifications", updated);
      return newNotification;
    }

    const uid = checkAuthUser();
    try {
      await setDoc(doc(db, "users", uid, "notifications", id), newNotification);
      return newNotification;
    } catch (e) {
      console.error("Firestore add notification error:", e);
      const current = getLocalStorage<AppNotification[]>("gharloop_notifications", INITIAL_NOTIFICATIONS);
      const updated = [newNotification, ...current].slice(0, 50);
      setLocalStorage("gharloop_notifications", updated);
      return newNotification;
    }
  }
};

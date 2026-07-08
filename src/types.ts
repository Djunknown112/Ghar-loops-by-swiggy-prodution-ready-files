export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  monthlyBudget: number;
  persona: "Single Professional" | "Family Planner" | "Student" | "Elderly Caretaker" | "Hostel Student" | "Young Professional" | "Family" | "Fitness";
  developerMode?: boolean;
  hasSeenOnboarding?: boolean;
  hasSetupProfile?: boolean;
}

export type Frequency = "Daily" | "Weekly" | "Monthly" | "Custom";

export type AutomationLevel = "Remind me" | "Ask me first" | "Auto-order";

export interface ScheduleItem {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  price: number;
  unit: string;
  category: "Groceries" | "Meals" | "Medicines" | "Subscriptions";
  quantity: number;
  frequency: Frequency;
  nextDue: string; // YYYY-MM-DD
  automationLevel: AutomationLevel;
  customIntervalDays?: number;
}

export interface OrderRecord {
  id: string;
  productName: string;
  brand: string;
  price: number;
  quantity: number;
  date: string; // YYYY-MM-DD
  category: "Groceries" | "Meals" | "Medicines" | "Subscriptions";
}

export interface ApprovalRequest {
  id: string;
  itemId: string;
  productName: string;
  brand: string;
  price: number;
  quantity: number;
  category: "Groceries" | "Meals" | "Medicines" | "Subscriptions";
  status: "pending" | "approved" | "skipped" | "rescheduled";
  createdAt: string;
  dueDate: string;
}

export interface AppNotification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: "reminder" | "auto_order" | "approval" | "general";
}

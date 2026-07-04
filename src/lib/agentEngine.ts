import { dbService } from "./dbService";
import { ScheduleItem, OrderRecord, ApprovalRequest, AppNotification } from "../types";

// Helper to calculate the next due date based on frequency
export function calculateNextDueDate(currentDueStr: string, frequency: "Daily" | "Weekly" | "Monthly" | "Custom", customIntervalDays?: number): string {
  const current = new Date(currentDueStr);
  if (isNaN(current.getTime())) {
    return new Date().toISOString().split("T")[0];
  }

  let daysToAdd = 1;
  if (frequency === "Daily") {
    daysToAdd = 1;
  } else if (frequency === "Weekly") {
    daysToAdd = 7;
  } else if (frequency === "Monthly") {
    daysToAdd = 30;
  } else if (frequency === "Custom") {
    daysToAdd = customIntervalDays || 3; // Default custom interval
  }

  current.setDate(current.getDate() + daysToAdd);
  return current.toISOString().split("T")[0];
}

export interface AgentRunResult {
  ordersPlaced: OrderRecord[];
  approvalsCreated: ApprovalRequest[];
  notificationsCreated: AppNotification[];
  insight: string;
}

export async function runAgentEngine(
  isGuest: boolean,
  onLog: (msg: string) => void
): Promise<AgentRunResult> {
  onLog("Starting GharLoop AI Agent scheduling scan...");
  
  // 1. Fetch user's full schedule from Firestore
  const schedules = await dbService.getSchedules(isGuest);
  const orderHistory = await dbService.getOrderHistory(isGuest);
  const approvals = await dbService.getApprovals(isGuest);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const tomorrow = new Date(todayTime + 86400000);
  tomorrow.setHours(0, 0, 0, 0);
  const tomorrowTime = tomorrow.getTime();

  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const result: AgentRunResult = {
    ordersPlaced: [],
    approvalsCreated: [],
    notificationsCreated: [],
    insight: ""
  };

  onLog(`Found ${schedules.length} active subscription and recurring items. Scanning due dates...`);

  // Track notifications locally
  let storedNotifications: AppNotification[] = [];
  try {
    storedNotifications = await dbService.getNotifications(isGuest);
  } catch (e) {
    console.warn("Could not get notifications in agentEngine:", e);
  }

  // 2. & 3. Calculate next due dates and bucket items using real date math
  for (const item of schedules) {
    const itemDue = new Date(item.nextDue);
    itemDue.setHours(0, 0, 0, 0);
    const itemDueTime = itemDue.getTime();

    let bucket: "OVERDUE" | "DUE_TODAY" | "DUE_TOMORROW" | "UPCOMING" = "UPCOMING";
    if (itemDueTime < todayTime) {
      bucket = "OVERDUE";
    } else if (itemDueTime === todayTime) {
      bucket = "DUE_TODAY";
    } else if (itemDueTime === tomorrowTime) {
      bucket = "DUE_TOMORROW";
    } else {
      bucket = "UPCOMING";
    }

    onLog(`Item '${item.productName}' classified as [${bucket}] (due on ${item.nextDue}).`);

    // 4. Branch based on automationLevel for OVERDUE or DUE_TODAY items
    if (bucket === "OVERDUE" || bucket === "DUE_TODAY") {
      if (item.automationLevel === "Auto-order") {
        // [auto_order] Write to orderHistory, advance nextDue, write to Recent Activity
        onLog(`[Auto-Order] Simulating delivery for ${item.productName}...`);
        
        const newOrder = await dbService.addOrderRecord(isGuest, {
          productName: item.productName,
          brand: item.brand,
          price: item.price,
          quantity: item.quantity,
          date: todayStr,
          category: item.category
        });
        result.ordersPlaced.push(newOrder);

        const newNextDue = calculateNextDueDate(item.nextDue, item.frequency, item.customIntervalDays);
        await dbService.updateScheduleItem(isGuest, item.id, { nextDue: newNextDue });
        onLog(`[Auto-Order] Advanced '${item.productName}' next due date from ${item.nextDue} to ${newNextDue}.`);

        const newNotification: AppNotification = {
          id: "not_" + Math.random().toString(36).substring(2, 11),
          message: `${item.productName} (${item.brand}) — ordered automatically today.`,
          createdAt: new Date().toISOString(),
          read: false,
          type: "auto_order"
        };
        result.notificationsCreated.push(newNotification);

      } else if (item.automationLevel === "Ask me first") {
        // [ask_first] Write to pendingApprovals, do NOT touch orderHistory or nextDue
        const hasPendingApproval = approvals.some(
          (a) => a.itemId === item.id && a.status === "pending"
        );

        if (!hasPendingApproval) {
          onLog(`[Approval] Creating pending authorization request for ${item.productName}...`);
          const newAppReq = await dbService.addApprovalRequest(isGuest, {
            itemId: item.id,
            productName: item.productName,
            brand: item.brand,
            price: item.price,
            quantity: item.quantity,
            category: item.category,
            status: "pending",
            createdAt: new Date().toISOString(),
            dueDate: item.nextDue
          });
          result.approvalsCreated.push(newAppReq);

          const newNotification: AppNotification = {
            id: "not_" + Math.random().toString(36).substring(2, 11),
            message: `Approval requested: Reorder ${item.productName}? Tap Schedule to approve.`,
            createdAt: new Date().toISOString(),
            read: false,
            type: "approval"
          };
          result.notificationsCreated.push(newNotification);
        } else {
          onLog(`[Approval] Pending request already active for ${item.productName}.`);
        }

      } else if (item.automationLevel === "Remind me") {
        // [remind_only] Write to Recent Activity/notification only
        const hasReminder = storedNotifications.some(
          (n) => n.type === "reminder" && n.message.includes(item.productName)
        );

        if (!hasReminder) {
          onLog(`[Reminder] Generating notification for ${item.productName}...`);
          const newNotification: AppNotification = {
            id: "not_" + Math.random().toString(36).substring(2, 11),
            message: `Reminder: Your recurring item '${item.productName}' is due today.`,
            createdAt: new Date().toISOString(),
            read: false,
            type: "reminder"
          };
          result.notificationsCreated.push(newNotification);
        } else {
          onLog(`[Reminder] Notification already active for ${item.productName}.`);
        }
      }
    } else if (bucket === "DUE_TOMORROW") {
      if (item.automationLevel === "Remind me") {
        const hasReminder = storedNotifications.some(
          (n) => n.type === "reminder" && n.message.includes(item.productName) && n.message.includes("tomorrow")
        );
        if (!hasReminder) {
          onLog(`[Reminder] Scheduling reminder for tomorrow: ${item.productName}.`);
          const newNotification: AppNotification = {
            id: "not_" + Math.random().toString(36).substring(2, 11),
            message: `Reminder: '${item.productName}' is due tomorrow.`,
            createdAt: new Date().toISOString(),
            read: false,
            type: "reminder"
          };
          result.notificationsCreated.push(newNotification);
        }
      }
    }
  }

  // Save updated notifications to db
  for (const notif of result.notificationsCreated) {
    try {
      await dbService.addNotificationRecord(isGuest, {
        message: notif.message,
        createdAt: notif.createdAt,
        read: notif.read,
        type: notif.type
      });
    } catch (e) {
      console.warn("Could not write notification to database:", e);
    }
  }

  // 5. Pre-calculate delivery consolidation savings & run AI insight generation (LLM call)
  const dueItems = schedules.filter(s => s.nextDue <= todayStr);
  const dueCount = dueItems.length;
  const potentialSavings = dueCount > 1 ? (dueCount - 1) * 25 : 0;
  const dueItemsSummary = dueItems.map(item => `${item.productName} (${item.brand})`).join(", ");

  onLog(`Pre-calculated potential delivery fee savings: ₹${potentialSavings} (Consolidating ${dueCount} items).`);
  onLog("Connecting to server-side AI model to synthesize spending insights...");

  try {
    const profile = await dbService.getUserProfile(isGuest);
    const spentThisMonth = orderHistory.reduce((sum, ord) => sum + (ord.price * ord.quantity), 0);
    const budgetProgress = { spent: spentThisMonth, limit: profile.monthlyBudget };
    const pendingCount = approvals.filter(a => a.status === 'pending').length;

    const response = await fetch("/api/gemini-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderHistory,
        budgetProgress,
        pendingCount,
        persona: profile.persona,
        potentialSavings,
        dueItemsSummary
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      result.insight = data.insight;
      onLog("Successfully retrieved custom AI insight sentence.");
    } else {
      throw new Error("API return code " + response.status);
    }
  } catch (e) {
    console.warn("Could not load AI insights from server, using deterministic fallback:", e);
    result.insight = potentialSavings > 0
      ? `Consolidating your due essentials today can save you up to ₹${potentialSavings} in Swiggy Instamart delivery fees!`
      : "Add a few more recurring items to start getting personalized savings tips.";
  }

  onLog("Scan completed. Dashboard updated.");
  return result;
}

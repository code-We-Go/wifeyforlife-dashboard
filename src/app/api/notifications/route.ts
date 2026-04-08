import { ConnectDB } from "@/config/db";
import UserModel from "@/app/models/userModel";
import NotificationModel from "@/app/models/notificationModel";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

void loadDB();

const errorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ error: message }, { status });
};

const successResponse = (data: unknown, status: number = 200) => {
  return NextResponse.json({ data }, { status });
};

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

type ExpoPushTicket =
  | { status: "ok"; id: string }
  | {
      status: "error";
      message?: string;
      details?: { error?: string; expoPushToken?: string };
    };

type ExpoPushSendResponse = {
  data?: ExpoPushTicket[];
  errors?: Array<{ code?: string; message?: string }>;
};

type ExpoPushReceipt = {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
};

type ExpoPushReceiptsResponse = {
  data?: Record<string, ExpoPushReceipt>;
  errors?: Array<{ code?: string; message?: string }>;
};

type SendPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

type SendAndTrackResult = {
  requested: number;
  sendAccepted: number;
  sendRejected: number;
  delivered: number;
  failed: number;
  failures: Array<{
    ticketId: string;
    error: string;
  }>;
};

const EXPO_SEND_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** Receipts are not always ready immediately; a short delay improves accuracy. */
const sleep = async (ms: number) => {
  await new Promise((r) => setTimeout(r, ms));
};

const sendAndTrackExpoPush = async (
  tokens: string[],
  payload: SendPayload
): Promise<SendAndTrackResult> => {
  const uniqueTokens = [...new Set(tokens.map((t) => t.trim()))].filter(Boolean);
  const messageChunks = chunkArray(uniqueTokens, 100);

  let sendAccepted = 0;
  let sendRejected = 0;
  const ticketIds: string[] = [];

  const dataPayload =
    payload.data && Object.keys(payload.data).length > 0
      ? payload.data
      : undefined;

  for (const tokenChunk of messageChunks) {
    const messages: ExpoPushMessage[] = tokenChunk.map((to) => ({
      to,
      title: payload.title,
      body: payload.body,
      ...(dataPayload ? { data: dataPayload } : {}),
      sound: payload.sound ?? "default",
    }));

    const res = await fetch(EXPO_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const json = (await res.json()) as ExpoPushSendResponse;

    if (!res.ok) {
      sendRejected += tokenChunk.length;
      continue;
    }

    if (json.errors?.length) {
      console.error("Expo push/send errors:", json.errors);
    }

    const tickets = json.data ?? [];

    for (const ticket of tickets) {
      if (ticket.status === "ok") {
        sendAccepted++;
        ticketIds.push(ticket.id);
      } else {
        sendRejected++;
      }
    }

    if (tickets.length !== tokenChunk.length) {
      console.warn(
        "Expo ticket count mismatch",
        tickets.length,
        "vs",
        tokenChunk.length
      );
    }
  }

  // Give Expo time to finalize receipts (optional but helps delivered/failed counts)
  await sleep(1500);

  let delivered = 0;
  let failed = 0;
  const failures: SendAndTrackResult["failures"] = [];

  const receiptIdChunks = chunkArray(ticketIds, 300);

  for (const ids of receiptIdChunks) {
    const res = await fetch(EXPO_RECEIPTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      failed += ids.length;
      for (const id of ids) {
        failures.push({ ticketId: id, error: "ReceiptRequestFailed" });
      }
      continue;
    }

    const json = (await res.json()) as ExpoPushReceiptsResponse;

    if (json.errors?.length) {
      console.error("Expo getReceipts errors:", json.errors);
    }

    const receipts = json.data ?? {};

    for (const [ticketId, receipt] of Object.entries(receipts)) {
      if (receipt.status === "ok") {
        delivered++;
      } else {
        failed++;
        failures.push({
          ticketId,
          error: receipt.details?.error ?? receipt.message ?? "UnknownError",
        });
      }
    }
  }

  return {
    requested: uniqueTokens.length,
    sendAccepted,
    sendRejected,
    delivered,
    failed,
    failures,
  };
};

// ─── GET: Fetch notification history for dashboard ───────────────────────────
export async function GET() {
  try {
    const notifications = await NotificationModel.find()
      .sort({ createdAt: -1 })
      .lean();

    const mapped = notifications.map((n) => {
      const total = n.recipients?.length ?? 0;
      const seenCount = n.recipients?.filter((r: { seen: boolean }) => r.seen).length ?? 0;
      return {
        _id: n._id,
        title: n.title,
        body: n.body,
        link: n.link,
        targetType: n.targetType,
        totalRecipients: total,
        seenCount,
        unseenCount: total - seenCount,
        deliveryStats: n.deliveryStats,
        createdAt: n.createdAt,
      };
    });

    return successResponse({ notifications: mapped });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch notifications";
    console.error("Error fetching notifications:", error);
    return errorResponse(message);
  }
}

// ─── POST: Send push + persist notification ──────────────────────────────────
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userIds, title, message, link } = data as {
      userIds?: unknown;
      title?: string;
      message?: string;
      link?: string;
    };

    if (!title || !message) {
      return errorResponse("Title and message are required", 400);
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse("User selection is required", 400);
    }

    const isAll = userIds.includes("all");

    let query: Record<string, unknown> = {
      pushToken: { $exists: true, $nin: [null, ""] },
    };

    if (!isAll) {
      query._id = { $in: userIds };
    }

    const users = await UserModel.find(query).select("pushToken");
    const tokens = users
      .map((u) => u.pushToken as string)
      .filter(Boolean);

    if (tokens.length === 0) {
      return errorResponse("No valid push tokens found for selected users", 404);
    }

    const expoPayload: SendPayload = {
      title,
      body: message,
      ...(link && String(link).trim() !== ""
        ? { data: { link: String(link).trim() } }
        : {}),
    };

    const result = await sendAndTrackExpoPush(tokens, expoPayload);
    console.log("Expo push result:", JSON.stringify(result));

    // Persist notification with recipients
    const notification = await NotificationModel.create({
      title,
      body: message,
      link: link && String(link).trim() !== "" ? String(link).trim() : undefined,
      targetType: isAll ? "all" : "specific",
      recipients: users.map((u) => ({
        userId: u._id,
        seen: false,
      })),
      deliveryStats: {
        requested: result.requested,
        delivered: result.delivered,
        failed: result.failed,
      },
    });

    return successResponse({
      message: "Notifications sent",
      tokenCount: tokens.length,
      notificationId: notification._id,
      ...result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send notification";
    console.error("Error sending push notification:", error);
    return errorResponse(message);
  }
}

// ─── DELETE: Remove a notification by ID ─────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("Notification ID is required", 400);
    }

    const deleted = await NotificationModel.findByIdAndDelete(id);

    if (!deleted) {
      return errorResponse("Notification not found", 404);
    }

    return successResponse({ message: "Notification deleted" });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete notification";
    console.error("Error deleting notification:", error);
    return errorResponse(message);
  }
}
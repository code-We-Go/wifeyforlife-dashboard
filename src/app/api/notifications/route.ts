import { ConnectDB } from "@/config/db";
import UserModel from "@/app/models/userModel";
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
async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function sendAndTrackExpoPush(
  tokens: string[],
  payload: SendPayload
): Promise<SendAndTrackResult> {
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
}

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

    let query: Record<string, unknown> = {
      pushToken: { $exists: true, $nin: [null, ""] },
    };

    if (!userIds.includes("all")) {
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

    return successResponse({
      message: "Notifications sent",
      tokenCount: tokens.length,
      ...result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send notification";
    console.error("Error sending push notification:", error);
    return errorResponse(message);
  }
}
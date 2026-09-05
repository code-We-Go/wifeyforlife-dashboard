import { ConnectDB } from "@/config/db";
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

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─── GET: Fetch a single notification with populated recipients ──────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ConnectDB();
    const { id } = await params;

    const notification = await NotificationModel.findById(id)
      .populate("recipients.userId", "username email firstName lastName imageURL")
      .lean();

    if (!notification) {
      return errorResponse("Notification not found", 404);
    }

    return successResponse({ notification });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch notification";
    console.error("Error fetching notification:", error);
    return errorResponse(message);
  }
}

// ─── PATCH: Refresh delivery receipts from Expo ──────────────────────────────
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ConnectDB();
    const { id } = await params;

    const notification = await NotificationModel.findById(id);
    if (!notification) {
      return errorResponse("Notification not found", 404);
    }

    const ticketIds: string[] = notification.ticketIds || [];
    if (!ticketIds || ticketIds.length === 0) {
      return errorResponse(
        "No Expo ticket IDs recorded for this notification. (Detailed tracking is active for all newly sent notifications)",
        400
      );
    }

    const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
    let delivered = 0;
    let failed = 0;

    const receiptIdChunks = chunkArray(ticketIds, 300);

    for (const ids of receiptIdChunks) {
      const res = await fetch(EXPO_RECEIPTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        continue;
      }

      const json = (await res.json()) as { data?: Record<string, { status: string; details?: { error?: string } }> };
      const receipts = json.data ?? {};

      for (const [_, receipt] of Object.entries(receipts)) {
        if (receipt.status === "ok") {
          delivered++;
        } else {
          failed++;
        }
      }
    }

    // Update deliveryStats if receipts were returned
    if (delivered > 0 || failed > 0) {
      notification.deliveryStats = {
        requested: ticketIds.length,
        delivered,
        failed,
      };
      await notification.save();
    }

    return successResponse({
      message: "Delivery status refreshed successfully",
      deliveryStats: notification.deliveryStats,
      notification,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to refresh delivery status";
    console.error("Error refreshing delivery status:", error);
    return errorResponse(message);
  }
}

// ─── DELETE: Delete a single notification ────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ConnectDB();
    const { id } = await params;

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

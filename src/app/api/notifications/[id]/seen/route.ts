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

// ─── PATCH: Mark a single notification as seen for a user ────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId } = body as { userId?: string };

    if (!userId) {
      return errorResponse("userId is required", 400);
    }

    const result = await NotificationModel.updateOne(
      { _id: id, "recipients.userId": userId },
      {
        $set: {
          "recipients.$.seen": true,
          "recipients.$.seenAt": new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return errorResponse("Notification or recipient not found", 404);
    }

    return successResponse({ message: "Notification marked as seen" });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to mark notification as seen";
    console.error("Error marking notification seen:", error);
    return errorResponse(message);
  }
}

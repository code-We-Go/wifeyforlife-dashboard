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

// ─── PATCH: Mark ALL notifications as seen for a user ────────────────────────
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body as { userId?: string };

    if (!userId) {
      return errorResponse("userId is required", 400);
    }

    const result = await NotificationModel.updateMany(
      { "recipients.userId": userId, "recipients.seen": false },
      {
        $set: {
          "recipients.$[elem].seen": true,
          "recipients.$[elem].seenAt": new Date(),
        },
      },
      {
        arrayFilters: [{ "elem.userId": userId, "elem.seen": false }],
      },
    );

    return successResponse({
      message: "All notifications marked as seen",
      modifiedCount: result.modifiedCount,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to mark all notifications as seen";
    console.error("Error marking all notifications seen:", error);
    return errorResponse(message);
  }
}

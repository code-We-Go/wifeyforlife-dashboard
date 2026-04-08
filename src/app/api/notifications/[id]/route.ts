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

// ─── GET: Fetch a single notification with populated recipients ──────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

// ─── DELETE: Delete a single notification ────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

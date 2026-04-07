import { ConnectDB } from "@/config/db";
import UserModel from "@/app/models/userModel";
import { NextResponse } from "next/server";
import { messaging } from "@/lib/firebaseAdmin";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// Helper function for consistent error responses
const errorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ error: message }, { status });
};

// Helper function for consistent success responses
const successResponse = (data: any, status: number = 200) => {
  return NextResponse.json({ data }, { status });
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userIds, title, message, link } = data;

    if (!title || !message) {
      return errorResponse("Title and message are required", 400);
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse("User selection is required", 400);
    }

    // Determine target users
    let query: any = { pushToken: { $exists: true, $nin: [null, ""] } };
    
    if (!userIds.includes("all")) {
      query._id = { $in: userIds };
    }

    const users = await UserModel.find(query).select('pushToken');
    
    const tokens = users.map(user => user.pushToken as string).filter(Boolean);

    if (tokens.length === 0) {
      return errorResponse("No valid push tokens found for selected users", 404);
    }

    const payload: any = {
      notification: {
        title,
        body: message,
      },
      tokens,
    };

    if (link && link.trim() !== '') {
      payload.data = { link };
    }

    // const response = await messaging.sendEachForMulticast(payload);
    // const { to, title, body, data } = payload;
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: tokens, // ExponentPushToken[...]
      title,
      body: message,
      data: data || {},
      sound: "default",
    }),
  });

const result = await res.json();
console.log(JSON.stringify(result)+"xpo")
return NextResponse.json(result);
    // return successResponse({
    //   message: `Notifications processing finished`,
    //   successCount: response.successCount,
    //   failureCount: response.failureCount,
    //   responses: response.responses.map((r: any) => ({ success: r.success, error: r.error?.message }))
    // });
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return errorResponse(error.message || "Failed to send notification");
  }
}

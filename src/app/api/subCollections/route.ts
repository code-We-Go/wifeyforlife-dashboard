
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import subCollectionsModel from "@/app/models/subCollectionsModal";

const loadDB = async () => {
    await ConnectDB();
};

loadDB();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const collectionID = searchParams.get("collectionID")!;
    console.log('collectionID'+collectionID)
    // const page = parseInt(searchParams.get("page") || "1", 10);
    // const limit = 10;
    // const skip = (page - 1) * limit;

    try {
        const subCollections = await subCollectionsModel.find({"collectionID":collectionID}).sort({ createdAt: -1 });
        // const totalProducts = await productModel.countDocuments();

        return NextResponse.json(subCollections, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
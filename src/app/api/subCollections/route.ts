
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
export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const subCollectionID = searchParams.get("subCollectionID")!;
    console.log('subCollectionID'+subCollectionID)
    // const page = parseInt(searchParams.get("page") || "1", 10);
    // const limit = 10;
    // const skip = (page - 1) * limit;

    try {
        const res = await subCollectionsModel.findByIdAndDelete({"_id":subCollectionID});
        // const totalProducts = await productModel.countDocuments();

        return NextResponse.json(res, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete subCollection" }, { status: 500 });
    }
}

export async function PUT(request:Request){
    const { searchParams } = new URL(request.url);
    const subCollectionID = searchParams.get("subCollectionID") 
    console.log('subCollectionID');
    const req=await request.json()
    console.log(req)
    
    console.log('working');
    try {
        const res = await subCollectionsModel.findByIdAndUpdate(subCollectionID, req, { new: true, runValidators: true });
        return NextResponse.json({data:res},{status:200})
    }
    catch(error:any){
        return Response.json({ error: error.message }, { status: 500 });
     
    }
}

export async function POST(request:Request){
    const req=await request.json()
    console.log(req)
    try {
        const res = await subCollectionsModel.create(req);
        return NextResponse.json({data:res},{status:200})
    }
    catch(error:any){
        return Response.json({ error: error.message }, { status: 500 });
     
    }
}
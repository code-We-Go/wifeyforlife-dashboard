import weddingPlanningVendorsModel from "@/app/models/weddingPlanningVendors";
import subCategoryModel from "@/app/models/subCategoryModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
    await ConnectDB();
};

loadDB();

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const newVendor = await weddingPlanningVendorsModel.create(data);
        return NextResponse.json({ data: newVendor }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const categoryID = searchParams.get("categoryID");
    const subCategoryID = searchParams.get("subCategoryID");
    const vendorID = searchParams.get("vendorID");

    try {
        if (vendorID) {
            const vendor = await weddingPlanningVendorsModel.findById(vendorID).populate({
                path: "subCategoryID",
                populate: { path: "categoryID" }
            });
            return NextResponse.json({ data: vendor }, { status: 200 });
        }

        const filter: any = {};
        
        if (subCategoryID) {
            filter.subCategoryID = subCategoryID;
        } else if (categoryID) {
            // Find all subcategories for this category
            const subCats = await subCategoryModel.find({ categoryID: categoryID }).select("_id");
            const subCatIds = subCats.map(sc => sc._id);
            filter.subCategoryID = { $in: subCatIds };
        }

        const vendors = await weddingPlanningVendorsModel.find(filter).populate({
            path: "subCategoryID",
            populate: { path: "categoryID" }
        }).sort({ createdAt: -1 });

        return NextResponse.json({ data: vendors }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const { searchParams } = new URL(req.url);
    const vendorID = searchParams.get("vendorID");
    try {
        const data = await req.json();
        const updatedVendor = await weddingPlanningVendorsModel.findByIdAndUpdate(vendorID, data, { new: true, runValidators: true });
        return NextResponse.json({ data: updatedVendor }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { vendorID } = await req.json();
        await weddingPlanningVendorsModel.findByIdAndDelete(vendorID);
        return NextResponse.json({ message: "Vendor deleted successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

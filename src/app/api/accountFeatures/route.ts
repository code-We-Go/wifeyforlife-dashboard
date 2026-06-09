import accountFeatureModel from "@/app/models/accountFeatures";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// CREATE - POST
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const newFeature = await accountFeatureModel.create(data);
    return NextResponse.json({ data: newFeature }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating account feature:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// READ - GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const all = searchParams.get("all") === "true";
  const limit = all ? 0 : 10;
  const skip = all ? 0 : (page - 1) * limit;

  try {
    const searchQuery = search
      ? { label: { $regex: search, $options: "i" } }
      : {};

    const totalFeatures = await accountFeatureModel.countDocuments(searchQuery);

    const features = await accountFeatureModel
      .find(searchQuery)
      .populate("requiredPackages")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json(
      {
        data: features,
        total: totalFeatures,
        currentPage: page,
        totalPages: all ? 1 : Math.ceil(totalFeatures / limit),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching account features:", error);
    return NextResponse.json(
      { error: "Failed to fetch account features" },
      { status: 500 },
    );
  }
}

// UPDATE - PUT
export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const featureID = searchParams.get("featureID");
  
  if (!featureID) {
    return NextResponse.json(
      { error: "Feature ID is required" },
      { status: 400 }
    );
  }

  try {
    const req = await request.json();

    const updatedFeature = await accountFeatureModel.findByIdAndUpdate(
      featureID,
      req,
      {
        new: true,
        runValidators: true,
      }
    ).populate("requiredPackages");

    if (!updatedFeature) {
      return NextResponse.json(
        { error: "Account feature not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedFeature }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating account feature:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const featureID = searchParams.get("featureID");

  if (!featureID) {
    return NextResponse.json(
      { error: "Feature ID is required" },
      { status: 400 }
    );
  }

  try {
    const deletedFeature = await accountFeatureModel.findByIdAndDelete(featureID);

    if (!deletedFeature) {
      return NextResponse.json(
        { error: "Account feature not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Account feature deleted successfully", data: deletedFeature },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting account feature:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import ShoppingSubcategoryModel from "@/app/models/shoppingSubcategoriesModel";
import ShoppingCategoryModel from "@/app/models/shoppingCategoriesModel";

const loadDB = async () => { await ConnectDB(); };

// GET: List subcategories, optionally filtered by categoryId
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  await loadDB();
  console.log("registering"+ShoppingCategoryModel)
  try {
    const query: Record<string, any> = {};
    if (categoryId) query.categoryId = categoryId;
    const subcategories = await ShoppingSubcategoryModel.find(query)
      .populate("categoryId", "name slug")
      .sort({ name: 1 });
    return NextResponse.json({ data: subcategories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch subcategories" }, { status: 500 });
  }
}

// POST: Create a subcategory
export async function POST(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    const subcategory = await ShoppingSubcategoryModel.create(body);
    return NextResponse.json({ data: subcategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create subcategory" }, { status: 500 });
  }
}

// PUT: Update a subcategory
export async function PUT(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const { _id, ...updateData } = body;
    if (!_id) return NextResponse.json({ error: "Subcategory ID is required" }, { status: 400 });
    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    const subcategory = await ShoppingSubcategoryModel.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!subcategory) return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    return NextResponse.json({ data: subcategory }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update subcategory" }, { status: 500 });
  }
}

// DELETE: Delete a subcategory
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Subcategory ID is required" }, { status: 400 });
  await loadDB();
  try {
    const subcategory = await ShoppingSubcategoryModel.findByIdAndDelete(id);
    if (!subcategory) return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    return NextResponse.json({ message: "Subcategory deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete subcategory" }, { status: 500 });
  }
}

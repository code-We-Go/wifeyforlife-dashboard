import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import ShoppingCategoryModel from "@/app/models/shoppingCategoriesModel";

const loadDB = async () => { await ConnectDB(); };

// GET: List all categories
export async function GET() {
  await loadDB();
  try {
    const categories = await ShoppingCategoryModel.find({}).sort({ name: 1 });
    return NextResponse.json({ data: categories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch categories" }, { status: 500 });
  }
}

// POST: Create a category
export async function POST(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    // Auto-generate slug from name if not provided
    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    const category = await ShoppingCategoryModel.create(body);
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}

// PUT: Update a category
export async function PUT(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const { _id, ...updateData } = body;
    if (!_id) return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    const category = await ShoppingCategoryModel.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json({ data: category }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 500 });
  }
}

// DELETE: Delete a category
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
  await loadDB();
  try {
    const category = await ShoppingCategoryModel.findByIdAndDelete(id);
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  
  try {
    const { db } = await connectToDatabase();
    const subcategories = await db.collection('subcategories').find({}).toArray();
    return NextResponse.json({ data: subcategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    const result = await db.collection('subcategories').insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      message: 'Subcategory created successfully',
      data: { _id: result.insertedId, ...body }
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const subCategoryID = searchParams.get('subCategoryID');
    
    if (!subCategoryID) {
      return NextResponse.json({ error: 'Subcategory ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const result = await db.collection('subcategories').updateOne(
      { _id: new ObjectId(subCategoryID) },
      { 
        $set: {
          ...body,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Subcategory updated successfully',
      data: { _id: subCategoryID, ...body }
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { subCategoryID } = body;

    if (!subCategoryID) {
      return NextResponse.json({ error: 'Subcategory ID is required' }, { status: 400 });
    }

    const result = await db.collection('subcategories').deleteOne({
      _id: new ObjectId(subCategoryID)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 });
  }
} 
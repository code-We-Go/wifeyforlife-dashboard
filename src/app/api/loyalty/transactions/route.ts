import { NextRequest, NextResponse } from 'next/server';
import { LoyaltyTransactionModel } from '@/app/models/loyaltyTransactionModel';
import { ConnectDB } from '../../../../config/db';
ConnectDB()
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
  const transactions = await LoyaltyTransactionModel.find({ email:email }).sort({ timestamp: -1 });
  return NextResponse.json({data:transactions});
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, points, type, description } = body;

    if (!userId || !points || !type) {
      return NextResponse.json({ error: 'userId, points, and type are required' }, { status: 400 });
    }

    const newTransaction = await LoyaltyTransactionModel.create({
      userId,
      points,
      type,
      description,
      timestamp: new Date(),
    });

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction', details: error }, { status: 500 });
  }
} 


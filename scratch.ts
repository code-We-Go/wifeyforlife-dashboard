import mongoose from "mongoose";
import { ConnectDB } from "./src/config/db";
import subscriptionPaymentModel from "./src/app/models/subscriptionPaymentModel";

async function run() {
  await ConnectDB();
  const payments = await subscriptionPaymentModel.find({ status: { $ne: "confirmed" } }).lean();
  console.log(JSON.stringify(payments.map(p => ({
    id: p._id,
    paymentMethod: p.paymentMethod,
    status: p.status,
    subscribed: p.subscribed
  })), null, 2));
  mongoose.connection.close();
}

run();

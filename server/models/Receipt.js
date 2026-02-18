import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  receiptNo: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  clientDetails: {
    name: { type: String, required: true },
    address: { type: String, default: '' },
    gst: { type: String, default: '' }
  },
  paymentDetails: {
    utrNo: { type: String, default: '' },
    paymentMode: { type: String, default: 'Bank Transfer' },
    amountPaid: { type: Number, required: true },
    description: { type: String, default: '' },
    balanceAmount: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Receipt", receiptSchema);
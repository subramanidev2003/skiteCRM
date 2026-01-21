import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema({
  quoteNo: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  clientDetails: {
    name: { type: String, required: true },
    businessName: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    location: { type: String }
  },
  items: [
    {
      description: { type: String },
      hsn: { type: String },
      price: { type: Number },
     qty: { type: Number, required: true, default: 1 },
      total: { type: Number }
    }
  ],
  subtotal: { type: Number },
  taxRate: { type: Number },
  taxAmount: { type: Number },
  grandTotal: { type: Number },
  terms: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Quote", quoteSchema);
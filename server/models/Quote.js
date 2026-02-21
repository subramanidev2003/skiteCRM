import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema({
  quoteNo: { type: String, required: true, unique: true },
  refNo: { type: String, default: '' },
  date: { type: Date, required: true },
  clientDetails: {
    name: { type: String, required: true },
    address: { type: String, default: '' },   // ✅ FIX: address as single field
    gst: { type: String, default: '' }         // ✅ FIX: gst field add
  },
  items: [
    {
      description: { type: String },
      subDescription:{ type: String },
      hsn: { type: String },
      price: { type: Number },
      qty: { type: Number, required: true, default: 1 },
      total: { type: Number }
    }
  ],
  subtotal: { type: Number },
  taxRate: { type: Number },
  cgst: { type: Number },   // ✅ FIX: cgst separately
  sgst: { type: Number },   // ✅ FIX: sgst separately
  grandTotal: { type: Number },
  terms: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Quote", quoteSchema);
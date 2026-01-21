import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  
  // Client Details
  clientDetails: {
    name: { type: String, required: true },
    addressLine1: { type: String },
    addressLine2: { type: String },
    location: { type: String }
  },

  // Items Array
  items: [
    {
      description: { type: String, required: true },
      hsn: { type: String },
      price: { type: Number, required: true },
      qty: { type: Number, required: true },
      total: { type: Number, required: true }
    }
  ],

  // Totals
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 9 }, // CGST + SGST (9+9)
  cgst: { type: Number, required: true },
  sgst: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Invoice", invoiceSchema);
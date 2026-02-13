import mongoose from 'mongoose';

const DaySchema = new mongoose.Schema({
  date: String,   // e.g., "2026-03-01"
  videoLink: { type: String, default: '' }, // ✅ Video Number/Link சேமிக்க
  postStatus: { type: String, default: 'Pending' }
});

// SocialMediaClientSchema மாற்றம் தேவையில்லை, DaySchema மட்டும் போதும்.

const SocialMediaClientSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  businessName: String,
  paymentStatus: { type: String, default: 'Pending' }, // Paid, Pending
  month: String, // e.g., "February 2026"
  days: [DaySchema], // Stores daily data
  videoTarget: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SocialMediaClient', SocialMediaClientSchema);
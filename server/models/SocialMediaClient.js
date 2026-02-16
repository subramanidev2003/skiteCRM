import mongoose from 'mongoose';

const SocialMediaClientSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  businessName: { type: String },
  
  // ✅ Puthusa Add Panna Fields
  phone: { type: String },
  email: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SocialMediaClient', SocialMediaClientSchema);
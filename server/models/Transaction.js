import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, default: 'General' },
  date: { type: Date, default: Date.now }
});

// export default பயன்படுத்த வேண்டும்
export default mongoose.model('Transaction', transactionSchema);
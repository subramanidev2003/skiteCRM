import express from 'express';
import Transaction from '../models/Transaction.js'; // .js extension முக்கியம்

const router = express.Router();

// Add Transaction
router.post('/add', async (req, res) => {
  try {
    const newTrans = new Transaction(req.body);
    await newTrans.save();
    res.status(201).json(newTrans);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Transactions
router.get('/all', async (req, res) => {
  try {
    const data = await Transaction.find().sort({ date: -1 });
    res.status(200).json(data);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Transaction
router.delete('/delete/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// export default பயன்படுத்த வேண்டும்
export default router;
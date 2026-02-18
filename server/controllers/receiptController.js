import Receipt from "../models/Receipt.js";

export const createReceipt = async (req, res) => {
  try {
    const { receiptNo, date, clientDetails, paymentDetails } = req.body;

    const newReceipt = new Receipt({
      receiptNo,
      date,
      clientDetails: {
        name: clientDetails.name || '',
        address: clientDetails.address || '',
        gst: clientDetails.gst || ''
      },
      paymentDetails: {
        utrNo: paymentDetails.utrNo || '',
        paymentMode: paymentDetails.paymentMode || 'Bank Transfer',
        amountPaid: parseFloat(paymentDetails.amountPaid) || 0,
        description: paymentDetails.description || '',
        balanceAmount: parseFloat(paymentDetails.balanceAmount) || 0
      }
    });

    await newReceipt.save();
    res.status(201).json({ message: "Receipt saved successfully!", receipt: newReceipt });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Receipt Number already exists!" });
    }
    res.status(500).json({ message: "Failed to save receipt", error: error.message });
  }
};

export const getAllReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find().sort({ createdAt: -1 });
    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching receipts" });
  }
};

export const deleteReceipt = async (req, res) => {
  try {
    await Receipt.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Receipt deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting receipt" });
  }
};
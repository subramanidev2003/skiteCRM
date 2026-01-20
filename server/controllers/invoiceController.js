import Invoice from "../models/Invoice.js";

// Create New Invoice
export const createInvoice = async (req, res) => {
  try {
    const newInvoice = new Invoice(req.body);
    await newInvoice.save();
    res.status(201).json({ message: "Invoice saved successfully!", invoice: newInvoice });
  } catch (error) {
    console.error("Error saving invoice:", error);

    // ✅ Handle Duplicate Invoice Number Error
    if (error.code === 11000) {
      return res.status(400).json({ message: "Error: This Invoice Number already exists!" });
    }

    // Handle Validation Errors (e.g., missing fields)
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }

    res.status(500).json({ message: "Failed to save invoice", error: error.message });
  }
};

// Get All Invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching invoices" });
  }
};
// ... existing imports and functions

// ✅ Delete Invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    await Invoice.findByIdAndDelete(id);
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting invoice" });
  }
};
// ✅ Get Single Invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Error fetching invoice details" });
  }
};
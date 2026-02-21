import Quote from "../models/Quote.js";

// ✅ Create Quote
export const createQuote = async (req, res) => {
  try {
    const { quoteNo, refNo, date, clientDetails, items, taxRate, terms } = req.body;

    let subtotal = 0;
    const processedItems = items.map(item => {
      const qty = Number(item.qty) || 1;
      const price = Number(item.price) || 0;
      const total = qty * price;
      subtotal += total;
      // ✅ FIX: Added subDescription here
      return { 
          description: item.description, 
          subDescription: item.subDescription || '', // Pudhusa add panniyachu
          hsn: item.hsn, 
          qty, 
          price, 
          total 
      };
    });

    const cgst = (subtotal * (Number(taxRate) || 0)) / 100;
    const sgst = (subtotal * (Number(taxRate) || 0)) / 100;
    const grandTotal = Math.round(subtotal + cgst + sgst);

    const newQuote = new Quote({
      quoteNo,
      refNo: refNo || '',
      date,
      clientDetails: {
        name: clientDetails.name || '',
        address: clientDetails.address || '',
        gst: clientDetails.gst || ''
      },
      items: processedItems,
      subtotal,
      taxRate: Number(taxRate) || 0,
      cgst,
      sgst,
      grandTotal,
      terms
    });

    await newQuote.save();
    res.status(201).json({ message: "Quote saved successfully!", quote: newQuote });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Quote Number already exists! Please use a different Quote No." });
    }
    console.error("Save Error:", error);
    res.status(500).json({ message: "Failed to save quote", error: error.message });
  }
};

// ✅ Update Quote
export const updateQuote = async (req, res) => {
  try {
    const { quoteNo, refNo, date, clientDetails, items, taxRate, terms } = req.body;

    let subtotal = 0;
    const processedItems = items.map(item => {
      const qty = Number(item.qty) || 1;
      const price = Number(item.price) || 0;
      const total = qty * price;
      subtotal += total;
      // ✅ FIX: Added subDescription here
      return { 
          description: item.description, 
          subDescription: item.subDescription || '', // Pudhusa add panniyachu
          hsn: item.hsn, 
          qty, 
          price, 
          total 
      };
    });

    const cgst = (subtotal * (Number(taxRate) || 0)) / 100;
    const sgst = (subtotal * (Number(taxRate) || 0)) / 100;
    const grandTotal = Math.round(subtotal + cgst + sgst);

    const updatedQuote = await Quote.findByIdAndUpdate(
      req.params.id,
      {
        quoteNo,
        refNo: refNo || '',
        date,
        clientDetails: {
          name: clientDetails.name || '',
          address: clientDetails.address || '',
          gst: clientDetails.gst || ''
        },
        items: processedItems,
        subtotal,
        taxRate: Number(taxRate) || 0,
        cgst,
        sgst,
        grandTotal,
        terms
      },
      { new: true }
    );

    if (!updatedQuote) return res.status(404).json({ message: "Quote not found" });
    res.status(200).json({ message: "Quote updated successfully!", quote: updatedQuote });

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Failed to update quote", error: error.message });
  }
};

// ✅ Get All Quotes
export const getAllQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.status(200).json(quotes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quotes" });
  }
};

// ✅ Delete Quote
export const deleteQuote = async (req, res) => {
  try {
    await Quote.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Quote deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting quote" });
  }
};

// ✅ Get Single Quote
export const getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: "Quote not found" });
    res.status(200).json(quote);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quote" });
  }
};
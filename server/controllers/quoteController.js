import Quote from "../models/Quote.js";

// ✅ Create Quote (Updated with Qty Logic)
export const createQuote = async (req, res) => {
  try {

    const { 
      quoteNo, 
      date, 
      clientDetails, 
      items, 
      taxRate, 
      terms 
    } = req.body;

 
    let subtotal = 0;

    const processedItems = items.map(item => {
      const qty = Number(item.qty) || 1;   
      const price = Number(item.price) || 0;
      const total = qty * price;         
      
      subtotal += total; 

      return {
        ...item,
        qty: qty,
        total: total
      };
    });

      
    const taxAmount = (subtotal * (Number(taxRate) || 0)) / 100;
    const grandTotal = subtotal + taxAmount;

    const newQuote = new Quote({
      quoteNo,
      date,
      clientDetails,
      items: processedItems,
      subtotal,
      taxRate,
      taxAmount,
      grandTotal,
      terms
    });

    // 5. Database-ல் சேமித்தல்
    await newQuote.save();
    
    res.status(201).json({ message: "Quote saved successfully!", quote: newQuote });

  } catch (error) {
    if (error.code === 11000) {
        return res.status(400).json({ message: "Quote Number already exists!" });
    }
    console.error("Save Error:", error);
    res.status(500).json({ message: "Failed to save quote", error: error.message });
  }
};

// Get All Quotes
export const getAllQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.status(200).json(quotes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quotes" });
  }
};

// Delete Quote
export const deleteQuote = async (req, res) => {
  try {
    await Quote.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Quote deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting quote" });
  }
};

// Get Single Quote
export const getQuoteById = async (req, res) => {
    try {
      const quote = await Quote.findById(req.params.id);
      if (!quote) return res.status(404).json({ message: "Quote not found" });
      res.status(200).json(quote);
    } catch (error) {
      res.status(500).json({ message: "Error fetching quote" });
    }
};
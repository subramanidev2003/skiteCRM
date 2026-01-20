import Quote from "../models/Quote.js";

// Create Quote
export const createQuote = async (req, res) => {
  try {
    const newQuote = new Quote(req.body);
    await newQuote.save();
    res.status(201).json({ message: "Quote saved successfully!", quote: newQuote });
  } catch (error) {
    if (error.code === 11000) {
        return res.status(400).json({ message: "Quote Number already exists!" });
    }
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
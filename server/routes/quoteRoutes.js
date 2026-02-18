import express from "express";
import { 
  createQuote, 
  getAllQuotes, 
  deleteQuote, 
  getQuoteById,
  updateQuote
} from "../controllers/quoteController.js";

const router = express.Router();

router.post("/create", createQuote);
router.get("/all", getAllQuotes);
router.delete("/delete/:id", deleteQuote);
router.put("/update/:id", updateQuote);   // ✅ இது இல்லாததால "Route not found" வந்தது
router.get("/:id", getQuoteById);         // ✅ இது ALWAYS last-ல் இருக்கணும்

export default router;
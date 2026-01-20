import express from "express";
import { createQuote, getAllQuotes, deleteQuote, getQuoteById } from "../controllers/quoteController.js";

const router = express.Router();

router.post("/create", createQuote);
router.get("/all", getAllQuotes);
router.delete("/delete/:id", deleteQuote);
router.get("/:id", getQuoteById);

export default router;
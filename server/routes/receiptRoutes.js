import express from "express";
import { createReceipt, getAllReceipts, deleteReceipt } from "../controllers/receiptController.js";

const router = express.Router();

router.post("/create", createReceipt);
router.get("/all", getAllReceipts);
router.delete("/delete/:id", deleteReceipt);

export default router;
import express from "express";
import { createInvoice, getAllInvoices, deleteInvoice, getInvoiceById } from "../controllers/invoiceController.js";

const router = express.Router();

router.post("/create", createInvoice); // Save Invoice
router.get("/all", getAllInvoices);    // Get List
router.delete("/delete/:id", deleteInvoice); // ✅ ADD THIS LINE
router.get("/:id", getInvoiceById);

export default router;
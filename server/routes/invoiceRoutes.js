import express from "express";
import { createInvoice, getAllInvoices, deleteInvoice, getInvoiceById, updatePayment } from "../controllers/invoiceController.js";

const router = express.Router();

router.post("/create", createInvoice); // Save Invoice
router.get("/all", getAllInvoices);    // Get List
router.delete("/delete/:id", deleteInvoice); // ✅ ADD THIS LINE
router.get("/:id", getInvoiceById);
// PUT request to update payment
router.put('/update-payment/:id', updatePayment);

export default router;
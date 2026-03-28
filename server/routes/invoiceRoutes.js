import express from "express";
import { 
    createInvoice, 
    getAllInvoices, 
    deleteInvoice, 
    getInvoiceById, 
    updatePayment, 
    updateInvoice // ✅ Import aagi irukkanum
} from "../controllers/invoiceController.js";

const router = express.Router();

router.post("/create", createInvoice); 

// ✅ INTHA LINE KANDIPPA IRUKKANUM (Ithu illana thaan 404 varum)
router.put("/update/:id", updateInvoice);

router.get("/all", getAllInvoices);
router.delete("/delete/:id", deleteInvoice);
router.get("/:id", getInvoiceById);
router.put('/update-payment/:id', updatePayment);

export default router;
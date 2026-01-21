import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Wallet, CheckCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './InvoicePayment.css';

const API_BASE = 'https://skitecrm.onrender.com/api';

const InvoicePayment = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // --- FETCH INVOICES ---
  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE}/invoice/all`);
      const data = await res.json();
      if (res.ok) {
        setInvoices(data);
      } else {
        toast.error("Failed to fetch invoices");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // --- HANDLERS ---
  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(''); // Reset input
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleUpdatePayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
    }

    const currentPaid = selectedInvoice.paidAmount || 0;
    const balance = selectedInvoice.grandTotal - currentPaid;

    if (Number(paymentAmount) > balance) {
        toast.error(`Amount cannot exceed balance (₹${balance})`);
        return;
    }

    try {
        // Backend Update Call
        const res = await fetch(`${API_BASE}/invoice/update-payment/${selectedInvoice._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                paidAmount: Number(paymentAmount) + currentPaid 
            })
        });

        const data = await res.json();

        if (res.ok) {
            toast.success("Payment Updated Successfully!");
            fetchInvoices(); // Refresh List
            closeModal();
        } else {
            toast.error(data.message || "Update failed");
        }
    } catch (error) {
        toast.error("Error updating payment");
    }
  };

  // --- FILTER ---
  const filteredInvoices = invoices.filter(inv => 
    inv.clientDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="payment-container">
      
      {/* Header */}
      <div className="payment-header">
        <div className="header-left">
            {/* ✅ UPDATED BUTTON */}
            <button className="modern-back-btn" onClick={() => navigate('/admin-dashboard/accounts')}>
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>
            <h2>Invoice Payments</h2>
        </div>
        
        {/* Stats Cards (Optional Summary) */}
        <div className="payment-stats">
            <div className="stat-card">
                <span>Total Due</span>
                <h3>₹ {invoices.reduce((acc, curr) => acc + (curr.grandTotal - (curr.paidAmount || 0)), 0).toLocaleString()}</h3>
            </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar-wrapper">
        <Search size={20} color="#888" />
        <input 
            type="text" 
            placeholder="Search by Client or Invoice No..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="payment-table-wrapper">
        <table className="payment-table">
            <thead>
                <tr>
                    <th>INVOICE NO</th>
                    <th>CLIENT</th>
                    <th>TOTAL</th>
                    <th>PAID</th>
                    <th>BALANCE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                </tr>
            </thead>
            <tbody>
                {filteredInvoices.map((inv) => {
                    const paid = inv.paidAmount || 0;
                    const balance = inv.grandTotal - paid;
                    
                    let status = "Unpaid";
                    let statusClass = "status-unpaid";

                    if (balance === 0) {
                        status = "Paid";
                        statusClass = "status-paid";
                    } else if (paid > 0) {
                        status = "Partial";
                        statusClass = "status-partial";
                    }

                    return (
                        <tr key={inv._id}>
                            <td style={{fontWeight:'bold', color:'#FF4500'}}>{inv.invoiceNo}</td>
                            <td>{inv.clientDetails.name}</td>
                            <td>₹ {inv.grandTotal.toLocaleString()}</td>
                            <td style={{color: 'green'}}>₹ {paid.toLocaleString()}</td>
                            <td style={{fontWeight:'bold', color: balance > 0 ? '#d32f2f' : '#333'}}>
                                ₹ {balance.toLocaleString()}
                            </td>
                            <td>
                                <span className={`badge ${statusClass}`}>{status}</span>
                            </td>
                            <td>
                                {balance > 0 ? (
                                    <button 
                                        className="pay-btn" 
                                        onClick={() => openPaymentModal(inv)}
                                    >
                                        Add Payment
                                    </button>
                                ) : (
                                    <span style={{color:'green', display:'flex', alignItems:'center', gap:'5px', fontSize:'13px'}}>
                                        <CheckCircle size={16}/> Completed
                                    </span>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {isModalOpen && selectedInvoice && (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header">
                    <h3>Record Payment</h3>
                    <button onClick={closeModal}><X size={24}/></button>
                </div>
                
                <div className="modal-body">
                    <p className="modal-info"><strong>Invoice:</strong> {selectedInvoice.invoiceNo}</p>
                    <p className="modal-info"><strong>Client:</strong> {selectedInvoice.clientDetails.name}</p>
                    
                    <div className="balance-info">
                        <span>Pending Balance:</span>
                        <h2 style={{color: '#d32f2f'}}>
                            ₹ {(selectedInvoice.grandTotal - (selectedInvoice.paidAmount || 0)).toLocaleString()}
                        </h2>
                    </div>

                    <div className="input-group">
                        <label>Enter Amount Received</label>
                        <input 
                            type="number" 
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Ex: 5000"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={closeModal}>Cancel</button>
                    <button className="confirm-btn" onClick={handleUpdatePayment}>Confirm Payment</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default InvoicePayment;
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Wallet, CheckCircle, Clock, X, Filter, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE } from '../api';
import './InvoicePayment.css';

const InvoicePayment = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  // ✅ NEW: Date Filter States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
        // Sort by date descending (newest first)
        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setInvoices(sortedData);
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

  // --- ✅ FILTER LOGIC (Search + GST + Date Range) ---
  const filteredInvoices = invoices.filter(inv => {
    // 1. Search Filter
    const matchesSearch = 
      inv.clientDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. GST Filter
    let matchesGST = true;
    if (filterType === 'With GST') {
      matchesGST = parseFloat(inv.taxRate) > 0;
    } else if (filterType === 'Without GST') {
      matchesGST = !inv.taxRate || parseFloat(inv.taxRate) === 0;
    }

    // 3. ✅ Date Filter
    let matchesDate = true;
    if (fromDate || toDate) {
      const invoiceDate = new Date(inv.date);
      invoiceDate.setHours(0, 0, 0, 0); // Reset time for accurate comparison

      if (fromDate) {
        const fDate = new Date(fromDate);
        fDate.setHours(0, 0, 0, 0);
        if (invoiceDate < fDate) matchesDate = false;
      }

      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(0, 0, 0, 0);
        if (invoiceDate > tDate) matchesDate = false;
      }
    }

    return matchesSearch && matchesGST && matchesDate;
  });

  // --- DYNAMIC STATS BASED ON FILTER ---
  const totalGrandAmount = filteredInvoices.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);
  const totalDueAmount = filteredInvoices.reduce((acc, curr) => acc + ((curr.grandTotal || 0) - (curr.paidAmount || 0)), 0);

  return (
    <div className="payment-container">
      
      {/* Header */}
      <div className="payment-header">
        <div className="header-left">
            <button className="modern-back-btn" onClick={() => navigate('/admin-dashboard/accounts')}>
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>
            <h2>Invoice Payments</h2>
        </div>
        
        {/* DYNAMIC STATS CARDS */}
        <div className="payment-stats" style={{ display: 'flex', gap: '15px' }}>
            {/* ✅ CHANGED BACKGROUND TO GREEN */}
            <div className="stat-card" style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', padding: '15px', borderRadius: '8px', minWidth: '150px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Filtered Grand Total</span>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '20px' }}>₹ {totalGrandAmount.toLocaleString('en-IN')}</h3>
            </div>
            
            <div className="stat-card" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '15px', borderRadius: '8px', minWidth: '150px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Filtered Total Due</span>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '20px' }}>₹ {totalDueAmount.toLocaleString('en-IN')}</h3>
            </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        
        {/* Search */}
        <div className="search-bar-wrapper" style={{ flex: 1, minWidth: '250px', display: 'flex', alignItems: 'center', background: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <Search size={20} color="#888" style={{ marginRight: '10px' }} />
          <input 
              type="text" 
              placeholder="Search by Client or Invoice No..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '15px' }}
          />
        </div>

        {/* GST Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '0 15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Filter size={18} color="#888" style={{ marginRight: '8px' }} />
            <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                style={{ border: 'none', outline: 'none', padding: '10px 0', fontSize: '15px', color: '#333', background: 'transparent', cursor: 'pointer' }}
            >
                <option value="All">All Invoices</option>
                <option value="With GST">With GST</option>
                <option value="Without GST">Without GST</option>
            </select>
        </div>

        {/* ✅ NEW: Date Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Calendar size={18} color="#888" />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>From:</span>
                <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#333', cursor: 'pointer' }}
                />
            </div>
            
            <div style={{ width: '1px', height: '20px', background: '#ddd' }}></div> {/* Divider */}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>To:</span>
                <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#333', cursor: 'pointer' }}
                />
            </div>

            {/* Clear Dates Button */}
            {(fromDate || toDate) && (
                <button 
                    onClick={() => { setFromDate(''); setToDate(''); }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '5px', display: 'flex', alignItems: 'center' }}
                    title="Clear Dates"
                >
                    <X size={16} />
                </button>
            )}
        </div>

      </div>

      {/* Table */}
      <div className="payment-table-wrapper" style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', border: '1px solid #eee' }}>
        <table className="payment-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '15px' }}>DATE</th>
                    <th style={{ padding: '15px' }}>INVOICE NO</th>
                    <th style={{ padding: '15px' }}>CLIENT</th>
                    <th style={{ padding: '15px' }}>TOTAL</th>
                    <th style={{ padding: '15px' }}>PAID</th>
                    <th style={{ padding: '15px' }}>BALANCE</th>
                    <th style={{ padding: '15px' }}>STATUS</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>ACTION</th>
                </tr>
            </thead>
            <tbody>
                {filteredInvoices.length === 0 ? (
                    <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                            No invoices found.
                        </td>
                    </tr>
                ) : (
                    filteredInvoices.map((inv) => {
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

                        // Parse Date
                        const dateObj = new Date(inv.date);
                        const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-GB') : 'N/A';

                        return (
                            <tr key={inv._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', color: '#555', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Clock size={14} color="#aaa" /> {formattedDate}
                                    </div>
                                </td>
                                <td style={{ padding: '15px', fontWeight: 'bold', color: '#FF4500' }}>{inv.invoiceNo}</td>
                                <td style={{ padding: '15px', fontWeight: '500', color: '#333' }}>{inv.clientDetails.name}</td>
                                <td style={{ padding: '15px' }}>₹ {inv.grandTotal.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '15px', color: '#16a34a', fontWeight: '500' }}>₹ {paid.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '15px', fontWeight: 'bold', color: balance > 0 ? '#dc2626' : '#333' }}>
                                    ₹ {balance.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <span className={`badge ${statusClass}`} style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                        {status}
                                    </span>
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    {balance > 0 ? (
                                        <button 
                                            className="pay-btn" 
                                            onClick={() => openPaymentModal(inv)}
                                            style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                        >
                                            Add Payment
                                        </button>
                                    ) : (
                                        <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '13px', fontWeight: 'bold' }}>
                                            <CheckCircle size={16}/> Completed
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {isModalOpen && selectedInvoice && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-box" style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Record Payment</h3>
                    <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#666"/></button>
                </div>
                
                <div className="modal-body">
                    <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '14px' }}><strong>Invoice:</strong> {selectedInvoice.invoiceNo}</p>
                    <p style={{ margin: '0 0 20px 0', color: '#555', fontSize: '14px' }}><strong>Client:</strong> {selectedInvoice.clientDetails.name}</p>
                    
                    <div className="balance-info" style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '20px', textAlign: 'center' }}>
                        <span style={{ color: '#b91c1c', fontSize: '14px', fontWeight: '600' }}>Pending Balance</span>
                        <h2 style={{ color: '#b91c1c', margin: '5px 0 0 0', fontSize: '28px' }}>
                            ₹ {(selectedInvoice.grandTotal - (selectedInvoice.paidAmount || 0)).toLocaleString('en-IN')}
                        </h2>
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>Enter Amount Received (₹)</label>
                        <input 
                            type="number" 
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Ex: 5000"
                            autoFocus
                            style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '16px', outline: 'none' }}
                        />
                    </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                    <button onClick={closeModal} style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                    <button onClick={handleUpdatePayment} style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm Payment</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default InvoicePayment;
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Search, FileText, FileX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Invoice.css'; 

// ✅ FIX 1: Correct API Base URL (Removed hyphen)
const API_BASE = 'https://skitecrm-1l7f.onrender.com/api';

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [activeTab, setActiveTab] = useState('gst'); // 'gst' or 'nongst'

  // Fetch Data
  const fetchInvoices = async () => {
    // ✅ FIX 2: Get Token for Authentication
    const token = localStorage.getItem('adminToken'); 

    try {
      const response = await fetch(`${API_BASE}/invoice/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ Sending Token
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Ensure data is an array
        setInvoices(Array.isArray(data) ? data : []);
      } else {
        toast.error(data.message || "Failed to fetch invoices");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server Error: Check your connection");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Delete Invoice
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;

    const token = localStorage.getItem('adminToken'); // ✅ Need token for delete too

    try {
      const response = await fetch(`${API_BASE}/invoice/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // ✅ Sending Token
        }
      });

      if (response.ok) {
        toast.success("Invoice Deleted!");
        setInvoices(prev => prev.filter(inv => inv._id !== id));
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting invoice");
    }
  };

  // ✅ FILTER & SORT LOGIC
  const filteredInvoices = invoices
    .filter(inv => {
      // Search Filter (Safe check for null values)
      const clientName = inv.clientDetails?.name?.toLowerCase() || '';
      const invoiceNo = inv.invoiceNo?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch = clientName.includes(searchLower) || invoiceNo.includes(searchLower);

      // Tab Filter (GST check)
      // taxRate > 0 means GST Invoice
      const isGST = inv.taxRate && Number(inv.taxRate) > 0;

      if (activeTab === 'gst') {
        return matchesSearch && isGST;
      } else {
        return matchesSearch && !isGST;
      }
    })
    // ✅ NEW: Sort by Date (Descending - Newest first) added here
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- HEADER SECTION --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/admin-dashboard')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '10px 15px', border: 'none', borderRadius: '6px', 
            backgroundColor: '#e5e7eb', color: '#374151', cursor: 'pointer', fontWeight: '500' 
          }}
        >
          <ArrowLeft size={18} /> Dashboard
        </button>

        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>Invoice History</h1>

        <button 
          onClick={() => navigate('/admin-dashboard/invoice')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '10px 20px', border: 'none', borderRadius: '6px', 
            backgroundColor: '#FF4500', color: 'white', cursor: 'pointer', fontWeight: '600',
            boxShadow: '0 2px 5px rgba(255, 69, 0, 0.3)'
          }}
        >
          <Plus size={18} /> Create New
        </button>
      </div>

      {/* --- TABS SECTION --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('gst')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: activeTab === 'gst' ? '#FF4500' : 'white',
            color: activeTab === 'gst' ? 'white' : '#6b7280',
            boxShadow: activeTab === 'gst' ? '0 4px 6px rgba(255, 69, 0, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}
        >
          <FileText size={20} /> GST Invoices
        </button>

        <button
          onClick={() => setActiveTab('nongst')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: activeTab === 'nongst' ? '#FF4500' : 'white',
            color: activeTab === 'nongst' ? 'white' : '#6b7280',
            boxShadow: activeTab === 'nongst' ? '0 4px 6px rgba(255, 69, 0, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}
        >
          <FileX size={20} /> Without GST Invoices
        </button>
      </div>

      {/* --- SEARCH BAR --- */}
      <div style={{ 
        backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', 
        marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Search size={20} color="#9ca3af"/>
        <input 
          type="text" 
          placeholder={`Search inside ${activeTab === 'gst' ? 'GST' : 'Non-GST'} invoices...`} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '16px', color: '#4b5563' }}
        />
      </div>

      {/* --- TABLE --- */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Loading invoices...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>INVOICE NO</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>DATE</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>CLIENT NAME</th>
                
                {activeTab === 'gst' && (
                  <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>TAX %</th>
                )}

                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>AMOUNT</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={activeTab === 'gst' ? 6 : 5} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No {activeTab === 'gst' ? 'GST' : 'Non-GST'} Invoices Found</td></tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr 
                    key={inv._id}
                    onClick={() => navigate(`/admin-dashboard/invoice/${inv._id}`)} 
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={{ padding: '15px 20px', fontWeight: '600', color: '#FF4500' }}>{inv.invoiceNo}</td>
                    <td style={{ padding: '15px 20px', color: '#374151' }}>{new Date(inv.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '15px 20px', color: '#374151', fontWeight: '500' }}>{inv.clientDetails?.name || 'N/A'}</td>
                    
                    {activeTab === 'gst' && (
                        <td style={{ padding: '15px 20px', color: '#6b7280' }}>{inv.taxRate}%</td>
                    )}

                    <td style={{ padding: '15px 20px', color: '#111827', fontWeight: '600' }}>₹ {inv.grandTotal?.toLocaleString('en-IN') || '0'}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleDelete(inv._id); 
                        }}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistory;
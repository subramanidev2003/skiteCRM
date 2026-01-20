import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Invoice.css'; // Reusing CSS

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Data
  const fetchInvoices = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/invoice/all');
      const data = await response.json();
      if (response.ok) {
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

  // 2. Delete Invoice
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const response = await fetch(`http://localhost:4000/api/invoice/delete/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Invoice Deleted!");
        setInvoices(invoices.filter(inv => inv._id !== id));
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting invoice");
    }
  };

  // Filter Logic
  const filteredInvoices = invoices.filter(inv => 
    inv.clientDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- HEADER SECTION --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        {/* Dashboard Button */}
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

        {/* Title */}
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>Invoice History</h1>

        {/* Create New Button */}
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

      {/* --- SEARCH BAR --- */}
      <div style={{ 
        backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', 
        marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Search size={20} color="#9ca3af"/>
        <input 
          type="text" 
          placeholder="Search by Client or Invoice No..." 
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
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>INVOICE NO</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>DATE</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>CLIENT NAME</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>AMOUNT</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>No Invoices Found</td></tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr 
                    key={inv._id}
                    onClick={() => navigate(`/admin-dashboard/invoice/${inv._id}`)} 
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    {/* Invoice No - Orange Color */}
                    <td style={{ padding: '15px 20px', fontWeight: '600', color: '#FF4500' }}>{inv.invoiceNo}</td>
                    <td style={{ padding: '15px 20px', color: '#374151' }}>{new Date(inv.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '15px 20px', color: '#374151', fontWeight: '500' }}>{inv.clientDetails.name}</td>
                    <td style={{ padding: '15px 20px', color: '#111827', fontWeight: '600' }}>₹ {inv.grandTotal.toLocaleString('en-IN')}</td>
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
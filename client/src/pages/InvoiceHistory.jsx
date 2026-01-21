import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Search, FileText, FileX } from 'lucide-react'; // ✅ Icons added
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Invoice.css'; 

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [activeTab, setActiveTab] = useState('gst'); // 'gst' or 'nongst'

  // Fetch Data
  const fetchInvoices = async () => {
    try {
      const response = await fetch('https://skite-crm.onrender.com/api/invoice/all');
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

  // Delete Invoice
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const response = await fetch(`https://skite-crm.onrender.com/api/invoice/delete/${id}`, {
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

  // ✅ 2. FILTER LOGIC (Tab + Search)
  const filteredInvoices = invoices.filter(inv => {
    // Search Filter
    const matchesSearch = 
      inv.clientDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());

    // Tab Filter (GST check)
    // taxRate 0-க்கு மேல் இருந்தால் அது GST Invoice
    const isGST = inv.taxRate && inv.taxRate > 0;

    if (activeTab === 'gst') {
      return matchesSearch && isGST;
    } else {
      return matchesSearch && !isGST;
    }
  });

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

      {/* --- ✅ TABS SECTION --- */}
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
                
                {/* GST Tab ஆக இருந்தால் Tax % காலமை காட்டு */}
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
                    <td style={{ padding: '15px 20px', color: '#374151', fontWeight: '500' }}>{inv.clientDetails.name}</td>
                    
                    {/* GST Tab ஆக இருந்தால் Tax மதிப்பைக் காட்டு */}
                    {activeTab === 'gst' && (
                        <td style={{ padding: '15px 20px', color: '#6b7280' }}>{inv.taxRate}%</td>
                    )}

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
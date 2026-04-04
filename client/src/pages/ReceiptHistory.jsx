import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE } from '../api';
import './Invoice.css';

const ReceiptHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ FIXED: Officer detect via pathname
  const isOfficer = location.pathname.startsWith('/officer');
  const isSales = !!localStorage.getItem("salesUser");

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReceipts = async () => {
    try {
      const response = await fetch(`${API_BASE}/receipt/all`);
      const data = await response.json();
      if (response.ok) setReceipts(data);
      else toast.error("Failed to fetch receipts");
    } catch (error) {
      toast.error("Server Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReceipts(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this receipt?")) return;
    try {
      const response = await fetch(`${API_BASE}/receipt/delete/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success("Receipt Deleted!");
        setReceipts(receipts.filter(r => r._id !== id));
      } else toast.error("Failed to delete");
    } catch (error) {
      toast.error("Error deleting receipt");
    }
  };

  const filteredReceipts = receipts.filter(r =>
    (r.clientDetails?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.receiptNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ FIXED: Officer-க்கு correct paths
  const handleBack = () => {
    if (isOfficer) navigate('/officer-dashboard');
    else if (isSales) navigate('/sales-dashboard');
    else navigate('/admin-dashboard');
  };

  const handleCreateNew = () => {
    if (isOfficer) navigate('/officer/receipt');
    else if (isSales) navigate('/sales-dashboard/receipt');
    else navigate('/admin-dashboard/receipt');
  };

  // ✅ Back button label
  const backLabel = isOfficer ? 'Officer Panel'
    : isSales ? 'Sales Panel'
    : 'Admin Dashboard';

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={handleBack}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', border: 'none', borderRadius: '6px', backgroundColor: '#e5e7eb', color: '#374151', cursor: 'pointer', fontWeight: '500' }}>
          <ArrowLeft size={18} /> {backLabel}
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>Receipt History</h1>
        <button onClick={handleCreateNew}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#FF4500', color: 'white', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 5px rgba(255,69,0,0.3)' }}>
          <Plus size={18} /> Create New
        </button>
      </div>

      {/* Search */}
      <div style={{ backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Search size={20} color="#9ca3af" />
        <input type="text" placeholder="Search by client name or receipt no..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '16px', color: '#4b5563' }} />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Loading receipts...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>RECEIPT NO</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>DATE</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>CLIENT NAME</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>PAYMENT MODE</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>AMOUNT</th>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No Receipts Found</td></tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r._id}
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                    <td style={{ padding: '15px 20px', fontWeight: '600', color: '#FF4500' }}>{r.receiptNo}</td>
                    <td style={{ padding: '15px 20px', color: '#374151' }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '15px 20px', color: '#374151', fontWeight: '500' }}>{r.clientDetails?.name}</td>
                    <td style={{ padding: '15px 20px', color: '#6b7280' }}>{r.paymentDetails?.paymentMode}</td>
                    <td style={{ padding: '15px 20px', color: '#111827', fontWeight: '600' }}>
                      ₹ {(r.paymentDetails?.amountPaid || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
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

export default ReceiptHistory;
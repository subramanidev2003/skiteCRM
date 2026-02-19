import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Search, FileText, FileX } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import { toast } from 'react-toastify';
import './Invoice.css'; 

const QuoteHistory = () => {
  const navigate = useNavigate();

  // ✅ FIX: URL-ஐ நம்பாமல் LocalStorage-ல் இருந்து உறுதியாக Role-ஐ எடுக்கிறோம்.
  const isSalesUser = () => {
    const salesUser = localStorage.getItem("salesUser");
    return !!salesUser; // salesUser இருந்தால் true, இல்லையென்றால் false
  };

  const isSales = isSalesUser(); 

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeTab, setActiveTab] = useState('gst'); // 'gst' or 'nongst'

  // 1. Fetch Data
  const fetchQuotes = async () => {
    try {
      const response = await fetch('https://skitecrm-1l7f.onrender.com/api/quote/all');
      const data = await response.json();
      if (response.ok) {
        setQuotes(data);
      } else {
        toast.error("Failed to fetch quotes");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  // 2. Delete Quote
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quote?")) return;

    try {
      const response = await fetch(`https://skitecrm-1l7f.onrender.com/api/quote/delete/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Quote Deleted!");
        setQuotes(quotes.filter(q => q._id !== id));
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting quote");
    }
  };

  // 3. FILTER LOGIC
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      (q.clientDetails?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.quoteNo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isGST = q.taxRate && q.taxRate > 0;

    if (activeTab === 'gst') {
      return matchesSearch && isGST;
    } else {
      return matchesSearch && !isGST;
    }
  });

  // ✅ Back Button Handler
  const handleBack = () => {
      navigate(isSales ? '/sales-dashboard' : '/admin-dashboard');
  };

  // ✅ Create New Button Handler
  const handleCreateNew = () => {
      navigate(isSales ? '/sales-dashboard/quote' : '/admin-dashboard/quote');
  };

  // ✅ Row Click Handler (இங்கே தான் மாற்றம்)
  const handleRowClick = (id) => {
      const path = isSales 
        ? `/sales-dashboard/quote/${id}` 
        : `/admin-dashboard/quote/${id}`;
      navigate(path);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- HEADER SECTION --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        
        {/* SMART BACK BUTTON */}
        <button 
          onClick={handleBack}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '10px 15px', border: 'none', borderRadius: '6px', 
            backgroundColor: '#e5e7eb', color: '#374151', cursor: 'pointer', fontWeight: '500' 
          }}
        >
          <ArrowLeft size={18} /> {isSales ? 'Sales Panel' : 'Admin Dashboard'}
        </button>

        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>Quote History</h1>

        {/* SMART CREATE NEW BUTTON */}
        <button 
          onClick={handleCreateNew}
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
            flex: 1, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontSize: '16px', fontWeight: '600',
            backgroundColor: activeTab === 'gst' ? '#FF4500' : 'white',
            color: activeTab === 'gst' ? 'white' : '#6b7280',
            boxShadow: activeTab === 'gst' ? '0 4px 6px rgba(255, 69, 0, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}
        >
          <FileText size={20} /> GST Records
        </button>

        <button
          onClick={() => setActiveTab('nongst')}
          style={{
            flex: 1, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontSize: '16px', fontWeight: '600',
            backgroundColor: activeTab === 'nongst' ? '#FF4500' : 'white',
            color: activeTab === 'nongst' ? 'white' : '#6b7280',
            boxShadow: activeTab === 'nongst' ? '0 4px 6px rgba(255, 69, 0, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}
        >
          <FileX size={20} /> Without GST Records
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
          placeholder={`Search inside ${activeTab === 'gst' ? 'GST' : 'Non-GST'} records...`} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '16px', color: '#4b5563' }}
        />
      </div>

      {/* --- TABLE --- */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Loading quotes...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>QUOTE NO</th>
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
              {filteredQuotes.length === 0 ? (
                <tr><td colSpan={activeTab === 'gst' ? 6 : 5} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No {activeTab === 'gst' ? 'GST' : 'Non-GST'} Quotes Found</td></tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr 
                    key={q._id}
                    onClick={() => handleRowClick(q._id)} // ✅ Corrected Navigation Here
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={{ padding: '15px 20px', fontWeight: '600', color: '#FF4500' }}>{q.quoteNo}</td>
                    <td style={{ padding: '15px 20px', color: '#374151' }}>{new Date(q.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '15px 20px', color: '#374151', fontWeight: '500' }}>{q.clientDetails.name}</td>
                    
                    {activeTab === 'gst' && (
                        <td style={{ padding: '15px 20px', color: '#6b7280' }}>{q.taxRate}%</td>
                    )}

                    <td style={{ padding: '15px 20px', color: '#111827', fontWeight: '600' }}>₹ {q.grandTotal.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleDelete(q._id); 
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

export default QuoteHistory;
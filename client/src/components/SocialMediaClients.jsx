import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import './SocialMedia.css'; 

const API_BASE = 'http://localhost:4000/api';

const SocialMediaClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ clientName: '', businessName: '', month: 'March 2026' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/social-media/all`);
      const data = await res.json();
      if(res.ok) setClients(data);
    } catch (err) { console.error(err); }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/social-media/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      if (res.ok) {
        toast.success("Client Added Successfully!");
        setIsModalOpen(false);
        fetchClients();
      }
    } catch (err) { toast.error("Error adding client"); }
  };

  // ✅ HELPER: Convert "March 2026" -> "2026-03" for Filtering
  const getMonthPrefix = (monthStr) => {
    if (!monthStr) return "";
    const date = new Date(Date.parse("1 " + monthStr)); 
    if (isNaN(date)) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // ✅ CORRECTED LOGIC: Count only CURRENT MONTH's posts
  const getRemainingCount = (client) => {
    if (!client.days || !client.month) return 0;
    const target = client.videoTarget || 0;
    
    // 1. Get the prefix for the ACTIVE month (e.g., "2026-03")
    const currentMonthPrefix = getMonthPrefix(client.month);

    // 2. Filter days that belong ONLY to that month AND are 'Posted'
    const postedCount = client.days.filter(d => 
        d.date.startsWith(currentMonthPrefix) && 
        d.postStatus === 'Posted'
    ).length;
    
    const remaining = target - postedCount;
    return remaining > 0 ? remaining : 0; 
  };

  return (
    <div className="sm-wrapper">
        
        {/* Header */}
        <div className="sm-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button onClick={() => navigate('/admin-dashboard/projects')} className="btn-back">
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="sm-title">
                    <h1>Social Media Clients</h1>
                    <span>Manage your monthly marketing trackers</span>
                </div>
            </div>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> Add Client
            </button>
        </div>

        {/* Client Grid */}
        <div className="sm-grid">
            {clients.map(client => {
                const remaining = getRemainingCount(client);
                
                return (
                <div key={client._id} className="client-card" onClick={() => navigate(`/social-media/tracker/${client._id}`)}>
                    <div className="card-icon-bg">
                        <Users size={24} color="#FF4500"/>
                    </div>
                    <div className="client-name">{client.clientName}</div>
                    <div className="business-name">{client.businessName || 'No Business Name'}</div>
                    
                    <div className="month-tag" style={{fontSize: '12px', color: '#707eae', marginBottom: '10px'}}>
                        📅 {client.month}
                    </div>

                    {/* STATUS BADGE */}
                    <div style={{marginBottom: '15px'}}>
                         <span style={{
                             fontSize: '11px', fontWeight: 'bold', 
                             color: remaining === 0 ? '#05cd99' : '#FF4500',
                             background: remaining === 0 ? '#e6fffa' : '#fff5f5',
                             padding: '5px 10px', borderRadius: '6px',
                             display: 'inline-block'
                         }}>
                             {remaining === 0 ? 'All Videos Done 🎉' : `🎥 Pending Videos: ${remaining}`}
                         </span>
                    </div>

                    <div className={`badge ${client.paymentStatus === 'Paid' ? 'paid' : 'pending'}`}>
                        {client.paymentStatus === 'Paid' ? 'Payment Done' : 'Payment Pending'}
                    </div>
                </div>
                );
            })}
            
            {clients.length === 0 && (
                <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: '#a3aed0'}}>
                    No clients found. Click "Add Client" to start.
                </div>
            )}
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="sm-modal-overlay">
                <div className="sm-modal">
                    <h3 style={{margin: '0 0 20px', color: '#1b2559'}}>Add New Client</h3>
                    <form onSubmit={handleAddClient}>
                        <div className="sm-input-group">
                            <label>Client Name</label>
                            <input type="text" required placeholder="e.g. John Doe" onChange={e => setNewClient({...newClient, clientName: e.target.value})} />
                        </div>
                        <div className="sm-input-group">
                            <label>Business Name</label>
                            <input type="text" placeholder="e.g. Skite Digital" onChange={e => setNewClient({...newClient, businessName: e.target.value})} />
                        </div>
                        <div className="sm-input-group">
                            <label>Month & Year</label>
                            <input type="text" placeholder="e.g. March 2026" value={newClient.month} onChange={e => setNewClient({...newClient, month: e.target.value})} />
                        </div>
                        <button type="submit" className="btn-primary" style={{width: '100%', justifyContent: 'center'}}>Save Client</button>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{marginTop: '15px', width: '100%', background: 'transparent', border: 'none', color: '#707eae', cursor: 'pointer'}}>Cancel</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default SocialMediaClients;
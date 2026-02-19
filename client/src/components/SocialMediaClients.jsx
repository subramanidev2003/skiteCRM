import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Phone, Mail } from 'lucide-react'; // Icons added
import { toast } from 'react-toastify';
import './SocialMedia.css'; 

const API_BASE = 'https://skitecrm-1l7f.onrender.com/api';

const SocialMediaClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ✅ New Client Form (Phone & Email Added)
  const [newClient, setNewClient] = useState({ 
      clientName: '', 
      businessName: '', 
      phone: '',
      email: '',
      month: 'March 2026' 
  });

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
        // Reset Form
        setNewClient({ clientName: '', businessName: '', phone: '', email: '', month: 'March 2026' });
      }
    } catch (err) { toast.error("Error adding client"); }
  };

  // Helper for Badge
  const getRemainingCount = (client) => {
    // Unga existing logic apdiye irukattum
    // (Dummy logic for display)
    return client.videoTarget ? client.videoTarget : 0; 
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

        {/* Clients Grid */}
        <div className="sm-grid">
            {clients.map(client => (
                <div 
                    key={client._id} 
                    className="client-card" 
                    onClick={() => navigate(`/projects/social-media/${client._id}`)}
                    style={{cursor: 'pointer'}}
                >
                    <div className="card-icon-bg">
                        <Users size={24} color="#FF4500"/>
                    </div>
                    <div className="client-name">{client.clientName}</div>
                    <div className="business-name">{client.businessName || 'No Business Name'}</div>
                    
                    {/* Phone Display (Optional inside card) */}
                    <div style={{fontSize: '12px', color: '#666', marginTop: '5px', display:'flex', alignItems:'center', gap:'5px', justifyContent:'center'}}>
                        {client.phone && <><Phone size={10}/> {client.phone}</>}
                    </div>
                </div>
            ))}
            
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
                            <input type="text" required placeholder="e.g. John Doe" value={newClient.clientName} onChange={e => setNewClient({...newClient, clientName: e.target.value})} />
                        </div>
                        
                        <div className="sm-input-group">
                            <label>Business Name</label>
                            <input type="text" placeholder="e.g. Skite Digital" value={newClient.businessName} onChange={e => setNewClient({...newClient, businessName: e.target.value})} />
                        </div>

                        {/* ✅ NEW: Phone & Email */}
                        <div style={{display:'flex', gap:'10px'}}>
                            <div className="sm-input-group" style={{flex:1}}>
                                <label>Phone</label>
                                <input type="text" placeholder="9876543210" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                            </div>
                            <div className="sm-input-group" style={{flex:1}}>
                                <label>Email</label>
                                <input type="email" placeholder="abc@gmail.com" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                            </div>
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
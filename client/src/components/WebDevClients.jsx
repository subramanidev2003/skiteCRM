import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Globe, Phone, Mail, Trash2, Link } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE } from '../api';
import './SocialMedia.css'; 

// const API_BASE = 'https://skitecrm-1l7f.onrender.com/api';

const WebDevClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ✅ Website field added
  const [newClient, setNewClient] = useState({ 
      clientName: '', businessName: '', phone: '', email: '', website: '' 
  });

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/webdev/clients`);
      const data = await res.json();
      if(res.ok) setClients(data);
    } catch (err) { console.error(err); }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/webdev/clients/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      if (res.ok) {
        toast.success("Client Added!");
        setIsModalOpen(false);
        fetchClients();
        setNewClient({ clientName: '', businessName: '', phone: '', email: '', website: '' });
      }
    } catch (err) { toast.error("Error adding client"); }
  };

  // ✅ Client Delete Function
  const handleDeleteClient = async (e, id) => {
    e.stopPropagation(); // கார்டை க்ளிக் செய்து உள்ளே போவதை தடுக்க
    if (!window.confirm("Are you sure you want to delete this client completely?")) return;

    try {
        const res = await fetch(`${API_BASE}/webdev/clients/delete/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            toast.success("Client Deleted!");
            fetchClients();
        } else {
            toast.error("Failed to delete client");
        }
    } catch (err) {
        toast.error("Error deleting client");
    }
  };

  return (
    <div className="sm-wrapper">
        <div className="sm-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button onClick={() => navigate('/admin-dashboard/projects')} className="btn-back">
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="sm-title">
                    <h1>Web Development Projects</h1>
                </div>
            </div>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> Add Client
            </button>
        </div>

        <div className="sm-grid">
            {clients.map(client => (
                <div key={client._id} className="client-card" onClick={() => navigate(`/webdev/project/${client._id}`)} style={{cursor:'pointer', position: 'relative'}}>
                    
                    {/* ✅ DELETE ICON */}
                    <button 
                        onClick={(e) => handleDeleteClient(e, client._id)}
                        style={{position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer'}}
                        title="Delete Client"
                    >
                        <Trash2 size={18} />
                    </button>

                    <div className="card-icon-bg"><Globe size={24} color="#FF4500"/></div>
                    <div className="client-name">{client.businessName}</div>
                    <div className="business-name">{client.clientName}</div>
                    
                    <div style={{fontSize:'12px', color:'#666', marginTop:'10px', display: 'flex', flexDirection: 'column', gap: '5px'}}>
                        {client.phone && <div><Phone size={10}/> {client.phone}</div>}
                        {client.website && <div><Link size={10}/> {client.website}</div>}
                    </div>
                    <div className={`badge ${client.projectStatus === 'Completed' ? 'paid' : 'pending'}`}>
                        {client.projectStatus || 'Pending'}
                    </div>
                </div>
            ))}
        </div>

        {isModalOpen && (
            <div className="sm-modal-overlay">
                <div className="sm-modal">
                    <h3>Add Web Dev Client</h3>
                    <form onSubmit={handleAddClient}>
                        <div className="sm-input-group"><label>Name</label><input required value={newClient.clientName} onChange={e=>setNewClient({...newClient, clientName:e.target.value})}/></div>
                        <div className="sm-input-group"><label>Business Name</label><input required value={newClient.businessName} onChange={e=>setNewClient({...newClient, businessName:e.target.value})}/></div>
                        <div className="sm-input-group"><label>Website Link</label><input placeholder="www.example.com" value={newClient.website} onChange={e=>setNewClient({...newClient, website:e.target.value})}/></div>
                        <div style={{display:'flex', gap:'10px'}}>
                            <div className="sm-input-group"><label>Phone</label><input value={newClient.phone} onChange={e=>setNewClient({...newClient, phone:e.target.value})}/></div>
                            <div className="sm-input-group"><label>Email</label><input value={newClient.email} onChange={e=>setNewClient({...newClient, email:e.target.value})}/></div>
                        </div>
                        <button type="submit" className="btn-primary" style={{width:'100%'}}>Save</button>
                        <button type="button" onClick={()=>setIsModalOpen(false)} style={{marginTop:'10px', width:'100%', background:'transparent', border:'none'}}>Cancel</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
export default WebDevClients;
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import './AdminServiceType.css'; 

const API_BASE = 'https://skitecrm.onrender.com/api';

const AdminServiceType = () => {
    const { serviceName } = useParams();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

   useEffect(() => {
        const fetchLeads = async () => {
            try {
                // ✅ Fetching all leads (Admin access)
                const response = await fetch(`${API_BASE}/leads/admin/all`); // admin/all அல்லது common/all எதுவேண்டுமானாலும் இருக்கலாம்
                const data = await response.json();
                
                if (response.ok && Array.isArray(data)) {
                    
                    // 1. URL-ல் வரும் பெயரை Small letters ஆகவும், Space-ஐ நீக்கியும் எடுக்கிறோம்
                    const targetService = decodeURIComponent(serviceName).trim().toLowerCase();

                    const filtered = data.filter(lead => {
                        // 2. Database-ல் உள்ள Service Type-ஐயும் Small letters ஆக மாற்றுகிறோம்
                        const dbService = lead.serviceType ? lead.serviceType.trim().toLowerCase() : '';
                        
                        // 3. இப்போது இரண்டையும் ஒப்பிடுகிறோம்
                        return dbService === targetService;
                    });
                    
                    // Sort by Date (Newest first)
                    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    setLeads(filtered);
                } else {
                    setLeads([]);
                }
            } catch (error) {
                console.error("Error fetching leads:", error);
                toast.error("Failed to load leads");
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, [serviceName]);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if(!window.confirm("Are you sure you want to delete this lead?")) return;

        try {
            const res = await fetch(`${API_BASE}/leads/delete/${id}`, { method: 'DELETE' });
            if(res.ok) {
                setLeads(prev => prev.filter(l => (l._id || l.id) !== id));
                toast.success("Lead deleted");
            } else {
                toast.error("Failed to delete");
            }
        } catch(err) { toast.error("Server Error"); }
    };

    // Helper to format Date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="ad-page-container">
            
            {/* HEADER */}
            <div className="ad-page-header">
                <button className="ad-btn-back" onClick={() => navigate('/admin-dashboard')}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <div className="header-text">
                    <h1 className="ad-page-title">{decodeURIComponent(serviceName)}</h1>
                    <p className="ad-page-subtitle">{leads.length} Leads Found</p>
                </div>
            </div>

            {/* TABLE */}
            <div className="ad-table-wrapper">
                {loading ? (
                    <div className="ad-loading">Loading...</div>
                ) : (
                    <table className="ad-leads-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client Name</th>
                                <th>Phone</th>
                                <th>Company</th>
                                <th>Priority</th>
                                
                                {/* ✅ NEW COLUMNS ADDED */}
                                <th>Follow Up</th>
                                <th>Callback</th>
                                <th>Closing</th>
                                <th style={{textAlign: 'center'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="ad-no-data">
                                        No leads found for {decodeURIComponent(serviceName)}.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr 
                                        key={lead._id || lead.id} 
                                        className="ad-lead-row" 
                                        onClick={() => navigate(`/admin-dashboard/lead-detail/${lead._id}`, { state: { lead } })}
                                    >
                                        <td data-label="Date">{lead.date}</td>
                                        <td data-label="Client Name" className="font-bold">{lead.name}</td>
                                        <td data-label="Phone">{lead.phoneNumber}</td>
                                        <td data-label="Company">{lead.companyName || '-'}</td>
                                        
                                        <td data-label="Priority">
                                            <span className={`ad-priority-badge ${lead.priority?.toLowerCase()}`}>
                                                {lead.priority}
                                            </span>
                                        </td>
                                        
                                        
                                        
                                        {/* ✅ NEW DATA FIELDS */}
                                        <td data-label="Follow Up">{lead.followUpStatus || '-'}</td>
                                        <td data-label="Callback">{formatDate(lead.callbackReminder)}</td>
                                        <td data-label="Closing">{lead.closing}</td>
                                        <td data-label="Action" style={{textAlign: 'center'}}>
                                            <button 
                                                className="ad-btn-delete"
                                                onClick={(e) => handleDelete(e, lead._id || lead.id)}
                                            >
                                                <Trash2 size={18}/>
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

export default AdminServiceType;
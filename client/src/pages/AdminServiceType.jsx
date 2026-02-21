import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Filter } from 'lucide-react'; // ✅ Added Filter icon
import { toast } from 'react-toastify';
import './AdminServiceType.css'; 

const API_BASE = 'https://skitecrm-1l7f.onrender.com/api';

const AdminServiceType = () => {
    const { serviceName } = useParams();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]); // ✅ State for filtered data
    const [loading, setLoading] = useState(true);

    // ✅ Filter State
    const [orderStatusFilter, setOrderStatusFilter] = useState('All');

   useEffect(() => {
        const fetchLeads = async () => {
            try {
                const response = await fetch(`${API_BASE}/leads/admin/all`); 
                const data = await response.json();
                
                if (response.ok && Array.isArray(data)) {
                    
                    const targetService = decodeURIComponent(serviceName).trim().toLowerCase();

                    const filtered = data.filter(lead => {
                        const dbService = lead.serviceType ? lead.serviceType.trim().toLowerCase() : '';
                        return dbService === targetService;
                    });
                    
                    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    setLeads(filtered);
                    setFilteredLeads(filtered); // ✅ Initialize filtered leads
                } else {
                    setLeads([]);
                    setFilteredLeads([]);
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

    // ✅ Handle Filter Change
    useEffect(() => {
        if (orderStatusFilter === 'All') {
            setFilteredLeads(leads);
        } else {
            const result = leads.filter(lead => 
                (lead.orderStatus || 'Open').toLowerCase() === orderStatusFilter.toLowerCase()
            );
            setFilteredLeads(result);
        }
    }, [orderStatusFilter, leads]);

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
                <div className="header-text" style={{ flex: 1, marginLeft: '20px' }}>
                    <h1 className="ad-page-title">{decodeURIComponent(serviceName)}</h1>
                    <p className="ad-page-subtitle">{filteredLeads.length} Leads Found</p>
                </div>

                {/* ✅ FILTER DROPDOWN */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}>
                        <Filter size={18} color="#555" />
                        <select 
                            value={orderStatusFilter}
                            onChange={(e) => setOrderStatusFilter(e.target.value)}
                            style={{ border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '500', color: '#333' }}
                        >
                            <option value="All">All Orders</option>
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
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
                                <th>Call Status</th>
                                <th>Order Status</th> 
                                <th>Follow Up 1</th>
                                <th>Follow Up 2</th>
                                <th>Priority</th>
                                <th>Closing</th>
                                <th style={{textAlign: 'center'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="ad-no-data">
                                        No {orderStatusFilter !== 'All' ? orderStatusFilter : ''} leads found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr 
                                        key={lead._id || lead.id} 
                                        className="ad-lead-row" 
                                        onClick={() => navigate(`/admin-dashboard/lead-detail/${lead._id}`, { state: { lead } })}
                                    >
                                        <td data-label="Date">{lead.date}</td>
                                        <td data-label="Client Name" className="font-bold">{lead.name}</td>
                                        <td data-label="Phone">{lead.phoneNumber}</td>
                                        <td data-label="Company">{lead.companyName || '-'}</td>
                                        
                                        <td data-label="Call Status">
                                            <span className={`st-status-badge ${lead.callStatus?.toLowerCase().replace(/\s/g, '-')}`}>
                                                {lead.callStatus || '-'}
                                            </span>
                                        </td>

                                        <td data-label="Order Status">
                                            <span className={`st-status-badge ${lead.orderStatus?.toLowerCase() || 'open'}`}>
                                                {lead.orderStatus || 'Open'}
                                            </span>
                                        </td>

                                        <td data-label="Follow Up 1" style={{maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={lead.requirement}>
                                            {lead.requirement || '-'}
                                        </td>

                                        <td data-label="Follow Up 2" style={{maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={lead.remainder2}>
                                            {lead.remainder2 || '-'}
                                        </td>

                                        <td data-label="Priority">
                                            <span className={`ad-priority-badge ${lead.priority?.toLowerCase()}`}>
                                                {lead.priority}
                                            </span>
                                        </td>
                                        
                                        <td data-label="Closing" style={{fontWeight:'bold', color: lead.closing === 'Yes' ? 'green' : 'red'}}>
                                            {lead.closing}
                                        </td>
                                        
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
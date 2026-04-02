import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Filter, Search, Calendar, Phone, Flag } from 'lucide-react'; // ✅ Added Flag icon for Priority
import { toast } from 'react-toastify';
import { API_BASE } from '../api';
import './AdminServiceType.css'; 

// const API_BASE = 'https://skitecrm-1l7f.onrender.com/api';

const AdminServiceType = () => {
    const { serviceName } = useParams();
    const navigate = useNavigate();

        // ✅ FIX: Role-based back navigation
    const storedUser = JSON.parse(
        localStorage.getItem("adminUser") || 
        localStorage.getItem("managerUser") || 
        localStorage.getItem("userData") || '{}'
    );
    const isManager = storedUser?.role?.toLowerCase() === 'manager';
    const handleBack = () => {
        if (isManager) navigate('/manager-dashboard');
        else navigate('/admin-dashboard');
    };

    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]); 
    const [loading, setLoading] = useState(true);

    // ✅ All Filter States
    const [globalSearch, setGlobalSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [callStatusFilter, setCallStatusFilter] = useState('All');
    const [orderStatusFilter, setOrderStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All'); // ✅ New Priority Filter State

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
                    setFilteredLeads(filtered); 
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

    // ✅ Handle Multiple Filters Change
    useEffect(() => {
        let result = leads;

        // 1. Global Search Filter
        if (globalSearch.trim() !== '') {
            const query = globalSearch.toLowerCase();
            result = result.filter(lead => 
                (lead.name || '').toLowerCase().includes(query) ||
                (lead.companyName || '').toLowerCase().includes(query) ||
                (lead.phoneNumber || '').toLowerCase().includes(query) ||
                (lead.followUpResponsibility || '').toLowerCase().includes(query) ||
                (lead.requirement || '').toLowerCase().includes(query) ||
                (lead.remainder2 || '').toLowerCase().includes(query)
            );
        }

        // 2. Date Filter
        if (dateFilter) {
            // Compare YYYY-MM-DD
            result = result.filter(lead => {
                if(!lead.date) return false;
                // Just ensuring format matches the input type="date" value
                return lead.date === dateFilter || new Date(lead.date).toISOString().split('T')[0] === dateFilter;
            });
        }

        // 3. Call Status Filter
        if (callStatusFilter !== 'All') {
            result = result.filter(lead => 
                (lead.callStatus || '').toLowerCase() === callStatusFilter.toLowerCase()
            );
        }

        // 4. Order Status Filter
        if (orderStatusFilter !== 'All') {
            result = result.filter(lead => 
                (lead.orderStatus || 'Open').toLowerCase() === orderStatusFilter.toLowerCase()
            );
        }

        // 5. Priority Filter (✅ Puthusa add panni irukom)
        if (priorityFilter !== 'All') {
            result = result.filter(lead => 
                (lead.priority || '').toLowerCase() === priorityFilter.toLowerCase()
            );
        }

        setFilteredLeads(result);
    }, [globalSearch, dateFilter, callStatusFilter, orderStatusFilter, priorityFilter, leads]);

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

    return (
        <div className="ad-page-container">
            
            {/* HEADER */}
            <div className="ad-page-header">
                <button className="ad-btn-back" onClick={handleBack}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <div className="header-text" style={{ flex: 1, marginLeft: '20px' }}>
                    <h1 className="ad-page-title">{decodeURIComponent(serviceName)}</h1>
                    <p className="ad-page-subtitle">{filteredLeads.length} Leads Found</p>
                </div>
            </div>

            {/* ✅ FILTER BAR */}
            <div style={{ 
                display: 'flex', flexWrap: 'wrap', gap: '15px', padding: '15px', 
                background: 'white', borderRadius: '8px', marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                {/* Global Search Filter */}
                <div style={{ flex: '1', minWidth: '250px', display: 'flex', alignItems: 'center', background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <Search size={16} color="#6b7280" style={{marginRight: '8px'}} />
                    <input 
                        type="text" 
                        placeholder="Search name, company, follow up..." 
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                    />
                </div>

                {/* Date Filter */}
                <div style={{ flex: '1', minWidth: '150px', display: 'flex', alignItems: 'center', background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <Calendar size={16} color="#6b7280" style={{marginRight: '8px'}} />
                    <input 
                        type="date" 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: '#374151' }}
                    />
                    {dateFilter && (
                        <button onClick={() => setDateFilter('')} style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer', fontSize:'12px', marginLeft:'5px'}}>Clear</button>
                    )}
                </div>

                {/* Call Status Filter */}
                <div style={{ flex: '1', minWidth: '150px', display: 'flex', alignItems: 'center', background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <Phone size={16} color="#6b7280" style={{marginRight: '8px'}} />
                    <select 
                        value={callStatusFilter}
                        onChange={(e) => setCallStatusFilter(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', cursor: 'pointer', color: '#374151' }}
                    >
                        <option value="All">All Calls</option>
                        <option value="Attend">Attend</option>
                        <option value="Not Attend">Not Attend</option>
                        <option value="Callback">Callback</option>
                    </select>
                </div>

                {/* Order Status Filter */}
                <div style={{ flex: '1', minWidth: '150px', display: 'flex', alignItems: 'center', background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <Filter size={16} color="#6b7280" style={{marginRight: '8px'}} />
                    <select 
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', cursor: 'pointer', color: '#374151' }}
                    >
                        <option value="All">All Orders</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                {/* ✅ Priority Filter */}
                <div style={{ flex: '1', minWidth: '150px', display: 'flex', alignItems: 'center', background: '#f9fafb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <Flag size={16} color="#6b7280" style={{marginRight: '8px'}} />
                    <select 
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', cursor: 'pointer', color: '#374151' }}
                    >
                        <option value="All">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>

            </div>

            {/* ✅ TABLE WRAPPER WITH SCROLL (Fix for overflow) */}
            <div className="ad-table-wrapper" style={{ width: '100%', overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {loading ? (
                    <div className="ad-loading" style={{padding: '20px', textAlign: 'center'}}>Loading...</div>
                ) : (
                    <table className="ad-leads-table" style={{ width: '100%', minWidth: '1300px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                                <th style={{padding: '12px'}}>Date</th>
                                <th style={{padding: '12px'}}>Client Name</th>
                                <th style={{padding: '12px'}}>Phone</th>
                                <th style={{padding: '12px'}}>Company</th>
                                <th style={{padding: '12px'}}>Call Status</th>
                                <th style={{padding: '12px'}}>Order Status</th> 
                                <th style={{padding: '12px'}}>Follow Up 1</th>
                                <th style={{padding: '12px'}}>Follow Up 2</th>
                                <th style={{padding: '12px'}}>Responsibility</th>
                                <th style={{padding: '12px'}}>Priority</th>
                                <th style={{padding: '12px'}}>Closing</th>
                                <th style={{textAlign: 'center', padding: '12px'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan="12" className="ad-no-data" style={{textAlign: 'center', padding: '30px', color: '#6b7280'}}>
                                        No leads found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr 
                                        key={lead._id || lead.id} 
                                        className="ad-lead-row" 
                                        onClick={() => navigate(`/admin-dashboard/lead-detail/${lead._id}`, { state: { lead } })}
                                        style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                                    >
                                        <td data-label="Date" style={{padding: '12px'}}>{lead.date}</td>
                                        <td data-label="Client Name" className="font-bold" style={{padding: '12px'}}>{lead.name}</td>
                                        <td data-label="Phone" style={{padding: '12px'}}>{lead.phoneNumber}</td>
                                        <td data-label="Company" style={{padding: '12px'}}>{lead.companyName || '-'}</td>
                                        
                                        <td data-label="Call Status" style={{padding: '12px'}}>
                                            <span className={`st-status-badge ${lead.callStatus?.toLowerCase().replace(/\s/g, '-')}`}>
                                                {lead.callStatus || '-'}
                                            </span>
                                        </td>

                                        <td data-label="Order Status" style={{padding: '12px'}}>
                                            <span className={`st-status-badge ${lead.orderStatus?.toLowerCase() || 'open'}`}>
                                                {lead.orderStatus || 'Open'}
                                            </span>
                                        </td>

                                        <td data-label="Follow Up 1" style={{maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '12px'}} title={lead.requirement}>
                                            {lead.requirement || '-'}
                                        </td>

                                        <td data-label="Follow Up 2" style={{maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '12px'}} title={lead.remainder2}>
                                            {lead.remainder2 || '-'}
                                        </td>

                                        <td data-label="Responsibility" style={{fontWeight: '500', color: '#4f46e5', padding: '12px'}}>
                                            {lead.followUpResponsibility || '-'}
                                        </td>

                                        <td data-label="Priority" style={{padding: '12px'}}>
                                            <span className={`ad-priority-badge ${lead.priority?.toLowerCase()}`}>
                                                {lead.priority}
                                            </span>
                                        </td>
                                        
                                        <td data-label="Closing" style={{fontWeight:'bold', color: lead.closing === 'Yes' ? 'green' : 'red', padding: '12px'}}>
                                            {lead.closing}
                                        </td>
                                        
                                        <td data-label="Action" style={{textAlign: 'center', padding: '12px'}}>
                                            <button 
                                                className="ad-btn-delete"
                                                style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
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
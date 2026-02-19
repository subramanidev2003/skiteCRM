import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Filter, X, Trash2 } from 'lucide-react'; 
import './AllLeadPage.css';
import { toast } from 'react-toastify'; 

const AllLeadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [leads, setLeads] = useState([]);      
  const [filteredLeads, setFilteredLeads] = useState([]); 

  // Filter States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedService, setSelectedService] = useState('All');

  const serviceOptions = [
    "All", "Web Development", "SEO", "Paid Campaigns", 
    "Personal Branding", "Full Digital Marketing"
  ];

  const isAdmin = location.pathname.includes('admin');

  useEffect(() => {
    fetch("https://skitecrm-1l7f.onrender.com/api/leads/common/all")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setLeads(data);
            setFilteredLeads(data);
        }
      })
      .catch((err) => console.error("Error loading leads", err));
  }, []);

  const handleDelete = async (e, leadId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this lead permanently?")) return;

    try {
        const response = await fetch(`https://skitecrm-1l7f.onrender.com/api/leads/delete/${leadId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            const updatedList = leads.filter(lead => (lead._id || lead.id) !== leadId);
            setLeads(updatedList);
            setFilteredLeads(prev => prev.filter(lead => (lead._id || lead.id) !== leadId));
            toast.success("Lead Deleted");
        } else {
            toast.error("Failed to delete");
        }
    } catch (error) {
        toast.error("Server Error");
    }
  };

  const handleFilter = () => {
    let result = leads;
    if (selectedService !== 'All') {
      result = result.filter(lead => lead.serviceType === selectedService);
    }
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(lead => {
        const leadDate = new Date(lead.date);
        return leadDate >= start && leadDate <= end;
      });
    }
    setFilteredLeads(result);
  };

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedService('All');
    setFilteredLeads(leads);
  };

  return (
    <div className="all-leads-container">
        
        {/* 1. HEADER */}
        <div className="leads-header">
            <div className="header-left">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="header-text">
                    <h2 className="page-title">All Leads Overview</h2>
                    {/* <p className="page-subtitle">Manage and track your sales leads</p> */}
                </div>
            </div>
        </div>

        {/* 2. NEW INLINE FILTER BAR */}
        <div className="inline-filter-container">
            
            {/* From Date */}
            <div className="inline-group">
                <span className="inline-label">From:</span>
                <input 
                    type="date" 
                    className="inline-input"
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)} 
                />
            </div>

            {/* To Date */}
            <div className="inline-group">
                <span className="inline-label">To:</span>
                <input 
                    type="date" 
                    className="inline-input"
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)} 
                />
            </div>

            {/* Service Select */}
            <div className="inline-group">
                <span className="inline-label">Service:</span>
                <select 
                    className="inline-select"
                    value={selectedService} 
                    onChange={(e) => setSelectedService(e.target.value)}
                >
                    {serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>

            {/* Buttons */}
            <div className="inline-actions">
                <button className="inline-btn btn-primary" onClick={handleFilter}>
                    <Filter size={16} /> Filter
                </button>
                <button className="inline-btn btn-secondary" onClick={resetFilters}>
                    <X size={16} /> Reset
                </button>
            </div>
        </div>

        {/* 3. LEADS TABLE */}
        <div className="table-card">
            <table className="leads-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Client Name</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>Service</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th className="text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLeads.length === 0 ? (
                        <tr><td colSpan="8" className="no-data">No leads found matching criteria.</td></tr>
                    ) : (
                        filteredLeads.map((lead) => (
                            <tr 
                                key={lead._id || lead.id} 
                                className="clickable-row"
                                onClick={() => navigate(
                                    isAdmin 
                                    ? `/admin-dashboard/lead-detail/${lead._id}` 
                                    : `/lead-detail/${lead._id}`, 
                                    { state: { lead } }
                                )}
                            >
                                <td data-label="Date">{lead.date}</td>
                                <td data-label="Name" className="font-bold">{lead.name}</td>
                                <td data-label="Phone">{lead.phoneNumber}</td>
                                <td data-label="Company">{lead.companyName || '-'}</td>
                                <td data-label="Service">{lead.serviceType}</td>
                                <td data-label="Priority">
                                    <span className={`priority-badge ${lead.priority?.toLowerCase()}`}>
                                        {lead.priority}
                                    </span>
                                </td>
                                <td data-label="Status">
                                    <span className={`status-badge ${lead.closing === 'Yes' ? 'closed' : 'open'}`}>
                                        {lead.closing === 'Yes' ? 'Closed' : 'Open'}
                                    </span>
                                </td>
                                <td data-label="Action" className="text-center">
                                    <button 
                                        className="btn-icon-delete"
                                        onClick={(e) => handleDelete(e, lead._id || lead.id)}
                                        title="Delete Lead"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default AllLeadPage;
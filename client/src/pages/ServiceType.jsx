import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react'; // Added Filter icon
import './ServiceType.css';

const ServiceType = () => {
  const { serviceName } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]); // State for filtered data
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  useEffect(() => {
    const storedUser = localStorage.getItem('salesUser');
    if (!storedUser) {
      navigate('/');
      return;
    }

    // ✅ Fetch ALL leads using common API
    fetch(`https://skitecrm-1l7f.onrender.com/api/leads/common/all`) 
      .then(res => {
          if (!res.ok) {
              throw new Error(`API Error: ${res.status}`);
          }
          return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          
          const targetService = decodeURIComponent(serviceName).trim().toLowerCase();

          const filtered = data.filter(lead => {
              const dbService = lead.serviceType ? lead.serviceType.trim().toLowerCase() : '';
              return dbService === targetService;
          });

          // Sort by Priority
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          filtered.sort((a, b) => {
            const pA = priorityOrder[a.priority] || 0;
            const pB = priorityOrder[b.priority] || 0;
            return pB - pA; 
          });

          setLeads(filtered);
          setFilteredLeads(filtered); // Initialize filtered leads
        }
      })
      .catch(err => {
          console.error("Error loading leads:", err);
      })
      .finally(() => setLoading(false));
      
  }, [navigate, serviceName]);

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

  return (
    <div className="st-page-container">
      <div className="st-page-content">
        
        {/* HEADER */}
        <div className="st-page-header">
            <div style={{flex: 1}}>
                <button className="st-btn-back" onClick={() => navigate('/sales-dashboard')}>
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
            </div>
            
            <h2 className="st-page-title">{decodeURIComponent(serviceName)} Leads</h2>

            {/* ✅ FILTER DROPDOWN */}
            <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
                <div className="st-filter-container">
                    <Filter size={18} color="#555" />
                    <select 
                        className="st-filter-select"
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
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
        <div className="st-table-wrapper">
            {loading ? (
                <div style={{padding:'20px', textAlign:'center', color:'#666'}}>Loading...</div>
            ) : (
                <table className="st-leads-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Company</th>
                            <th>Call Status</th>
                            <th>Order Status</th> {/* ✅ New Column */}
                            <th>Requirement</th>
                            <th>Priority</th>
                            <th>Closing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="st-no-data">
                                    No {orderStatusFilter !== 'All' ? orderStatusFilter : ''} leads found.
                                </td>
                            </tr>
                        ) : (
                            filteredLeads.map((lead) => (
                                <tr 
                                    key={lead._id || lead.id} 
                                    className="st-lead-row"
                                    onClick={() => navigate(`/lead-detail/${lead._id}`, { state: { lead } })}
                                >
                                    <td>{lead.date}</td>
                                    <td>{lead.name}</td>
                                    <td>{lead.phoneNumber}</td>
                                    <td>{lead.companyName || '-'}</td>
                                    
                                    <td>
                                        <span className={`st-status-badge ${lead.callStatus?.toLowerCase().replace(/\s/g, '-')}`}>
                                            {lead.callStatus || '-'}
                                        </span>
                                    </td>

                                    {/* ✅ Order Status Column */}
                                    <td>
                                        <span className={`st-status-badge ${lead.orderStatus?.toLowerCase() || 'open'}`}>
                                            {lead.orderStatus || 'Open'}
                                        </span>
                                    </td>

                                    <td className="st-truncate-cell" title={lead.requirement}>
                                        {lead.requirement || '-'}
                                    </td>

                                    <td>
                                        <span className={`st-priority-badge ${lead.priority?.toLowerCase()}`}>
                                            {lead.priority}
                                        </span>
                                    </td>
                                    <td style={{fontWeight:'bold', color: lead.closing === 'Yes' ? 'green' : 'red'}}>
                                        {lead.closing}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>

      </div>
    </div>
  );
};

export default ServiceType;
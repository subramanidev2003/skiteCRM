import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './ServiceType.css';

const ServiceType = () => {
  const { serviceName } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('salesUser');
    if (!storedUser) {
      navigate('/');
      return;
    }

    // ✅ FIX: Use the same API as the Dashboard to ensure counts match
    fetch(`https://skitecrm.onrender.com/api/leads/common/all`) 
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          // 1. Filter leads by the service name from the URL
          // Decode URI component handles spaces (e.g. "Web%20Development" -> "Web Development")
          const decodedService = decodeURIComponent(serviceName);
          
          const filtered = data.filter(lead => 
            lead.serviceType === decodedService || 
            lead.serviceType === serviceName
          );

          // 2. Sort Logic: High -> Medium -> Low
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          
          filtered.sort((a, b) => {
            const pA = priorityOrder[a.priority] || 0;
            const pB = priorityOrder[b.priority] || 0;
            return pB - pA; 
          });

          setLeads(filtered);
        }
      })
      .catch(err => console.error("Error loading leads", err));
      
  }, [navigate, serviceName]);

  return (
    <div className="st-page-container">
      <div className="st-page-content">
        
        {/* HEADER */}
        <div className="st-page-header">
            <button className="st-btn-back" onClick={() => navigate('/sales-dashboard')}>
                <ArrowLeft size={20} /> Back to Dashboard
            </button>
            <h2 className="st-page-title">{decodeURIComponent(serviceName)} Leads</h2>
        </div>

        {/* TABLE */}
        <div className="st-table-wrapper">
            <table className="st-leads-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Company Name</th>
                        <th>Priority</th>
                        <th>Closing</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="st-no-data">No leads found for {decodeURIComponent(serviceName)}.</td>
                        </tr>
                    ) : (
                        leads.map((lead) => (
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
                                    <span className={`st-priority-badge ${lead.priority?.toLowerCase()}`}>
                                        {lead.priority}
                                    </span>
                                </td>
                                <td>{lead.closing}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

      </div>
    </div>
  );
};

export default ServiceType;
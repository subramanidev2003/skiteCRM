import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './ServiceType.css';

const ServiceType = () => {
  const { serviceName } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('salesUser');
    if (!storedUser) {
      navigate('/');
      return;
    }

    // ✅ Debugging: URL-ல் வரும் பெயரைச் சரிபார்க்க
    console.log("1. URL Service Name:", serviceName);

    // ✅ Fetch ALL leads using common API
    fetch(`https://skitecrm.onrender.com/api/leads/common/all`) 
      .then(res => {
          if (!res.ok) {
              throw new Error(`API Error: ${res.status}`);
          }
          return res.json();
      })
      .then(data => {
        console.log("2. Total Leads from API:", data.length); // API-ல் டேட்டா வருகிறதா?

        if (Array.isArray(data)) {
          
          // ✅ URL பெயரைச் சுத்தம் செய்தல் (Small letters + Trim)
          const targetService = decodeURIComponent(serviceName).trim().toLowerCase();
          console.log("3. Target Service (Cleaned):", targetService);

          const filtered = data.filter(lead => {
              // ✅ Database பெயரைச் சுத்தம் செய்தல்
              const dbService = lead.serviceType ? lead.serviceType.trim().toLowerCase() : '';
              
              // Debugging: இது பொருந்தாத லீட்ஸை ஏன் நிராகரிக்கிறது எனப் பார்க்க
              // if (dbService.includes('paid')) console.log(`Checking: ${dbService} === ${targetService}`);

              return dbService === targetService;
          });

          console.log("4. Filtered Leads Count:", filtered.length); // ஃபில்டர் ஆன பிறகு எத்தனை?

          // Sort by Priority
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          filtered.sort((a, b) => {
            const pA = priorityOrder[a.priority] || 0;
            const pB = priorityOrder[b.priority] || 0;
            return pB - pA; 
          });

          setLeads(filtered);
        }
      })
      .catch(err => {
          console.error("Error loading leads:", err);
      })
      .finally(() => setLoading(false));
      
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
            {loading ? (
                <div style={{padding:'20px', textAlign:'center', color:'#666'}}>Loading...</div>
            ) : (
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
                                <td colSpan="6" className="st-no-data">
                                    No leads found for "{decodeURIComponent(serviceName)}".
                                    <br/>
                                    <small style={{color:'#999'}}>(Check Console F12 for details)</small>
                                </td>
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
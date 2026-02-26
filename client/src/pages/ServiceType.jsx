import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Search, Calendar, Phone } from 'lucide-react'; 
import './ServiceType.css';

const ServiceType = () => {
  const { serviceName } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // ✅ All Filter States
  const [globalSearch, setGlobalSearch] = useState(''); // Name filter changed to Global Search
  const [dateFilter, setDateFilter] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('All');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  useEffect(() => {
    const storedUser = localStorage.getItem('salesUser');
    if (!storedUser) {
      navigate('/');
      return;
    }

    // Fetch ALL leads using common API
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
          setFilteredLeads(filtered); 
        }
      })
      .catch(err => {
          console.error("Error loading leads:", err);
      })
      .finally(() => setLoading(false));
      
  }, [navigate, serviceName]);

  // ✅ Handle Multiple Filters Change
  useEffect(() => {
    let result = leads;

    // 1. Global Search Filter (Search anything)
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
        result = result.filter(lead => lead.date === dateFilter);
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

    setFilteredLeads(result);
  }, [globalSearch, dateFilter, callStatusFilter, orderStatusFilter, leads]);

  return (
    <div className="st-page-container">
      <div className="st-page-content">
        
        {/* HEADER */}
        <div className="st-page-header" style={{ marginBottom: '15px' }}>
            <div>
                <button className="st-btn-back" onClick={() => navigate('/sales-dashboard')}>
                    <ArrowLeft size={20} /> Back
                </button>
            </div>
            <h2 className="st-page-title">{decodeURIComponent(serviceName)} Leads</h2>
            <div style={{width: '100px'}}></div> {/* Spacer for balance */}
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
                            <th>Order Status</th> 
                            <th>Follow Up 1</th>
                            <th>Follow Up 2</th>
                            <th>Responsibility</th>
                            <th>Priority</th>
                            <th>Closing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.length === 0 ? (
                            <tr>
                                <td colSpan="11" className="st-no-data" style={{textAlign: 'center', padding: '30px', color: '#6b7280'}}>
                                    No leads found matching your filters.
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

                                    <td>
                                        <span className={`st-status-badge ${lead.orderStatus?.toLowerCase() || 'open'}`}>
                                            {lead.orderStatus || 'Open'}
                                        </span>
                                    </td>

                                    <td className="st-truncate-cell" title={lead.requirement}>
                                        {lead.requirement || '-'}
                                    </td>

                                    <td className="st-truncate-cell" title={lead.remainder2}>
                                        {lead.remainder2 || '-'}
                                    </td>

                                    <td style={{fontWeight: '500', color: '#4f46e5'}}>
                                        {lead.followUpResponsibility || '-'}
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
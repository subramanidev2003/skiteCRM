import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import {
  Target,
  Users,
  TrendingUp,
  Plus,
  X,
  ArrowLeft,
  Bell,
  History
} from "lucide-react";
import { API_BASE } from '../api';
import "./AdminSalesDashboard.css"; 
import { toast } from "react-toastify";

const AdminSalesDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const TARGET_GOAL = 50; 

  // ✅ NEW STATES FOR REMAINDERS
  const [todayCount, setTodayCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  const serviceOptions = [
    "Web Development", "SEO", "Paid Campaigns", "Personal Branding", "Full Digital Marketing"
  ];

  const [formData, setFormData] = useState({
    date: "", name: "", email: "",
    companyName: "", phoneNumber: "", 
    serviceType: "Web Development", business: "", location: "",
    assignedTo: "" 
  });

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

  useEffect(() => {
    const storedAdmin = 
      localStorage.getItem("adminUser") || 
      localStorage.getItem("managerUser") ||
      localStorage.getItem("userData");

    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      fetch(`${API_BASE}/leads/admin/all`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const validLeads = Array.isArray(data) ? data : [];
          setLeads(validLeads);
          calculateStats(validLeads);
          
          // ✅ LOGIC FOR REMAINDER BADGES
          const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
          
          const todayReminders = validLeads.filter(l => 
              l.remainder2Date === todayStr && l.remainder2Status !== 'Completed'
          ).length;
          setTodayCount(todayReminders);

          const missedReminders = validLeads.filter(l => 
              l.remainder2Date && l.remainder2Date < todayStr && l.remainder2Status !== 'Completed'
          ).length;
          setOverdueCount(missedReminders);
        });
    } else {
      navigate("/");
    }
  }, [navigate]);

  const calculateStats = (currentLeads) => {
    if (currentLeads.length === 0) {
      setClosedCount(0);
      setConversionRate(0);
      return;
    }
    const closed = currentLeads.filter(l => l.closing === "Yes").length;
    setClosedCount(closed);
    const rate = (closed / currentLeads.length) * 100;
    setConversionRate(rate.toFixed(0));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalAgentId = formData.assignedTo || admin?._id || admin?.id;
    if (!finalAgentId) {
      toast.error("Error: No Agent assigned.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/leads/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, salesAgentId: finalAgentId }),
      });
      const data = await response.json();
      if (response.ok) {
        const newLeads = [data.lead, ...leads];
        setLeads(newLeads);
        calculateStats(newLeads);
        setIsModalOpen(false);
        setFormData({
          date: "", name: "", email: "",
          companyName: "", phoneNumber: "", 
          serviceType: "Web Development", business: "", location: "",
          assignedTo: "" 
        });
        toast.success("Lead Added!");
      } else {
        toast.error(data.message || "Failed to add lead");
      }
    } catch (error) {
      toast.error("Server Error");
    }
  };

  const getCount = (service) => leads.filter((l) => l.serviceType === service).length;

  return (
    <div className="dashboard-container1">
      <div className="dashboard-content">

        <button className="back-btn" onClick={handleBack} style={{marginBottom: '20px'}}>
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon target"><Target size={24} /></div>
            <div className="stat-info">
              <h3>Company Targets</h3>
              <p className="stat-number">{closedCount} / {TARGET_GOAL}</p>
            </div>
          </div>
          <div className="stat-card" onClick={() => navigate('/admin-dashboard/all-leads')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon leads"><Users size={24} /></div>
            <div className="stat-info">
              <h3>Total Company Leads</h3>
              <p className="stat-number">{leads.length}</p>
            </div>
          </div>
          <div className="stat-card" onClick={() => navigate('/admin-dashboard/conversion')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon performance"><TrendingUp size={24} /></div>
            <div className="stat-info">
              <h3>Total Conversion</h3>
              <p className="stat-number">{conversionRate}%</p>
            </div>
          </div>
        </div>

        {/* ✅ NEW: REMAINDER CARDS SECTION */}
        <div className="leads-section-header" style={{marginTop:'30px'}}>
          <h2 className="section-title">FOLLOW-UP ACTIONS</h2>
        </div>

        <div className="stats-grid">
          <div className="stat-card" onClick={() => navigate('/admin-dashboard/followups/today')} style={{ cursor: 'pointer', border: todayCount > 0 ? '2px solid #ef4444' : 'none' }}>
            <div className="stat-icon target"><Bell size={24} /></div>
            <div className="stat-info">
              <h3>Main Remainder</h3>
              <p className="stat-number" style={{color: todayCount > 0 ? '#ef4444' : 'inherit'}}>{todayCount}</p>
            </div>
            {todayCount > 0 && <span className="notification-badge" style={{background:'#ef4444', color:'white', padding:'2px 8px', borderRadius:'10px', fontSize:'12px', position:'absolute', top:'10px', right:'10px'}}>Today</span>}
          </div>

          <div className="stat-card" onClick={() => navigate('/admin-dashboard/followups/pending')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon performance"><History size={24} /></div>
            <div className="stat-info">
              <h3>Overview (Pending)</h3>
              <p className="stat-number">{overdueCount}</p>
            </div>
            {overdueCount > 0 && <span className="notification-badge" style={{background:'#f59e0b', color:'white', padding:'2px 8px', borderRadius:'10px', fontSize:'12px', position:'absolute', top:'10px', right:'10px'}}>Missed</span>}
          </div>
        </div>

        <div className="leads-section-header" style={{marginTop:'30px'}}>
          <h2 className="section-title">ALL LEADS OVERVIEW</h2>
          <button className="add-lead-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add New Lead
          </button>
        </div>

        <div className="service-card-grid">
          {serviceOptions.map((service) => (
            <div key={service} className="service-card" onClick={() => navigate(`/admin-dashboard/service/${service}`)}>
              <span className="service-name">{service}</span>
              {getCount(service) > 0 && <span className="service-count">{getCount(service)}</span>}
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Lead (Admin)</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="lead-form">
              <div className="form-grid">
                <div className="form-group"><label>Date</label><input type="date" name="date" required value={formData.date} onChange={handleChange} /></div>
                <div className="form-group"><label>Client Name</label><input type="text" name="name" required placeholder="Client Name" value={formData.name} onChange={handleChange} /></div>
                <div className="form-group"><label>Email</label><input type="email" name="email" placeholder="Client Email (Optional)" value={formData.email} onChange={handleChange} /></div>
                <div className="form-group"><label>Phone Number</label><input type="tel" name="phoneNumber" required placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} /></div>
                <div className="form-group"><label>Company Name</label><input type="text" name="companyName" placeholder="Company Name" value={formData.companyName} onChange={handleChange} /></div>
                <div className="form-group">
                  <label>Service Type</label>
                  <select name="serviceType" value={formData.serviceType} onChange={handleChange}>
                    {serviceOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
                  </select>
                </div>
                <div className="form-group"><label>Business Type</label><input type="text" name="business" placeholder="Business Type" value={formData.business} onChange={handleChange} /></div>
                <div className="form-group"><label>Location</label><input type="text" name="location" placeholder="City / Location" value={formData.location} onChange={handleChange} /></div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSalesDashboard;
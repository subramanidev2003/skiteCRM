import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Users,
  TrendingUp,
  Plus,
  X,
  ArrowLeft,
} from "lucide-react";
import "./AdminSalesDashboard.css"; 
import { toast } from "react-toastify";

const AdminSalesDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  
  // State to store list of Sales Agents (Optional if needed later)
  const [agents, setAgents] = useState([]);

  // --- STATS STATE ---
  const [conversionRate, setConversionRate] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const TARGET_GOAL = 50; 

  const serviceOptions = [
    "Web Development", "SEO", "Paid Campaigns", "Personal Branding", "Full Digital Marketing"
  ];

  // ✅ ADDED: 'email' field to form data
  const [formData, setFormData] = useState({
    date: "", 
    name: "", 
    email: "", // ✨ New Email Field
    companyName: "", 
    phoneNumber: "", 
    serviceType: "Web Development", 
    business: "", 
    location: "",
    assignedTo: "" 
  });

  // 1. LOAD DATA
  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminUser");
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      
      fetch("https://skitecrm-1l7f.onrender.com/api/leads/admin/all")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const validLeads = Array.isArray(data) ? data : [];
          setLeads(validLeads);
          calculateStats(validLeads);
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
      const response = await fetch("https://skitecrm-1l7f.onrender.com/api/leads/add", {
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
        // ✅ RESET FORM including Email
        setFormData({
            date: "", name: "", email: "", // Reset Email
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
        <button className="back-btn" onClick={() => navigate('/admin-dashboard')} style={{marginBottom: '20px'}}>
            <ArrowLeft size={20} /> Back to Admin Home
        </button>

        {/* Stats & Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon target"><Target size={24} /></div>
            <div className="stat-info"><h3>Company Targets</h3><p className="stat-number">{closedCount} / {TARGET_GOAL}</p></div>
          </div>
          <div 
            className="stat-card"
            onClick={() => navigate('/admin-dashboard/all-leads')} 
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon leads"><Users size={24} /></div>
            <div className="stat-info">
                <h3>Total Company Leads</h3>
                <p className="stat-number">{leads.length}</p>
            </div>
          </div>
          <div 
            className="stat-card" 
            onClick={() => navigate('/admin-dashboard/conversion')}
            style={{ cursor: 'pointer' }} 
          >
            <div className="stat-icon performance"><TrendingUp size={24} /></div>
            <div className="stat-info">
                <h3>Total Conversion</h3>
                <p className="stat-number">{conversionRate}%</p>
            </div>
          </div>
        </div>

        <div className="leads-section-header">
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

      {/* ✅ MODAL FORM WITH EMAIL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Lead (Admin)</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="lead-form">
              <div className="form-grid">
                
                {/* 1. DATE */}
                <div className="form-group">
                    <label>Date</label>
                    <input type="date" name="date" required value={formData.date} onChange={handleChange} />
                </div>
                
                {/* 2. CLIENT NAME */}
                <div className="form-group">
                    <label>Client Name</label>
                    <input type="text" name="name" required placeholder="Client Name" value={formData.name} onChange={handleChange} />
                </div>

                {/* 3. EMAIL (✅ NEW FIELD) */}
                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        name="email" 
                        placeholder="Client Email (Optional)" 
                        value={formData.email} 
                        onChange={handleChange} 
                    />
                </div>

                {/* 4. PHONE NUMBER */}
                <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" name="phoneNumber" required placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} />
                </div>

                {/* 5. COMPANY NAME */}
                <div className="form-group">
                    <label>Company Name</label>
                    <input type="text" name="companyName" placeholder="Company Name" value={formData.companyName} onChange={handleChange} />
                </div>

                {/* 6. SERVICE TYPE */}
                <div className="form-group">
                    <label>Service Type</label>
                    <select name="serviceType" value={formData.serviceType} onChange={handleChange}>
                        {serviceOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
                    </select>
                </div>

                {/* 7. BUSINESS TYPE */}
                <div className="form-group">
                    <label>Business Type</label>
                    <input type="text" name="business" placeholder="Business Type" value={formData.business} onChange={handleChange} />
                </div>

                {/* 8. LOCATION */}
                <div className="form-group">
                    <label>Location</label>
                    <input type="text" name="location" placeholder="City / Location" value={formData.location} onChange={handleChange} />
                </div>

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
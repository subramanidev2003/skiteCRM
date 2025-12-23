import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, Target, Users, TrendingUp, Plus, X, 
  Clock, ArrowDown, ArrowUp, CalendarDays, MapPin 
} from "lucide-react";
import "./SalesDashboard.css"; // ✅ Uses the new CSS below
import { toast } from "react-toastify";

// --- CONFIGURATION ---
const API_BASE = 'http://localhost:4000/api';
const ATTENDANCE_URL = `${API_BASE}/attendance`;

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leads, setLeads] = useState([]);

  // --- ATTENDANCE STATE ---
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastSession, setLastSession] = useState({ checkInTime: null, checkOutTime: null });

  // --- STATS STATE ---
  const [conversionRate, setConversionRate] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const TARGET_GOAL = 10;

  const serviceOptions = [
    "Web Development", "SEO", "Paid Campaigns", "Personal Branding", "Full Digital Marketing",
  ];

  const [formData, setFormData] = useState({
    date: "", name: "", companyName: "", phoneNumber: "", 
    serviceType: "Web Development", business: "", location: "",
  });

  // 1. CLOCK & INIT
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. DATA LOADING
  useEffect(() => {
    const storedUser = localStorage.getItem("salesUser");
    const token = localStorage.getItem("salesToken");

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const userId = parsedUser._id || parsedUser.id;

      if (userId) {
        // Fetch Leads
        fetch(`http://localhost:4000/api/leads/common/all`)
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => {
            const validLeads = Array.isArray(data) ? data : [];
            setLeads(validLeads);
            calculateStats(validLeads);
          })
          .catch(() => setLeads([]));

        // Check Attendance
        checkActiveSession(userId, token);
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  // --- ATTENDANCE LOGIC ---
  const checkActiveSession = async (userId, token) => {
    try {
      const response = await fetch(`${ATTENDANCE_URL}/status/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.isCheckedIn) {
          setIsCheckedIn(true);
          setStartTime(new Date(data.checkInTime));
        }
      } else {
        // Fallback to local storage
        const saved = JSON.parse(localStorage.getItem('activeSalesSession'));
        if (saved && saved.userId === userId) {
          setIsCheckedIn(true);
          setStartTime(new Date(saved.startTime));
        }
      }
    } catch (error) { console.error("Session check error", error); }
  };

  const handleCheckIn = async () => {
    const userId = user?._id || user?.id;
    const token = localStorage.getItem("salesToken");
    if (!userId) return;

    setAttendanceLoading(true);
    try {
      const res = await fetch(`${ATTENDANCE_URL}/checkin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();

      if (!res.ok) {
        if(data.msg && data.msg.includes("already")) {
           setIsCheckedIn(true); setStartTime(new Date()); return;
        }
        toast.error(data.msg || "Check-in failed"); return;
      }

      const start = new Date(data.checkInTime);
      setIsCheckedIn(true); setStartTime(start);
      localStorage.setItem('activeSalesSession', JSON.stringify({ userId, startTime: start }));
      toast.success(`Checked In at ${start.toLocaleTimeString()}`);
    } catch (e) { toast.error("Network Error"); } 
    finally { setAttendanceLoading(false); }
  };

  const handleCheckOut = async () => {
    const userId = user?._id || user?.id;
    const token = localStorage.getItem("salesToken");
    if (!taskDescription.trim()) return toast.warning("Please add a checkout note.");

    setAttendanceLoading(true);
    try {
      const res = await fetch(`${ATTENDANCE_URL}/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, taskDescription })
      });

      if (!res.ok) return toast.error("Check-out failed");

      const outTime = new Date();
      setLastSession({ checkInTime: startTime, checkOutTime: outTime });
      setIsCheckedIn(false); setStartTime(null); setTaskDescription('');
      localStorage.removeItem('activeSalesSession');
      toast.success("Checked Out Successfully");
    } catch (e) { toast.error("Network Error"); } 
    finally { setAttendanceLoading(false); }
  };

  // --- HELPER FUNCTIONS ---
  const calculateStats = (currentLeads) => {
    if (currentLeads.length === 0) { setClosedCount(0); setConversionRate(0); return; }
    const closed = currentLeads.filter((l) => l.closing === "Yes").length;
    setClosedCount(closed);
    setConversionRate(((closed / currentLeads.length) * 100).toFixed(0));
  };

  const handleLogout = () => {
    localStorage.removeItem("salesToken");
    localStorage.removeItem("salesUser");
    localStorage.removeItem("activeSalesSession");
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const agentId = user?._id || user?.id;
    try {
      const res = await fetch("http://localhost:4000/api/leads/add", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, salesAgentId: agentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLeads([data.lead, ...leads]);
        calculateStats([data.lead, ...leads]);
        setIsModalOpen(false);
        setFormData({ date: "", name: "", companyName: "", phoneNumber: "", serviceType: "Web Development", business: "", location: "" });
        toast.success("Lead Saved!");
      } else { toast.error(data.message); }
    } catch (error) { toast.error("Server Error"); }
  };

  const calculateDuration = (start) => {
    if (!start) return { h: 0, m: 0 };
    const diff = new Date() - new Date(start);
    return { h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000) };
  };

  const getCount = (service) => leads.filter((l) => l.serviceType === service).length;

  return (
    <div className="dashboard-layout">

      <main className="main-content">
        
        {/* 2. ATTENDANCE & WELCOME SECTION */}
        <section className="hero-section">
            <div className="welcome-card">
                <h1>Hello, {user?.name}! 👋</h1>
                <p>Here's what's happening with your leads today.</p>
                <div className="date-badge">
                    <CalendarDays size={16} /> {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className={`attendance-card ${isCheckedIn ? 'active-session' : ''}`}>
                <div className="att-info">
                    <div className="clock-large">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="session-status">
                        {isCheckedIn ? (
                            <span className="status-live">● Live Session: {calculateDuration(startTime).h}h {calculateDuration(startTime).m}m</span>
                        ) : (
                            <span className="status-offline">● Currently Offline</span>
                        )}
                    </div>
                </div>
                
                <div className="att-controls">
                    {isCheckedIn ? (
                        <>
                            <input 
                                type="text" 
                                className="checkout-input" 
                                placeholder="Checkout Note (e.g. Done with calls)" 
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                            />
                            <button className="btn-action btn-out" onClick={handleCheckOut} disabled={attendanceLoading}>
                                {attendanceLoading ? '...' : <><LogOut size={18}/> Check Out</>}
                            </button>
                        </>
                    ) : (
                        <button className="btn-action btn-in" onClick={handleCheckIn} disabled={attendanceLoading}>
                             {attendanceLoading ? '...' : <><Clock size={18}/> Check In</>}
                        </button>
                    )}
                </div>
            </div>
        </section>

        {/* 3. STATS OVERVIEW */}
        <section className="stats-container">
            <div className="stat-box">
                <div className="stat-icon-wrapper blue"><Target size={24}/></div>
                <div className="stat-text">
                    <span className="label">My Target</span>
                    <span className="value">{closedCount} <span className="sub">/ {TARGET_GOAL}</span></span>
                </div>
            </div>
            
            <div className="stat-box clickable" onClick={() => navigate('/sales-dashboard/all-leads')}>
                <div className="stat-icon-wrapper orange"><Users size={24}/></div>
                <div className="stat-text">
                    <span className="label">Total Leads</span>
                    <span className="value">{leads.length}</span>
                </div>
            </div>

            <div className="stat-box clickable" onClick={() => navigate('/sales-dashboard/conversion')}>
                <div className="stat-icon-wrapper green"><TrendingUp size={24}/></div>
                <div className="stat-text">
                    <span className="label">Conversion Rate</span>
                    <span className="value">{conversionRate}%</span>
                </div>
            </div>
        </section>

        {/* 4. LEADS & SERVICES */}
        <section className="leads-area">
            <div className="area-header">
                <h3>Leads by Category</h3>
                <button className="btn-add-lead" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} /> New Lead
                </button>
            </div>

            <div className="services-grid">
                {serviceOptions.map(service => (
                    <div key={service} className="service-tile" onClick={() => navigate(`/sales/service/${service}`)}>
                        <span className="tile-name">{service}</span>
                        {getCount(service) > 0 && <span className="tile-count">{getCount(service)}</span>}
                    </div>
                ))}
            </div>
        </section>

      </main>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-top">
              <h3>Add New Lead</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-grid">
                <div className="inp-group"><label>Date</label><input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
                <div className="inp-group"><label>Client Name</label><input type="text" placeholder="Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div className="inp-group"><label>Company</label><input type="text" placeholder="Company Name" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} /></div>
                <div className="inp-group"><label>Phone</label><input type="tel" placeholder="Phone" required value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} /></div>
                <div className="inp-group"><label>Service</label><select value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value})}>{serviceOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                <div className="inp-group"><label>Business Type</label><input type="text" placeholder="Type" value={formData.business} onChange={(e) => setFormData({...formData, business: e.target.value})} /></div>
                <div className="inp-group full"><label>Location</label><input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-text" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary-fill">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
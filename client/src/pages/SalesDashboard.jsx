import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, Target, Users, TrendingUp, Plus, X, 
  Clock, CalendarDays, ListTodo, CheckCircle2, AlertCircle, ScrollText, Upload, CalendarOff 
} from "lucide-react"; 
import "./SalesDashboard.css"; 
import { toast } from "react-toastify";
import { API_BASE } from '../api';
import * as XLSX from 'xlsx'; 

const ATTENDANCE_URL = `${API_BASE}/attendance`;
const TASKS_URL = `${API_BASE}/tasks`; 
const LEAVE_URL = `${API_BASE}/leaves`; // ✅ Added LEAVE_URL

const SalesDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leads, setLeads] = useState([]);

  // --- TASK STATE ---
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // --- ATTENDANCE STATE ---
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- STATS STATE ---
  const [conversionRate, setConversionRate] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const TARGET_GOAL = 10;

  // --- LEAVE MODAL STATE (NEW) ---
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveData, setLeaveData] = useState({ fromDate: '', toDate: '', reason: '' });
  const [leaveLoading, setLeaveLoading] = useState(false); // separate loading for leave

  const serviceOptions = [
    "Web Development", "SEO", "Paid Campaigns", "Personal Branding", "Full Digital Marketing",
  ];

  const [formData, setFormData] = useState({
    date: "", name: "", email: "", companyName: "", phoneNumber: "", 
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
        fetch(`${API_BASE}/leads/common/all`) 
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => {
            const validLeads = Array.isArray(data) ? data : [];
            setLeads(validLeads);
            calculateStats(validLeads);
          })
          .catch(() => setLeads([]));

        checkActiveSession(userId, token);
        fetchTasks(userId, token);
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  // --- TASK FUNCTIONS ---
  const fetchTasks = async (userId, token) => {
    try {
      const response = await fetch(`${TASKS_URL}/${userId}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (error) { 
      console.error("Error fetching tasks:", error); 
    } finally { 
      setTaskLoading(false); 
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const token = localStorage.getItem("salesToken");
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await fetch(`${TASKS_URL}/${taskId}/status`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) { 
        fetchTasks(user._id, token); 
        toast.error("Failed to update status"); 
    }
  };

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

      setIsCheckedIn(false); setStartTime(null); setTaskDescription('');
      toast.success("Checked Out Successfully");
    } catch (e) { toast.error("Network Error"); } 
    finally { setAttendanceLoading(false); }
  };

  // --- LEAVE SUBMISSION (NEW) ---
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveData.fromDate || !leaveData.toDate || !leaveData.reason) {
        toast.error("Please fill all fields");
        return;
    }
    
    const userId = user?._id || user?.id;
    const token = localStorage.getItem("salesToken");

    setLeaveLoading(true);
    try {
        const res = await fetch(`${LEAVE_URL}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            // Name and Role attached for admin reference
            body: JSON.stringify({ 
                ...leaveData, 
                userId: userId, 
                name: user?.name || "Sales Agent", 
                designation: "Sales" 
            })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            toast.success("Leave Request Sent Successfully!");
            setIsLeaveModalOpen(false);
            setLeaveData({ fromDate: '', toDate: '', reason: '' });
        } else {
            toast.error(data.message || "Failed to send request");
        }
    } catch (error) {
        toast.error("Network Error while submitting leave");
    } finally {
        setLeaveLoading(false);
    }
  };

  // --- HELPER FUNCTIONS ---
  const calculateStats = (currentLeads) => {
    if (currentLeads.length === 0) { setClosedCount(0); setConversionRate(0); return; }
    const closed = currentLeads.filter((l) => l.closing === "Yes").length;
    setClosedCount(closed);
    setConversionRate(((closed / currentLeads.length) * 100).toFixed(0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let agentId = user?._id || user?.id || user?.data?._id || user?.data?.id;
        
    if (!agentId) {
        try {
            const lsUser = JSON.parse(localStorage.getItem("salesUser") || localStorage.getItem("user") || "{}");
            agentId = lsUser._id || lsUser.id || lsUser.data?._id || lsUser.data?.id;
        } catch (e) {
            console.error("Localstorage parse error", e);
        }
    }

    if (!agentId) {
        toast.error("User ID not found! Please check console.");
        return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/leads/add`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, salesAgentId: agentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLeads([data.lead, ...leads]);
        calculateStats([data.lead, ...leads]);
        setIsModalOpen(false);
        setFormData({ date: "", name: "", email: "", companyName: "", phoneNumber: "", serviceType: "Web Development", business: "", location: "" });
        toast.success("Lead Saved!");
      } else { toast.error(data.message); }
    } catch (error) { toast.error("Server Error"); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

        if (rawData.length < 2) return toast.warning("Excel sheet is empty or invalid!");

        let headerRowIndex = -1;
        for (let i = 0; i < rawData.length; i++) {
          const rowStr = rawData[i].map(String).join("").toLowerCase();
          if (rowStr.includes("name") || rowStr.includes("phone")) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) return toast.error("Excel-ல் 'NAME' அல்லது 'PHONE' என்ற தலைப்பு இல்லை!");

        const headers = rawData[headerRowIndex].map(h => String(h || "").toLowerCase().replace(/[^a-z0-9]/g, '').trim());

        const getAgentId = () => {
            if (user?._id) return user._id;
            if (user?.id) return user.id;
            const keys = ["salesUser", "adminUser", "userData", "employeeUser", "managerUser", "user"];
            for (let key of keys) {
                let item = localStorage.getItem(key);
                if (item) {
                    try {
                        let parsed = JSON.parse(item);
                        let id = parsed._id || parsed.id || parsed.data?._id || parsed.data?.id || parsed.user?._id;
                        if (id) return id;
                    } catch (e) { }
                }
            }
            return null;
        };

        const agentId = getAgentId();
        if (!agentId) return toast.error("User ID not found! Please login again.");

        const formattedLeads = [];
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0 || row.every(cell => cell === null || cell === "")) continue;

          const rowData = {};
          headers.forEach((header, index) => { rowData[header] = row[index]; });

          const parseExcelDate = (excelDate) => {
            let parsedDate = new Date();
            if (excelDate && !isNaN(excelDate)) {
                parsedDate = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
            } else if (typeof excelDate === 'string' && excelDate.includes('/')) {
                const parts = excelDate.split('/');
                if (parts.length === 3) parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
            if (isNaN(parsedDate.getTime())) parsedDate = new Date(); 
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const day = String(parsedDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`; 
          };

          const name = rowData['name'] || rowData['clientname'] || 'Unknown';
          const phoneStr = String(rowData['phone'] || rowData['phonenumber'] || rowData['mobile'] || '').trim();

          if (name === 'Unknown' && phoneStr === '') continue; 

          let rawService = String(rowData['service'] || rowData['servicetype'] || '').trim();
          let finalService = 'Web Development';
          if (rawService.toLowerCase().includes('website') || rawService.toLowerCase().includes('web')) finalService = 'Web Development';
          else if (rawService.toLowerCase().includes('ads') || rawService.toLowerCase().includes('paid')) finalService = 'Paid Campaigns';
          else if (rawService.toLowerCase().includes('seo')) finalService = 'SEO';
          else if (rawService.toLowerCase().includes('branding')) finalService = 'Personal Branding';
          else if (rawService) finalService = rawService; 

          formattedLeads.push({
            date: parseExcelDate(rowData['date']), 
            name: name,
            email: rowData['email'] || rowData['emailid'] || '',
            companyName: rowData['company'] || rowData['companyname'] || '',
            phoneNumber: phoneStr,
            serviceType: finalService, 
            business: rowData['business'] || rowData['businesstype'] || '',
            location: rowData['location'] || '',
            salesAgentId: agentId 
          });
        }

        if (formattedLeads.length === 0) return toast.error("No valid data found in the rows."); 

        sendLeadsToBackend(formattedLeads, agentId);
      } catch (err) { toast.error("Error reading Excel file. Check format."); }
    };
    reader.readAsBinaryString(file);
  };

  const sendLeadsToBackend = async (importedLeads, agentId) => {
    toast.info("Importing leads, please wait..."); 
    try {
        const res = await fetch(`${API_BASE}/leads/import`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leads: importedLeads, salesAgentId: agentId }),
        });
        const responseData = await res.json();
        if (res.ok) {
            toast.success(`Success! ${responseData.count} leads imported.`);
            const refreshRes = await fetch(`${API_BASE}/leads/common/all`);
            if(refreshRes.ok) {
                const refreshedLeads = await refreshRes.json();
                setLeads(refreshedLeads);
                calculateStats(refreshedLeads);
            }
        } else { toast.error(responseData.message || "Import failed on server"); }
    } catch (error) { toast.error("Error importing leads to server"); } 
    finally { if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const calculateDuration = (start) => {
    if (!start) return { h: 0, m: 0 };
    const diff = new Date() - new Date(start);
    return { h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000) };
  };

  const getCount = (service) => {
    const target = service.toLowerCase().trim();
    return leads.filter((l) => {
      const dbService = (l.serviceType || "").toLowerCase().trim();
      if (dbService === target) return true;
      if (dbService.includes(target) || target.includes(dbService)) return true;
      if (target.includes("paid") && dbService.includes("paid")) return true;
      return false;
    }).length;
  };
  
  const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="dashboard-layout">
      <main className="main-content">
        
        {/* HERO SECTION */}
        <section className="hero-section">
            <div className="welcome-card">
                <h1>Hello, {user?.name}! 👋</h1>
                <p>Track leads and manage your daily tasks.</p>
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
                
                {/* ATTENDANCE CONTROLS */}
                <div className="att-controls" style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        {isCheckedIn ? (
                            <>
                                <input 
                                    type="text" 
                                    className="checkout-input" 
                                    placeholder="Checkout Note..." 
                                    value={taskDescription}
                                    onChange={(e) => setTaskDescription(e.target.value)}
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                                />
                                <button className="btn-action btn-out" onClick={handleCheckOut} disabled={attendanceLoading}>
                                    {attendanceLoading ? '...' : <><LogOut size={18}/> Check Out</>}
                                </button>
                            </>
                        ) : (
                            <button className="btn-action btn-in" onClick={handleCheckIn} disabled={attendanceLoading} style={{width: '100%'}}>
                                 {attendanceLoading ? '...' : <><Clock size={18}/> Check In</>}
                            </button>
                        )}
                    </div>

                    {/* ✅ Leave Request Button (Opens Modal) */}
                    <button 
                        onClick={() => setIsLeaveModalOpen(true)} 
                        style={{
                            background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', 
                            padding: '10px', borderRadius: '8px', cursor: 'pointer', 
                            fontWeight: '600', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', gap: '8px', width: '100%', transition: 'all 0.3s'
                        }}
                    >
                        <CalendarOff size={18}/> Leave Request
                    </button>
                </div>
            </div>
        </section>

        {/* SPLIT LAYOUT */}
        <div className="dashboard-split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', marginTop: '20px' }}>
            
            {/* LEFT COLUMN: STATS & LEADS */}
            <div className="left-column">
                <section className="stats-container" style={{marginBottom: '20px'}}>
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
                            <span className="label">Conversion</span>
                            <span className="value">{conversionRate}%</span>
                        </div>
                    </div>

                    <div className="stat-box clickable" onClick={() => navigate('/sales-dashboard/quote')}>
                        <div className="stat-icon-wrapper" style={{background:'#f3e8ff', color:'#9333ea'}}>
                            <ScrollText size={24}/>
                        </div>
                        <div className="stat-text">
                            <span className="label">Quotes</span>
                            <span className="value" style={{fontSize:'1rem'}}>Create</span>
                        </div>
                    </div>

                    <div className="stat-box clickable" onClick={() => navigate('/sales-dashboard/receipt')}>
                      <div className="stat-icon-wrapper" style={{background:'#fff0e6', color:'#FF4500'}}>
                        <ScrollText size={24}/>
                      </div>
                      <div className="stat-text">
                        <span className="label">Receipt</span>
                        <span className="value" style={{fontSize:'1rem'}}>Create</span>
                      </div>
                    </div>
                </section>

                <section className="leads-area">
                    <div className="area-header">
                        <h3>Leads by Category</h3>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button 
                                className="btn-add-lead" 
                                style={{background: '#10b981', border: '1px solid #059669', display: 'flex', alignItems: 'center', gap: '5px'}}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <Upload size={18} /> Import Lead
                            </button>
                            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileUpload} />
                            <button className="btn-add-lead" onClick={() => setIsModalOpen(true)}>
                                <Plus size={18} /> New Lead
                            </button>
                        </div>
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
            </div>

            {/* RIGHT COLUMN: TASKS */}
            <div className="right-column task-sidebar" style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e0e0e0', height: 'fit-content' }}>
                <div className="section-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                    <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'8px', fontSize:'1.1rem'}}>
                        <ListTodo className="icon-orange" size={20} color="#ff7f50"/> My Tasks ({tasks.length})
                    </h3>
                </div>

                <div className="progress-container" style={{marginBottom:'15px'}}>
                    <div className="progress-labels" style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#666', marginBottom:'5px'}}>
                        <span>Progress</span>
                        <span>{completedTasksCount}/{tasks.length} Done</span>
                    </div>
                    <div className="progress-track" style={{width:'100%', height:'6px', background:'#eee', borderRadius:'10px', overflow:'hidden'}}>
                        <div className="progress-fill" style={{width: `${tasks.length ? (completedTasksCount / tasks.length) * 100 : 0}%`, height:'100%', background:'#4caf50'}}></div>
                    </div>
                </div>

                <div className="tasks-container" style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    {taskLoading ? (
                        <p style={{textAlign:'center', color:'#888'}}>Loading Tasks...</p>
                    ) : sortedTasks.length === 0 ? (
                        <div className="empty-state" style={{textAlign:'center', padding:'20px', color:'#999'}}>
                            <AlertCircle size={30} style={{marginBottom:'10px', opacity:0.5}} />
                            <p>No tasks assigned yet.</p>
                        </div>
                    ) : (
                        sortedTasks.map((task) => {
                            let priorityColor = task.priority === 'High' ? '#ff5252' : task.priority === 'Medium' ? '#ff9800' : '#4caf50';
                            return (
                                <div key={task._id} className="task-card" 
                                    onClick={() => { setSelectedTask(task); setIsViewModalOpen(true); }}
                                    style={{ borderLeft: `4px solid ${priorityColor}`, padding: '12px', background:'#f9f9f9', borderRadius:'6px', cursor:'pointer', border: '1px solid #eee', borderLeftWidth: '4px' }}
                                >
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                                        <h4 style={{margin:0, fontSize:'0.95rem', color: task.status === 'Completed' ? '#aaa' : '#333', textDecoration: task.status === 'Completed' ? 'line-through' : 'none'}}>{task.title}</h4>
                                        <button onClick={(e) => { e.stopPropagation(); handleToggleTask(task._id, task.status); }} style={{background:'none', border:'none', cursor:'pointer'}}>
                                            {task.status === "Completed" ? <CheckCircle2 size={20} color="green" /> : <div style={{width:'18px', height:'18px', border:'2px solid #ccc', borderRadius:'50%'}}></div>}
                                        </button>
                                    </div>
                                    <p style={{fontSize:'0.8rem', color:'#666', margin:'5px 0', display:'-webkit-box', WebkitLineClamp:'2', WebkitBoxOrient:'vertical', overflow:'hidden'}}>{task.description}</p>
                                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#888', marginTop:'5px'}}>
                                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                        <span style={{color: task.status === 'Completed' ? 'green' : '#ff9800', fontWeight:'600'}}>{task.status}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

        </div>

      </main>

      {/* ✅ NEW: LEAVE REQUEST MODAL */}
      {isLeaveModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLeaveModalOpen(false)}>
            {/* Using inline style object to closely match your existing CSS classes */}
            <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{background:'white', padding:'25px', borderRadius:'12px', width:'90%', maxWidth:'450px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'}}>
                <div className="modal-top" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                    <h3 style={{margin:0, color:'#333'}}>Request Leave</h3>
                    <button onClick={() => setIsLeaveModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={20}/></button>
                </div>
                <form onSubmit={handleLeaveSubmit}>
                    <div className="modal-body">
                        <div style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                            <div style={{flex: 1}}>
                                <label style={{display:'block', marginBottom:'5px', fontSize:'0.85rem', color:'#555'}}>From Date</label>
                                <input type="date" required value={leaveData.fromDate} onChange={(e) => setLeaveData({...leaveData, fromDate: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}} />
                            </div>
                            <div style={{flex: 1}}>
                                <label style={{display:'block', marginBottom:'5px', fontSize:'0.85rem', color:'#555'}}>To Date</label>
                                <input type="date" required value={leaveData.toDate} onChange={(e) => setLeaveData({...leaveData, toDate: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}} />
                            </div>
                        </div>
                        <div style={{marginBottom:'15px'}}>
                            <label style={{display:'block', marginBottom:'5px', fontSize:'0.85rem', color:'#555'}}>Reason</label>
                            <textarea rows="3" required placeholder="Reason for leave..." value={leaveData.reason} onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc', resize:'vertical'}} />
                        </div>
                        <button type="submit" disabled={leaveLoading} style={{width:'100%', padding:'12px', background:'#FF4500', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>
                            {leaveLoading ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* OTHER EXISTING MODALS */}
      {isViewModalOpen && selectedTask && (
        <div className="modal-overlay" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}} onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-content" style={{background:'white', padding:'25px', borderRadius:'12px', width:'90%', maxWidth:'500px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'}} onClick={(e) => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                <h3 style={{margin:0, color:'#333'}}>Task Details</h3>
                <button onClick={() => setIsViewModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={22} color="#666"/></button>
            </div>
            <h2 style={{fontSize:'1.3rem', color:'#222', marginBottom:'10px', wordBreak: 'break-word'}}>{selectedTask.title}</h2>
            <div style={{display:'flex', gap:'10px', marginBottom:'15px', flexWrap:'wrap'}}>
                <span style={{background:'#f3f4f6', padding:'5px 10px', borderRadius:'6px', fontSize:'0.85rem', color:'#555', border:'1px solid #e5e7eb'}}>Priority: <strong>{selectedTask.priority}</strong></span>
                <span style={{background:'#f3f4f6', padding:'5px 10px', borderRadius:'6px', fontSize:'0.85rem', color:'#555', border:'1px solid #e5e7eb'}}>Due: <strong>{new Date(selectedTask.dueDate).toLocaleDateString()}</strong></span>
            </div>
            <label style={{display:'block', marginBottom:'5px', fontSize:'0.9rem', color:'#777', fontWeight:'600'}}>Description:</label>
            <div style={{color:'#444', lineHeight:'1.6', background:'#f9fafb', padding:'15px', borderRadius:'8px', border: '1px solid #e5e7eb', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{selectedTask.description}</div>
            <button onClick={() => { handleToggleTask(selectedTask._id, selectedTask.status); setIsViewModalOpen(false); }} style={{width:'100%', padding:'12px', marginTop:'20px', background: selectedTask.status === 'Completed' ? '#ff9800' : '#10b981', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'1rem'}}>
                {selectedTask.status === 'Completed' ? 'Mark Incomplete' : 'Mark as Completed'}
            </button>
          </div>
        </div>
      )}

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
                <div className="inp-group"><label>Email</label><input type="email" placeholder="Client Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
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
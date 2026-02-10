import React, { useState, useEffect } from 'react';
import { 
  Clock, ListTodo, CalendarDays, CheckCircle2, 
  LogOut, User, AlertCircle, X, UserPlus, Users, History, 
  ArrowRight, PlayCircle, StopCircle, BadgeCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './EmployeeDashboard.css'; 
import { toast } from 'react-toastify';

// --- CONFIGURATION ---
const API_BASE = 'https://skitecrm.onrender.com/api';
const UPLOADS_URL = "https://skitecrm.onrender.com/api/uploads";

const ATTENDANCE_URL = `${API_BASE}/attendance`;
const TASKS_URL = `${API_BASE}/tasks`;
const USER_URL = `${API_BASE}/user`;

// --- CUSTOM HOOK: DETECT MOBILE DEVICE ---
const useIsMobileDevice = () => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  useEffect(() => {
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(userAgent);
      const isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobileDevice(isMobileUA || (isTouchDevice && isSmallScreen));
    };
    checkMobileDevice();
    window.addEventListener('resize', checkMobileDevice);
    return () => window.removeEventListener('resize', checkMobileDevice);
  }, []);
  return isMobileDevice;
};

// --- MAIN COMPONENT ---
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobileDevice(); 
  
  // --- STATE ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); 
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTeammateModalOpen, setIsTeammateModalOpen] = useState(false);
  
  const [selectedTeammateData, setSelectedTeammateData] = useState({
    details: null, tasks: [], attendanceHistory: [], loading: false
  });
  
  const [videoEditors, setVideoEditors] = useState([]);
  const [newTaskData, setNewTaskData] = useState({
    title: "", description: "", priority: "Medium", dueDate: "", assignedTo: ""
  });
  
  // Initial Load from LocalStorage
  const storedUser = JSON.parse(localStorage.getItem("employeeUser") || '{}');
  const [currentUser, setCurrentUser] = useState(storedUser); 

  const token = localStorage.getItem('employeeToken');
  const EMPLOYEE_ID = currentUser?._id || currentUser?.id;
  const EMPLOYEE_NAME = currentUser?.name || "Employee";
  const EMPLOYEE_DESIGNATION = currentUser?.designation || "Team Member";
  
  const isContentWriter = (EMPLOYEE_DESIGNATION || "").toLowerCase().includes("content writ");

  // Dashboard State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [lastSession, setLastSession] = useState({ checkInTime: null });

  // --- NEW STATE for PAYROLL STATUS ---
  const [todayWorkHours, setTodayWorkHours] = useState(0);
  const [payrollStatus, setPayrollStatus] = useState("Absent"); // Absent, Half Day, Present

  // --- INIT ---
  useEffect(() => { if (!token || !storedUser) navigate('/'); }, [navigate, token]);
  
  // Update Time & Payroll Logic every second
  useEffect(() => { 
    const i = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000); 
    return () => clearInterval(i); 
  }, []);

  // --- 1. FETCH FRESH USER PROFILE ---
  useEffect(() => {
    const fetchFreshProfile = async () => {
        if (!EMPLOYEE_ID || !token) return;

        try {
            const res = await fetch(`${USER_URL}/${EMPLOYEE_ID}`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                }
            });

            if (res.ok) {
                const data = await res.json();
                const freshUser = data.user || data.employee || data; 
                setCurrentUser(freshUser); 
                localStorage.setItem("employeeUser", JSON.stringify(freshUser)); 
            }
        } catch (error) {
            console.error("Error fetching fresh profile:", error);
        }
    };
    fetchFreshProfile();
  }, [EMPLOYEE_ID, token]); 

  // --- 2. CALCULATE PAYROLL STATUS (UPDATED LOGIC) ---
// --- 2. CALCULATE PAYROLL STATUS (UPDATED LOGIC WITH STRICT RULES) ---
  const calculateDailyStatus = async () => {
    if (!EMPLOYEE_ID) return;
    try {
        const res = await fetch(`${ATTENDANCE_URL}/${EMPLOYEE_ID}`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (res.ok) {
            const history = await res.json();
            const now = new Date();
            const todayStr = now.toDateString();
            
            // Filter only today's records
            const todayRecords = Array.isArray(history) ? history.filter(r => new Date(r.checkInTime).toDateString() === todayStr) : [];
            
            let totalMillis = 0;
            let ruleViolation = false; // New Flag for Rules

            // Sum completed sessions
            todayRecords.forEach(r => {
                if(r.checkOutTime) {
                    const inTime = new Date(r.checkInTime);
                    const outTime = new Date(r.checkOutTime);
                    
                    // RULE 1: If Checkout is Next Day (மறுநாள் செக்-அவுட்)
                    if (inTime.toDateString() !== outTime.toDateString()) {
                        ruleViolation = true;
                    }

                    // RULE 2: If Checkout is after 9:00 PM (21:00) (9 மணிக்கு மேல்)
                    if (outTime.getHours() >= 21) { 
                        ruleViolation = true;
                    }

                    totalMillis += outTime - inTime;
                }
            });

            // Add CURRENT live session if checked in
            if (isCheckedIn && startTime) {
                const start = new Date(startTime);
                if (start.toDateString() === todayStr) {
                    const currentSessionMillis = now - start;
                    totalMillis += currentSessionMillis;

                    // Live Check: If currently it is past 9 PM
                    if (now.getHours() >= 21) {
                        ruleViolation = true;
                    }
                }
            }

            const hours = totalMillis / (1000 * 60 * 60);
            setTodayWorkHours(hours);

            // --- FINAL STATUS LOGIC ---
            if (ruleViolation) {
                // விதிமுறை மீறப்பட்டால் Absent
                setPayrollStatus("Absent ❌"); 
            } else {
                // Normal Logic
                if (hours >= 6) setPayrollStatus("Present");
                else if (hours >= 3) setPayrollStatus("Half Day");
                else setPayrollStatus("Absent / Short");
            }
        }
    } catch (err) {
        console.error("Payroll Calc Error:", err);
    }
  };
  // Run calculation every minute OR when check-in status changes
  useEffect(() => {
    calculateDailyStatus();
    const interval = setInterval(calculateDailyStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [EMPLOYEE_ID, isCheckedIn, startTime]); 


  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchVideoEditorsData = async () => {
      if (!isContentWriter) return;
      try {
        const res = await fetch(`${USER_URL}/all`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const allUsers = data.employees || data.users || data;
          if (Array.isArray(allUsers)) {
            const editors = allUsers.filter(u => (u.designation || "").toLowerCase().includes('video'));
            setVideoEditors(editors);
            if(editors.length > 0) {
                setNewTaskData(prev => ({...prev, assignedTo: editors[0]._id}));
            }
          }
        }
      } catch (error) { console.error("Error fetching video editors:", error); }
    };
    fetchVideoEditorsData();
  }, [isContentWriter, token]);

  const fetchTasks = async () => {
    if (!EMPLOYEE_ID) return;
    try {
      const response = await fetch(`${TASKS_URL}/${EMPLOYEE_ID}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (error) { console.error("Error fetching tasks:", error); } finally { setTaskLoading(false); }
  };

  useEffect(() => { fetchTasks(); const i = setInterval(fetchTasks, 10000); return () => clearInterval(i); }, [EMPLOYEE_ID, token]);

  // --- ATTENDANCE ---
  useEffect(() => {
    if (!EMPLOYEE_ID) return;
    const checkActiveSession = async () => {
      try {
        const savedSession = JSON.parse(localStorage.getItem('activeAttendanceSession'));
        const response = await fetch(`${ATTENDANCE_URL}/status/${EMPLOYEE_ID}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          
          if (data.isCheckedIn) { 
              const sessionStart = new Date(data.checkInTime);
              // Check if session is stale (started on a previous day)
              if (sessionStart.toDateString() !== new Date().toDateString()) {
                  // User forgot to checkout yesterday. 
                  // We show them as checked in, BUT calculateDailyStatus will ignore the hours for TODAY.
                  // When they checkout, the backend will record the checkout time.
                  // Since the hours belong to yesterday, they won't count for today's "Present".
              }
              setIsCheckedIn(true); 
              setStartTime(sessionStart); 
              return; 
          }
          if (data.lastSession) setLastSession(data.lastSession);
        }
        if (savedSession && savedSession.userId === EMPLOYEE_ID) { setIsCheckedIn(true); setStartTime(new Date(savedSession.startTime)); }
      } catch (error) { console.error("Session check failed", error); }
    };
    checkActiveSession();
  }, [EMPLOYEE_ID, token]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ATTENDANCE_URL}/checkin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: EMPLOYEE_ID })
      });
      const data = await response.json();
      if (!response.ok) { 
        if(data.msg && data.msg.includes("already")) { setIsCheckedIn(true); setStartTime(new Date()); return; }
        toast.error(data.msg); return; 
      }
      const sessionStart = new Date(data.checkInTime);
      setIsCheckedIn(true); setStartTime(sessionStart); 
      localStorage.setItem('activeAttendanceSession', JSON.stringify({ userId: EMPLOYEE_ID, startTime: sessionStart }));
      calculateDailyStatus(); // Update status immediately
      toast.success("Checked In Successfully!");
    } catch (error) { toast.error("Network Error"); } finally { setLoading(false); }
  };

const handleCheckOut = async () => {
    if (!taskDescription.trim()) { toast.warning("⚠️ Enter task description to checkout."); return; }
    
    const now = new Date();

    // Check strict rules immediately upon checkout click
    if (now.getHours() >= 21) {
        toast.error("Late Checkout (After 9 PM). Marked as Absent.");
    } else if (startTime && new Date(startTime).toDateString() !== now.toDateString()) {
        toast.error("Next Day Checkout detected. Marked as Absent.");
    }

    setLoading(true);
    try {
      await fetch(`${ATTENDANCE_URL}/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: EMPLOYEE_ID, taskDescription })
      });
      setIsCheckedIn(false); setStartTime(null); setTaskDescription(''); 
      localStorage.removeItem('activeAttendanceSession');
      
      // Success message logic
      if (now.getHours() < 21) {
          toast.success("Checked Out Successfully!");
      }
      
      setLastSession({ checkInTime: new Date() }); 
      calculateDailyStatus(); // Update status immediately
    } catch (error) { toast.error("Network Error"); } finally { setLoading(false); }
  };
  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await fetch(`${TASKS_URL}/${taskId}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) { fetchTasks(); toast.error("Failed to update status"); }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!newTaskData.assignedTo) { toast.error("Please select a team member."); return; }
    if (!newTaskData.title || !newTaskData.dueDate) { toast.error("Title and Due Date are required."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${TASKS_URL}/create`, {
        method: "POST", 
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(newTaskData),
      });
      const data = await res.json(); 
      if (res.ok) {
        toast.success("Task assigned successfully!"); 
        setIsAssignModalOpen(false);
        setNewTaskData({ title: "", description: "", priority: "Medium", dueDate: "", assignedTo: videoEditors.length > 0 ? videoEditors[0]._id : "" });
      } else { toast.error(data.message || "Failed to assign task."); }
    } catch (error) { console.error(error); toast.error("Network Error: Could not assign task."); } finally { setLoading(false); }
  };

  const handleTeammateClick = async (teammate) => {
    setIsTeammateModalOpen(true);
    setSelectedTeammateData({ details: teammate, tasks: [], attendanceHistory: [], loading: true });

    try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const tasksRes = await fetch(`${TASKS_URL}/${teammate._id}`, { headers });
        const tasksData = await tasksRes.json();
        const attRes = await fetch(`${ATTENDANCE_URL}/${teammate._id}`, { headers }); 
        const attData = await attRes.json();

        setSelectedTeammateData({
            details: teammate,
            tasks: Array.isArray(tasksData) ? tasksData : [],
            attendanceHistory: Array.isArray(attData) ? attData : [], 
            loading: false
        });
    } catch (error) {
        console.error("Error fetching details:", error);
        setSelectedTeammateData(prev => ({ ...prev, loading: false }));
        toast.error("Could not load teammate history.");
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${UPLOADS_URL}/${path.replace(/^\//, "")}`;
  };

  // --- HELPER: RENDER AVATAR ---
  const renderAvatar = (user) => {
    const rawImage = user.image || user.avatar || user.profilePic;
    const imgUrl = getImageUrl(rawImage);
    const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

    if (imgUrl) {
      return (
        <img 
          src={imgUrl} 
          alt={user.name} 
          className="avatar-img"
          onError={(e) => {
            e.target.style.display = 'none'; 
            e.target.parentNode.innerText = initial; 
          }}
        />
      );
    }
    return initial;
  };

  // --- UTILS ---
  const calculateDuration = (start) => {
    if (!start) return { h: 0, m: 0 };
    const diff = new Date() - new Date(start);
    return { h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000) };
  };

  const formatDateWithDay = (d) => d ? new Date(d).toLocaleDateString('en-US', {weekday: 'short', month:'short', day:'numeric'}) : 'N/A';
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;

  // --- SORT TASKS: NEWEST FIRST ---
  const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className={`dashboard-layout ${isMobile ? "mobile-view" : ""}`}>
      {/* 1. TOP NAV */}
      <header className="top-nav">
        <div className="nav-brand">
          <h2>Skite CRM</h2>
          <span className="badge-role">Employee Panel</span>
        </div>
        <div className="nav-user">
          <div className="user-profile">
            <div className="avatar-circle">{renderAvatar(currentUser)}</div>
            {!isMobile && (
              <div className="user-details-text">
                <span className="name">{EMPLOYEE_NAME}</span>
                <span className="role">{EMPLOYEE_DESIGNATION}</span>
              </div>
            )}
          </div>
          <button
            className="btn-logout-icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* 2. ATTENDANCE & WELCOME */}
        <section className="hero-section">
          <div className="welcome-card">
            <h1>Hello, {EMPLOYEE_NAME.split(" ")[0]}! 👋</h1>
            <p>Track your work and manage tasks efficiently.</p>
            <div className="date-badge">
              <CalendarDays size={16} />{" "}
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div
            className={`attendance-card ${isCheckedIn ? "active-session" : ""}`}
          >
            <div className="att-info">
              <div className="clock-large">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="session-status">
                {isCheckedIn ? (
                  <span className="status-live">
                    ● Live: {calculateDuration(startTime).h}h{" "}
                    {calculateDuration(startTime).m}m
                  </span>
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
                    placeholder="Work Summary / Note..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                  />
                  <button
                    className="btn-action btn-out"
                    onClick={handleCheckOut}
                    disabled={loading}
                  >
                    {loading ? (
                      "..."
                    ) : (
                      <>
                        <StopCircle size={18} /> Check Out
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  className="btn-action btn-in"
                  onClick={handleCheckIn}
                  disabled={loading}
                >
                  {loading ? (
                    "..."
                  ) : (
                    <>
                      <PlayCircle size={18} /> Check In
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 3. MAIN GRID (Tasks + Sidebar) */}
        <div className="content-grid">
          {/* LEFT: TASK LIST */}
          <div className="task-section">
            <div className="section-header">
              <h3>
                <ListTodo className="icon-orange" size={22} /> My Tasks (
                {totalTasks})
              </h3>
              {isContentWriter && (
                <button
                  className="btn-small-primary"
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  <UserPlus size={16} /> Assign
                </button>
              )}
            </div>

            <div className="progress-container">
              <div className="progress-labels">
                <span>Progress</span>
                <span>
                  {completedTasks}/{totalTasks} Done
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      totalTasks ? (completedTasks / totalTasks) * 100 : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="tasks-container">
              {taskLoading ? (
                <p className="loading-text">Loading Tasks...</p>
              ) : sortedTasks.length === 0 ? (
                <div className="empty-state">
                  <AlertCircle size={40} color="#ffccbc" />
                  <p>No tasks assigned to you yet.</p>
                </div>
              ) : (
                sortedTasks.map((task) => {
                  // Determine border color based on priority
                  let priorityColor = '#ccc';
                  if (task.priority === 'High') priorityColor = '#ff5252';
                  else if (task.priority === 'Medium') priorityColor = '#ff9800';
                  else if (task.priority === 'Low') priorityColor = '#4caf50';

                  return (
                    <div
                      key={task._id}
                      className="task-card"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsViewModalOpen(true);
                      }}
                      // Inline styling for the new card design request
                      style={{
                        borderLeft: `5px solid ${priorityColor}`,
                        padding: '15px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      {/* Top: Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4
                          className={task.status === "Completed" ? "completed-text" : ""}
                          style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}
                        >
                          {task.title}
                        </h4>
                        
                          {/* Toggle Checkbox Button */}
                          <button
                            className={`btn-check ${
                              task.status === "Completed" ? "checked" : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTask(task._id, task.status);
                            }}
                            title="Mark as Completed"
                          >
                            {task.status === "Completed" ? (
                              <CheckCircle2 size={24} />
                            ) : (
                              <div className="circle-empty" style={{ width: '22px', height: '22px' }}></div>
                            )}
                          </button>
                      </div>
                      
                      {/* Description - Added Here! */}
                      <p style={{
                          margin: '0',
                          fontSize: '0.9rem',
                          color: '#666',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: '3',
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                      }}>
                          {task.description}
                      </p>

                      {/* Middle: Big Due Date Box */}
                      <div style={{
                        background: '#f8f9fa',
                        padding: '10px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '1px solid #eee',
                        margin: '5px 0'
                      }}>
                          <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                            <CalendarDays size={12} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                            Due Date
                          </span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                            {formatDateWithDay(task.dueDate)}
                          </span>
                      </div>

                      {/* Bottom: Footer Info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <span style={{ color: '#888' }}>
                            Assigned: {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                          
                          <span
                          className={`status-text ${task.status.toLowerCase()}`}
                          style={{ fontWeight: '600' }}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: TEAM / STATS */}
          <div className="sidebar-section">
            
            {/* --- NEW STATUS CARD START --- */}
            <div className="widget-card">
              <div className="widget-header">
                <BadgeCheck size={18} className="icon-orange" />
                <span>Today's Status</span>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333' }}>
                      {todayWorkHours.toFixed(1)} <span style={{fontSize: '1rem', color: '#888'}}>hrs</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>Total Work Today</div>
                  
                  <div style={{ 
                      display: 'inline-block',
                      padding: '6px 15px', 
                      borderRadius: '20px', 
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      backgroundColor: payrollStatus === 'Present' ? '#e8f5e9' : payrollStatus === 'Half Day' ? '#fff3e0' : '#ffebee',
                      color: payrollStatus === 'Present' ? '#2e7d32' : payrollStatus === 'Half Day' ? '#ef6c00' : '#c62828',
                      border: `1px solid ${payrollStatus === 'Present' ? '#c8e6c9' : payrollStatus === 'Half Day' ? '#ffe0b2' : '#ffcdd2'}`
                  }}>
                      {payrollStatus === 'Present' ? '✅ Present' : payrollStatus === 'Half Day' ? '⚠️ Half Day' : '❌ Absent / Short'}
                  </div>
              </div>
            </div>
            {/* --- NEW STATUS CARD END --- */}

            {isContentWriter && (
              <div className="widget-card">
                <div className="widget-header">
                  <Users size={18} className="icon-orange" />
                  <span>Team Members</span>
                </div>
                <div className="team-list">
                  {videoEditors.length > 0 ? (
                    videoEditors.map((ed) => (
                      <div
                        key={ed._id}
                        className="team-row"
                        onClick={() => handleTeammateClick(ed)}
                      >
                        <div className="team-avatar">{renderAvatar(ed)}</div>
                        <div className="team-info">
                          <p className="t-name">{ed.name}</p>
                          <p className="t-role">{ed.designation}</p>
                        </div>
                        <ArrowRight size={14} color="#ccc" />
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">No team members found.</p>
                  )}
                </div>
              </div>
            )}

            <div className="widget-card">
              <div className="widget-header">
                <History size={18} className="icon-orange" />
                <span>Session Info</span>
              </div>
              <div className="info-row">
                <span>Last Check-in</span>
                <strong>
                  {lastSession.checkInTime
                    ? new Date(lastSession.checkInTime).toLocaleTimeString()
                    : "N/A"}
                </strong>
              </div>
              <div className="info-row">
                <span>Pending Tasks</span>
                <strong style={{ color: "#ff7f50" }}>
                  {totalTasks - completedTasks}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}
      {isViewModalOpen && selectedTask && (
        <div
          className="modal-backdrop"
          onClick={() => setIsViewModalOpen(false)}
        >
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Task Details</h3>
              <button onClick={() => setIsViewModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <h2>{selectedTask.title}</h2>
              <div className="tags-row">
                <span
                  className={`priority-tag ${selectedTask.priority.toLowerCase()}`}
                >
                  {selectedTask.priority}
                </span>
                <span className="date-tag">
                  Due: {formatDateWithDay(selectedTask.dueDate)}
                </span>
              </div>
              <p
                style={{ fontSize: "0.85rem", color: "#666", margin: "5px 0" }}
              >
                <strong>Assigned On:</strong>{" "}
                {formatDateWithDay(selectedTask.createdAt)}
              </p>
              <div className="desc-box">
                <label>Description</label>
                <p>{selectedTask.description}</p>
              </div>
              <div className="modal-actions">
                <button
                  className={`btn-primary-fill ${
                    selectedTask.status === "Completed" ? "green" : ""
                  }`}
                  onClick={() => {
                    handleToggleTask(selectedTask._id, selectedTask.status);
                    setIsViewModalOpen(false);
                  }}
                >
                  {selectedTask.status === "Completed"
                    ? "Mark Incomplete"
                    : "Mark as Completed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAssignModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsAssignModalOpen(false)}
        >
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Assign New Task</h3>
              <button onClick={() => setIsAssignModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAssignTask}>
              <div className="modal-body">
                <div className="input-group">
                  <label>Task Title</label>
                  <input
                    type="text"
                    required
                    value={newTaskData.title}
                    onChange={(e) =>
                      setNewTaskData({ ...newTaskData, title: e.target.value })
                    }
                    placeholder="e.g. Edit Vlog #4"
                  />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    required
                    value={newTaskData.description}
                    onChange={(e) =>
                      setNewTaskData({
                        ...newTaskData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Details..."
                  />
                </div>
                <div className="row-inputs">
                  <div className="input-group">
                    <label>Assign To</label>
                    <select
                      value={newTaskData.assignedTo}
                      onChange={(e) =>
                        setNewTaskData({
                          ...newTaskData,
                          assignedTo: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="" disabled>
                        Select a member
                      </option>
                      {videoEditors.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Priority</label>
                    <select
                      value={newTaskData.priority}
                      onChange={(e) =>
                        setNewTaskData({
                          ...newTaskData,
                          priority: e.target.value,
                        })
                      }
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    required
                    value={newTaskData.dueDate}
                    onChange={(e) =>
                      setNewTaskData({
                        ...newTaskData,
                        dueDate: e.target.value,
                      })
                    }
                  />
                </div>
                {/* NEW CODE: Disables button if Title or Date is missing */}
                <button
                  type="submit"
                  className="btn-primary-fill"
                  style={{
                    width: "100%",
                    marginTop: "15px",
                    opacity:
                      !newTaskData.title || !newTaskData.dueDate ? 0.6 : 1,
                    cursor:
                      !newTaskData.title || !newTaskData.dueDate
                        ? "not-allowed"
                        : "pointer",
                  }}
                  disabled={!newTaskData.title || !newTaskData.dueDate}
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TEAMMATE DETAILS MODAL --- */}
      {isTeammateModalOpen && selectedTeammateData.details && (
        <div
          className="modal-backdrop"
          onClick={() => setIsTeammateModalOpen(false)}
        >
          <div
            className="modal-window wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top">
              <h3>Teammate Profile</h3>
              <button onClick={() => setIsTeammateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body scrollable">
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "25px",
                  paddingBottom: "20px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div
                  className="avatar-circle"
                  style={{
                    width: "70px",
                    height: "70px",
                    fontSize: "2rem",
                    margin: "0 auto 15px",
                  }}
                >
                  {renderAvatar(selectedTeammateData.details)}
                </div>
                <h2 style={{ margin: "0 0 5px" }}>
                  {selectedTeammateData.details.name}
                </h2>
                <span className="priority-tag medium">
                  {selectedTeammateData.details.designation}
                </span>
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "0.9rem",
                    color: "#666",
                  }}
                >
                  {selectedTeammateData.details.email}
                </div>
              </div>

              {selectedTeammateData.loading ? (
                <p
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#888",
                  }}
                >
                  Loading data...
                </p>
              ) : (
                <div className="teammate-sections">
                  <div className="section-block">
                    <h4
                      style={{
                        marginBottom: "15px",
                        color: "#ff7f50",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <History size={18} /> Daily Attendance & Work Summaries
                    </h4>
                    {selectedTeammateData.attendanceHistory.length === 0 ? (
                      <p className="empty-text">No attendance records found.</p>
                    ) : (
                      <div
                        className="history-list"
                        style={{ maxHeight: "250px", overflowY: "auto" }}
                      >
                        {selectedTeammateData.attendanceHistory.map(
                          (record, index) => (
                            <div
                              key={index}
                              style={{
                                background: "#f9f9f9",
                                padding: "15px",
                                borderRadius: "10px",
                                marginBottom: "12px",
                                border: "1px solid #eee",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "8px",
                                  fontWeight: "600",
                                  fontSize: "0.9rem",
                                }}
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                  }}
                                >
                                  <CalendarDays size={14} />{" "}
                                  {new Date(
                                    record.checkInTime
                                  ).toLocaleDateString()}
                                </span>
                                <span
                                  style={{
                                    color: record.checkOutTime
                                      ? "#2e7d32"
                                      : "#ed6c02",
                                    fontSize: "0.8rem",
                                    background: record.checkOutTime
                                      ? "#e8f5e9"
                                      : "#fff3e0",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {record.checkOutTime
                                    ? "Completed"
                                    : "Active Now"}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "20px",
                                  color: "#666",
                                  fontSize: "0.85rem",
                                  marginBottom: "10px",
                                }}
                              >
                                <span>
                                  🟢 In:{" "}
                                  {new Date(
                                    record.checkInTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {record.checkOutTime && (
                                  <span>
                                    🔴 Out:{" "}
                                    {new Date(
                                      record.checkOutTime
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>
                              {record.taskDescription ? (
                                <div
                                  style={{
                                    background: "#fff",
                                    padding: "10px",
                                    borderRadius: "6px",
                                    border: "1px solid #e0e0e0",
                                    fontStyle: "italic",
                                    color: "#444",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: "bold",
                                      color: "#333",
                                      display: "block",
                                      marginBottom: "4px",
                                      fontSize: "0.75rem",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Work Summary:
                                  </span>
                                  "{record.taskDescription}"
                                </div>
                              ) : (
                                <div
                                  style={{
                                    fontSize: "0.85rem",
                                    color: "#999",
                                    fontStyle: "italic",
                                  }}
                                >
                                  No description provided.
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="section-block" style={{ marginTop: "30px" }}>
                    <h4
                      style={{
                        marginBottom: "15px",
                        color: "#333",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <ListTodo size={18} /> Assigned Tasks
                    </h4>
                    {selectedTeammateData.tasks.length === 0 ? (
                      <p className="empty-text">No tasks assigned.</p>
                    ) : (
                      <div
                        className="mini-task-list"
                        style={{
                          maxHeight: "250px",
                          overflowY: "auto",
                          paddingRight: "5px",
                        }}
                      >
                        {selectedTeammateData.tasks.map((t) => (
                          <div
                            key={t._id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "12px",
                              background: "white",
                              border: "1px solid #eee",
                              borderRadius: "8px",
                              marginBottom: "8px",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <p
                                style={{
                                  fontWeight: "600",
                                  margin: "0 0 4px",
                                  fontSize: "0.95rem",
                                }}
                              >
                                {t.title}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "0.85rem",
                                  color: "#666",
                                }}
                              >
                                {t.description}
                              </p>
                            </div>
                            <div
                              style={{ textAlign: "right", minWidth: "80px" }}
                            >
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#888",
                                  display: "block",
                                  marginBottom: "4px",
                                }}
                              >
                                Due: {formatDateWithDay(t.dueDate)}
                              </span>
                              <span
                                className={`status-text ${t.status.toLowerCase()}`}
                                style={{ fontSize: "0.8rem" }}
                              >
                                {t.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
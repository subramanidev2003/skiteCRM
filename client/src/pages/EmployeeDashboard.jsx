import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, ListTodo, CalendarDays, CheckCircle2, MapPin, 
  ArrowDown, ArrowUp, LogOut, User, AlertCircle, CheckCircle, 
  Bell, X, UserPlus, Users, Activity, History, Calendar 
} from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import './EmployeeDashboard.css'; 
import { toast } from 'react-toastify';

// --- CONFIGURATION ---
const API_BASE = 'http://localhost:4000/api';
const API_UPLOAD = 'http://localhost:4000/api/uploads';
const ATTENDANCE_URL = `${API_BASE}/attendance`;
const TASKS_URL = `${API_BASE}/tasks`;
const USER_URL = `${API_BASE}/user`;

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

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const isMobileDevice = useIsMobileDevice(); 
  
  // Existing Modals
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); 
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Teammate Detail Modal State
  const [isTeammateModalOpen, setIsTeammateModalOpen] = useState(false);
  const [selectedTeammateData, setSelectedTeammateData] = useState({
    details: null,
    tasks: [],
    attendanceHistory: [], 
    loading: false
  });
  
  // Data States
  const [videoEditors, setVideoEditors] = useState([]);
  const [newTaskData, setNewTaskData] = useState({
    title: "", description: "", priority: "Medium", dueDate: "", assignedTo: ""
  });
  
  const loggedUser = JSON.parse(localStorage.getItem("employeeUser") || '{}');
  const token = localStorage.getItem('employeeToken');
  const EMPLOYEE_ID = loggedUser?._id || loggedUser?.id;
  const EMPLOYEE_NAME = loggedUser?.name || "Employee";
  const EMPLOYEE_DESIGNATION = loggedUser?.designation || "";
  const EMPLOYEE_IMAGE = loggedUser?.image || null;

  // Permissions
  const isContentWriter = (EMPLOYEE_DESIGNATION || "").toLowerCase().includes("content writ");

  // Dashboard States
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const previousTaskCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const [lastSession, setLastSession] = useState({ checkInTime: null, checkOutTime: null, taskDescription: '' });

  // Init
  useEffect(() => { if (!token || !loggedUser) navigate('/'); }, [navigate, token]);
  useEffect(() => { if (('Notification' in window) && Notification.permission === 'default') Notification.requestPermission(); }, []);
  useEffect(() => { const i = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(i); }, []);

  // --- FETCH VIDEO EDITORS ---
  useEffect(() => {
    const fetchVideoEditorsData = async () => {
      if (!isContentWriter) return;
      try {
        const res = await fetch(`${USER_URL}/all`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401 || res.status === 403) return; 
        
        if (res.ok) {
          const data = await res.json();
          const allUsers = data.employees || data.users || data;
          if (Array.isArray(allUsers)) {
            const editors = allUsers.filter(u => (u.designation || "").toLowerCase().includes('video'));
            setVideoEditors(editors);
            if(editors.length > 0) setNewTaskData(prev => ({...prev, assignedTo: editors[0]._id}));
          }
        }
      } catch (error) { console.error("Error fetching video editors:", error); }
    };
    fetchVideoEditorsData();
  }, [isContentWriter, token]);

  // --- HANDLE CLICK ON TEAMMATE ---
  const handleTeammateClick = async (teammate) => {
    setIsTeammateModalOpen(true);
    setSelectedTeammateData({ details: teammate, tasks: [], attendanceHistory: [], loading: true });

    try {
        const tasksRes = await fetch(`${TASKS_URL}/${teammate._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const tasksData = tasksRes.ok ? await tasksRes.json() : [];

        const historyRes = await fetch(`${ATTENDANCE_URL}/${teammate._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        let historyData = [];
        if (historyRes.ok) {
            const data = await historyRes.json();
            historyData = Array.isArray(data) ? data : (data.history || []); 
        }

        setSelectedTeammateData({ 
            details: teammate, 
            tasks: Array.isArray(tasksData) ? tasksData : [], 
            attendanceHistory: historyData, 
            loading: false 
        });

    } catch (error) {
        console.error("Error fetching details", error);
        setSelectedTeammateData(prev => ({ ...prev, loading: false }));
        toast.error("Could not fetch teammate details.");
    }
  };

  // --- STANDARD HANDLERS ---
  const handleAssignTask = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${TASKS_URL}/create`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTaskData),
      });
      if (res.ok) {
        toast.success("Task assigned successfully!"); setIsAssignModalOpen(false);
        setNewTaskData({ title: "", description: "", priority: "Medium", dueDate: "", assignedTo: videoEditors.length > 0 ? videoEditors[0]._id : "" });
      } else { const err = await res.json(); toast.error(err.message || "Failed"); }
    } catch (error) { toast.error("Network error."); } finally { setLoading(false); }
  };

  const formatCurrentTime = () => currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatCurrentDate = () => currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (date) => !date ? 'N/A' : new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (dateString) => !dateString ? 'No Date' : new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const calculateDuration = (start, end) => {
    if (!start || !end) return { hours: 0, minutes: 0 };
    const diffMs = new Date(end) - new Date(start);
    return { hours: Math.floor(diffMs / (1000 * 60 * 60)), minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)) };
  };

  const fetchTasks = async () => {
    if (!EMPLOYEE_ID) return;
    try {
      const response = await fetch(`${TASKS_URL}/${EMPLOYEE_ID}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        const tasksArray = Array.isArray(data) ? data : [];
        previousTaskCountRef.current = tasksArray.length;
        setTasks(tasksArray);
        isFirstLoadRef.current = false;
      }
    } catch (error) { console.error("Error fetching tasks:", error); } finally { setTaskLoading(false); }
  };

  useEffect(() => { fetchTasks(); const i = setInterval(fetchTasks, 10000); return () => clearInterval(i); }, [EMPLOYEE_ID, token]);

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await fetch(`${TASKS_URL}/${taskId}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (selectedTask?._id === taskId) setSelectedTask(prev => ({ ...prev, status: newStatus }));
    } catch (error) { fetchTasks(); toast.error("Failed to update status"); }
  };

  useEffect(() => {
    if (!EMPLOYEE_ID) return;
    const checkActiveSession = async () => {
      try {
        const savedSession = JSON.parse(localStorage.getItem('activeAttendanceSession'));
        const response = await fetch(`${ATTENDANCE_URL}/status/${EMPLOYEE_ID}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          if (data.isCheckedIn) { setIsCheckedIn(true); setStartTime(new Date(data.checkInTime)); return; }
        }
        if (savedSession && savedSession.userId === EMPLOYEE_ID) { setIsCheckedIn(true); setStartTime(new Date(savedSession.startTime)); }
      } catch (error) { console.error("Session check failed", error); }
    };
    checkActiveSession();
  }, [EMPLOYEE_ID, token]);

  const handleLogout = () => { localStorage.removeItem("employeeUser"); localStorage.removeItem("employeeToken"); localStorage.removeItem("activeAttendanceSession"); navigate('/'); };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ATTENDANCE_URL}/checkin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: EMPLOYEE_ID })
      });
      const data = await response.json();
      if (!response.ok) { 
        if(data.msg && data.msg.includes("already checked in")) { setIsCheckedIn(true); setStartTime(new Date()); return; }
        alert(`Check-in failed: ${data.msg}`); return; 
      }
      const sessionStart = new Date(data.checkInTime);
      setIsCheckedIn(true); setStartTime(sessionStart); setLastSession({ checkInTime: null, checkOutTime: null, taskDescription: '' });
      toast.success(`Checked In: ${sessionStart.toLocaleTimeString()}`);
      localStorage.setItem('activeAttendanceSession', JSON.stringify({ userId: EMPLOYEE_ID, startTime: sessionStart }));
    } catch (error) { toast.error("Network Error"); } finally { setLoading(false); }
  };

  const handleCheckOut = async () => {
    if (!taskDescription.trim()) { toast("⚠️ Please enter a task description."); return; }
    setLoading(true);
    try {
      const response = await fetch(`${ATTENDANCE_URL}/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: EMPLOYEE_ID, taskDescription })
      });
      if (!response.ok) { alert("Check-out failed"); return; }
      const checkOutTime = new Date();
      setLastSession({ checkInTime: startTime, checkOutTime, taskDescription });
      toast.success(`Checked Out: ${checkOutTime.toLocaleTimeString()}`);
      setIsCheckedIn(false); setStartTime(null); setTaskDescription(''); localStorage.removeItem('activeAttendanceSession');
    } catch (error) { toast.error("Network Error"); } finally { setLoading(false); }
  };

  const openViewModal = (task) => { setSelectedTask(task); setIsViewModalOpen(true); };
  const closeViewModal = () => { setIsViewModalOpen(false); setSelectedTask(null); };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="welcome-text">
            {EMPLOYEE_IMAGE ? (
              <img
                src={`${API_UPLOAD}/${EMPLOYEE_IMAGE}`}
                alt={EMPLOYEE_NAME}
                className="header-profile-img"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #3b82f6",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#e5e7eb",
                display: EMPLOYEE_IMAGE ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #3b82f6",
              }}
            >
              <User size={24} className="icon-blue" />
            </div>
            <div className="header-info">
              <span>
                Welcome, <strong>{EMPLOYEE_NAME}</strong>
              </span>
              <span
                className="header-designation"
                style={{ fontSize: "0.8rem", color: "#6b7280" }}
              >
                {EMPLOYEE_DESIGNATION}
              </span>
            </div>
          </div>
          <div className="header-actions">
            {/* {isContentWriter && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#ff4500",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 4px 14px 0 rgba(246, 123, 92, 0.39)",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              >
                <UserPlus size={18} style={{ marginRight: "8px" }} />
                Assign Task
              </button>
            )} */}
            <button className="btn-logout1" onClick={handleLogout}>
              <LogOut size={18} /> <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Time Management */}
        <div className="card1 time-card">
          <div className="time-left-section">
            <div className="time-info">
              <div className="section-title">
                <Clock className="icon-blue" size={18} />
                <span>Current Time</span>
              </div>
              <div className="clock-display">
                <div className="clock-time">{formatCurrentTime()}</div>
                <div className="clock-date">{formatCurrentDate()}</div>
              </div>
            </div>
            {isCheckedIn && (
              <div className="task-input-container">
                <input
                  type="text"
                  placeholder="What are you working on right now?"
                  className="task-input"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}
          </div>
          <div className="time-actions">
            {!isCheckedIn ? (
              <button
                className="btn-primary"
                onClick={handleCheckIn}
                disabled={loading || isMobileDevice}
                style={isMobileDevice ? { display: "none" } : {}}
              >
                {loading ? (
                  "Checking In..."
                ) : (
                  <>
                    <Clock size={18} /> Check In
                  </>
                )}
              </button>
            ) : (
              <button
                className="btn-danger"
                onClick={handleCheckOut}
                disabled={loading || isMobileDevice}
                style={isMobileDevice ? { display: "none" } : {}}
              >
                {loading ? (
                  "Checking Out..."
                ) : (
                  <>
                    <LogOut size={18} /> Check Out
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* TASKS COLUMN */}
          <div className="column-tasks">
            <div className="section-header">
              
              <h2 className='d-flex gap-3'><ListTodo className="icon-blue" size={24} />My Tasks</h2>
              {isContentWriter && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#ff4500",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 4px 14px 0 rgba(246, 123, 92, 0.39)",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              >
                <UserPlus size={18} style={{ marginRight: "8px" }} />
                Assign Task
              </button>
            )}
            </div>
            <div className="card1 stats-row">
              <div className="stat-item">
                <p className="stat-number">{totalTasks}</p>
                <p className="stat-label">Assigned</p>
              </div>
              <div className="stat-item">
                <p className="stat-number text-green">{completedTasks}</p>
                <p className="stat-label">Done</p>
              </div>
              <div className="stat-item">
                <p className="stat-number text-blue">{pendingTasks}</p>
                <p className="stat-label">Pending</p>
              </div>
            </div>
            <div className="card1 task-list">
              {taskLoading ? (
                <p className="loading-text">Loading...</p>
              ) : tasks.length === 0 ? (
                <div className="empty-tasks">
                  <AlertCircle />
                  <p>No tasks assigned.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task._id}
                    className="task-item clickable"
                    onClick={() => openViewModal(task)}
                  >
                    <div className="task-info">
                      <h3
                        style={{
                          textDecoration:
                            task.status === "Completed"
                              ? "line-through"
                              : "none",
                          color:
                            task.status === "Completed" ? "#9ca3af" : "inherit",
                        }}
                      >
                        {task.title}
                      </h3>
                      <div className="task-meta">
                        <CalendarDays size={14} />
                        <span>{formatDate(task.dueDate)}</span>
                        {task.priority === "High" && (
                          <span className="priority-high">! High</span>
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            color: "#6b7280",
                          }}
                        >
                          <History size={14} />
                          <span style={{ fontSize: "0.75rem" }}>
                            {/* ✅ FIX: Optional chaining used here */}
                            Assigned:{" "}
                            {task?.createdAt
                              ? formatDate(task.createdAt)
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button
                        className="check-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task._id, task.status);
                        }}
                      >
                        {task.status === "Completed" ? (
                          <div className="circle-filled">
                            <CheckCircle2 size={24} />
                          </div>
                        ) : (
                          <div className="circle-outline">
                            <CheckCircle2 size={24} />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ATTENDANCE & TEAM COLUMN */}
          <div className="column-attendance">
            {/* VIDEO EDITOR TEAM (Clickable) */}
            {isContentWriter && (
              <div
                className="video-editor-team-section"
                style={{ marginBottom: "20px" }}
              >
                <div className="section-header1">
                  <Users className="icon-blue" size={24} />
                  <h2>Video Editing Team</h2>
                </div>
                <div className="card1" style={{ padding: "15px" }}>
                  {videoEditors.length === 0 ? (
                    <p className="text-gray-500">No Video Editors found.</p>
                  ) : (
                    <div
                      className="editor-list"
                      style={{ maxHeight: "200px", overflowY: "auto" }}
                    >
                      {videoEditors.map((editor) => (
                        <div
                          key={editor._id}
                          onClick={() => handleTeammateClick(editor)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px",
                            borderBottom: "1px solid #f3f4f6",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f9fafb")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                backgroundColor: "#e0f2fe",
                                color: "#0ea5e9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                              }}
                            >
                              {editor.name.charAt(0)}
                            </div>
                            <div>
                              <p
                                style={{
                                  fontWeight: "500",
                                  margin: 0,
                                  fontSize: "0.9rem",
                                }}
                              >
                                {editor.name}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                  margin: 0,
                                }}
                              >
                                {editor.designation}
                              </p>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "#3b82f6",
                              background: "#e0f2fe",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            View Details
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="section-header1">
              <CalendarDays className="icon-blue" size={24} />
              <h2>My Session</h2>
            </div>
            <div className="card1 attendance-card">
              {isCheckedIn ? (
                <>
                  <div className="att-header">
                    <h3>Active Session</h3>
                    <span className="badge-active">Live</span>
                  </div>
                  <div className="att-details">
                    <div className="att-row">
                      <ArrowDown size={18} className="icon-in" />
                      <span>
                        Check In: <strong>{formatTime(startTime)}</strong>
                      </span>
                    </div>
                    <div className="att-row">
                      <Clock size={16} />
                      <span>
                        Duration:{" "}
                        <strong>
                          {calculateDuration(startTime, new Date()).hours}h{" "}
                          {calculateDuration(startTime, new Date()).minutes}m
                        </strong>
                      </span>
                    </div>
                  </div>
                </>
              ) : lastSession.checkInTime ? (
                <>
                  <div className="att-header">
                    <h3>Last Session</h3>
                    <span className="badge-completed">Completed</span>
                  </div>
                  <div className="att-details">
                    <div className="att-row">
                      <ArrowDown size={18} className="icon-in" />
                      <span>
                        In: <strong>{formatTime(lastSession.checkInTime)}</strong>
                      </span>
                    </div>
                    <div className="att-row">
                      <ArrowUp size={18} className="icon-out" />
                      <span>
                        Out:{" "}
                        <strong>{formatTime(lastSession.checkOutTime)}</strong>
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="att-empty">
                  <Clock size={24} className="icon-empty" />
                  <p>Not checked in today</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <Outlet />
      </div>

      {/* TEAMMATE DETAILS MODAL */}
      {isTeammateModalOpen && selectedTeammateData.details && (
        <div
          className="emp-modal-overlay"
          onClick={() => setIsTeammateModalOpen(false)}
        >
          <div
            className="emp-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <div className="emp-modal-header">
              <span className="emp-modal-title">Employee Details</span>
              <button
                className="emp-modal-close"
                onClick={() => setIsTeammateModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="emp-modal-content">
              {/* 1. Header Info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "20px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "15px",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                  }}
                >
                  {selectedTeammateData.details.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                    {selectedTeammateData.details.name}
                  </h3>
                  <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
                    {selectedTeammateData.details.designation}
                  </p>
                </div>
              </div>

              {selectedTeammateData.loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#666",
                  }}
                >
                  Loading details...
                </div>
              ) : (
                <>
                  {/* 2. Daily Work Log (History) */}
                  <div style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.9rem",
                          textTransform: "uppercase",
                          color: "#888",
                          margin: 0,
                        }}
                      >
                        Daily Work Log
                      </h4>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          background: "#f3f4f6",
                          color: "#6b7280",
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        {selectedTeammateData.attendanceHistory.length} Days
                      </span>
                    </div>

                    <div
                      style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        border: "1px solid #eee",
                        borderRadius: "6px",
                        background: "#fafafa",
                      }}
                    >
                      {selectedTeammateData.attendanceHistory.length === 0 ? (
                        <div
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#999",
                            fontSize: "0.9rem",
                          }}
                        >
                          No attendance history found.
                        </div>
                      ) : (
                        selectedTeammateData.attendanceHistory.map(
                          (record, index) => (
                            <div
                              key={index}
                              style={{
                                padding: "10px",
                                borderBottom: "1px solid #eee",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }}
                            >
                              <div
                                style={{
                                  minWidth: "80px",
                                  fontSize: "0.85rem",
                                  color: "#555",
                                  fontWeight: "500",
                                }}
                              >
                                {new Date(
                                  record.checkInTime || record.date
                                ).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#333",
                                  flex: 1,
                                  paddingLeft: "10px",
                                }}
                              >
                                {record.taskDescription || (
                                  <span
                                    style={{
                                      color: "#999",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    No description provided
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>

                  {/* 3. Task List */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.9rem",
                          textTransform: "uppercase",
                          color: "#888",
                          margin: 0,
                        }}
                      >
                        Assigned Tasks
                      </h4>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          background: "#eff6ff",
                          color: "#3b82f6",
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        {selectedTeammateData.tasks.length} Total
                      </span>
                    </div>

                    <div
                      style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        border: "1px solid #eee",
                        borderRadius: "6px",
                      }}
                    >
                      {selectedTeammateData.tasks.length === 0 ? (
                        <div
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#999",
                            fontSize: "0.9rem",
                          }}
                        >
                          No tasks assigned yet.
                        </div>
                      ) : (
                        selectedTeammateData.tasks.map((task) => (
                          <div
                            key={task._id}
                            style={{
                              padding: "10px",
                              borderBottom: "1px solid #f9fafb",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "0.9rem",
                                  fontWeight: "500",
                                }}
                              >
                                {task.title}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "0.75rem",
                                  color:
                                    task.priority === "High"
                                      ? "#ef4444"
                                      : "#6b7280",
                                }}
                              >
                                {task.priority} Priority • Due:{" "}
                                {formatDate(task.dueDate)}
                              </p>
                            </div>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background:
                                  task.status === "Completed"
                                    ? "#dcfce7"
                                    : "#fff7ed",
                                color:
                                  task.status === "Completed"
                                    ? "#166534"
                                    : "#c2410c",
                              }}
                            >
                              {task.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TASK MODAL */}
      {isAssignModalOpen && (
        <div className="emp-modal-overlay">
          <div className="emp-modal-box">
            <div className="emp-modal-header">
              <span className="emp-modal-title">
                Assign Task to Video Editor
              </span>
              <button
                className="emp-modal-close"
                onClick={() => setIsAssignModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="emp-modal-content">
              <form onSubmit={handleAssignTask}>
                <div className="emp-section">
                  <label className="emp-label">Task Title</label>
                  <input
                    type="text"
                    className="task-input"
                    required
                    value={newTaskData.title}
                    onChange={(e) =>
                      setNewTaskData({ ...newTaskData, title: e.target.value })
                    }
                    placeholder="Enter task title"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                    }}
                  />
                </div>
                <div className="emp-section">
                  <label className="emp-label">Description</label>
                  <textarea
                    className="task-input"
                    required
                    rows="3"
                    value={newTaskData.description}
                    onChange={(e) =>
                      setNewTaskData({
                        ...newTaskData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Task details..."
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                    }}
                  />
                </div>
                <div className="emp-grid">
                  <div className="emp-item">
                    <label className="emp-label">Assign To</label>
                    <select
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                      value={newTaskData.assignedTo}
                      onChange={(e) =>
                        setNewTaskData({
                          ...newTaskData,
                          assignedTo: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Select Editor --</option>
                      {videoEditors.length > 0 ? (
                        videoEditors.map((editor) => (
                          <option key={editor._id} value={editor._id}>
                            {editor.name} ({editor.designation})
                          </option>
                        ))
                      ) : (
                        <option disabled>No Editors Found</option>
                      )}
                    </select>
                  </div>
                  <div className="emp-item">
                    <label className="emp-label">Priority</label>
                    <select
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                      value={newTaskData.priority}
                      onChange={(e) =>
                        setNewTaskData({
                          ...newTaskData,
                          priority: e.target.value,
                        })
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="emp-item">
                    <label className="emp-label">Due Date</label>
                    <input
                      type="date"
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                      value={newTaskData.dueDate}
                      onChange={(e) =>
                        setNewTaskData({
                          ...newTaskData,
                          dueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    width: "100%",
                    marginTop: "20px",
                    justifyContent: "center",
                  }}
                >
                  {loading ? "Assigning..." : "Confirm Assignment"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TASK MODAL */}
      {isViewModalOpen && selectedTask && (
        <div className="emp-modal-overlay" onClick={closeViewModal}>
          <div className="emp-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <span className="emp-modal-title">Task Details</span>
              <button className="emp-modal-close" onClick={closeViewModal}>
                <X size={24} />
              </button>
            </div>
            <div className="emp-modal-content">
              <h3 className="emp-task-title">{selectedTask.title}</h3>

              <div className="emp-status-row">
                <span
                  className={`emp-badge emp-priority-${selectedTask.priority?.toLowerCase()}`}
                >
                  <AlertCircle size={14} style={{ marginRight: 4 }} />{" "}
                  {selectedTask.priority} Priority
                </span>
                <span
                  className={`emp-badge emp-status-${
                    selectedTask.status?.toLowerCase() || "pending"
                  }`}
                >
                  {selectedTask.status || "Pending"}
                </span>
              </div>

              <div className="emp-section">
                <label className="emp-label">Description</label>
                <div className="emp-description-box">
                  <p className="emp-text">{selectedTask.description}</p>
                </div>
              </div>

              <div className="emp-grid">
                {/* ✅ NEW: Assigned Date Field with Optional Chaining */}
                <div className="emp-item">
                  <label className="emp-label">
                    <History size={14} style={{ marginRight: "5px" }} />{" "}
                    Assigned Date
                  </label>
                  <div className="emp-value">
                    {/* ✅ FIX: Added ?. here to prevent crash */}
                    {selectedTask?.createdAt
                      ? new Date(selectedTask.createdAt).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>

                <div className="emp-item">
                  <label className="emp-label">
                    <CalendarDays size={14} style={{ marginRight: "5px" }} />{" "}
                    Due Date
                  </label>
                  <div className="emp-value">
                    {formatDate(selectedTask.dueDate)}
                  </div>
                </div>

                <div className="emp-item">
                  <label className="emp-label">
                    <CheckCircle size={14} style={{ marginRight: "5px" }} />{" "}
                    Action
                  </label>
                  <button
                    className={`emp-action-btn ${
                      selectedTask.status === "Completed"
                        ? "btn-undo"
                        : "btn-complete"
                    }`}
                    onClick={() =>
                      handleToggleTask(selectedTask._id, selectedTask.status)
                    }
                  >
                    {selectedTask.status === "Completed"
                      ? "Mark Incomplete"
                      : "Mark Complete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, ListTodo, CalendarDays, CheckCircle2, MapPin, 
  ArrowDown, ArrowUp, LogOut, User, AlertCircle, CheckCircle, Bell
} from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import './EmployeeDashboard.css'; 
import { toast } from 'react-toastify';

// --- CONFIGURATION ---
const API_BASE = 'http://localhost:4000/api';
const API_UPLOAD = 'http://localhost:4000/uploads';
const ATTENDANCE_URL = `${API_BASE}/attendance`;
const TASKS_URL = `${API_BASE}/tasks`;

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  
  const loggedUser = JSON.parse(localStorage.getItem("employeeUser") || '{}');
  const token = localStorage.getItem('employeeToken');
  const EMPLOYEE_ID = loggedUser?._id || loggedUser?.id;
  const EMPLOYEE_NAME = loggedUser?.name || "Employee";
  const EMPLOYEE_IMAGE = loggedUser?.image || null; // ✅ Get image from stored user data

  // --- State Management ---
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false); 
  
  // Clock State
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(true);
  
  // ✅ Notification tracking with useRef to persist across renders
  const previousTaskCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  
  // Last Session State
  const [lastSession, setLastSession] = useState({
    checkInTime: null,
    checkOutTime: null,
    taskDescription: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    const employeeToken = localStorage.getItem('employeeToken');
    const employeeUser = localStorage.getItem('employeeUser');
    
    if (!employeeToken || !employeeUser) {
      navigate('/');
    }
  }, [navigate]);

  // ✅ Request notification permission (IMPROVED)
  useEffect(() => {
    if (!('Notification' in window)) {
      console.error('❌ This browser does not support notifications');
      return;
    }
    
    setNotificationPermission(Notification.permission);
    
    // Auto-request permission if default
    if (Notification.permission === 'default') {
      console.log('Requesting notification permission...');
      Notification.requestPermission().then(permission => {
        console.log('Permission result:', permission);
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          console.log('✅ Notifications enabled!');
          new Notification('Notifications Enabled! 🎉', {
            body: 'You will now receive task notifications',
            icon: '/skitelogo.png',
            tag: 'welcome-notification'
          });
        }
      }).catch(err => {
        console.error('Permission request failed:', err);
      });
    }
  }, []);

  // --- Live Clock Effect ---
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // ✅ Function to show notification with custom audio alert
  const showNotification = (taskTitle, taskDescription) => {
    // Play custom notification sound
    try {
      const audio = new Audio('/notification-sound.mp3.wav');
      audio.volume = 0.9;
      audio.play()
        .then(() => console.log('✅ Notification sound played'))
        .catch(e => {
          console.error('❌ Audio play failed:', e);
          const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUA0PVqzn77BfGA==');
          beep.play().catch(() => console.log('Both audio sources failed'));
        });
    } catch (e) {
      console.error('❌ Audio error:', e);
    }
    
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported');
      alert('🎯 New Task: ' + taskTitle);
      return;
    }
    
    if (Notification.permission !== 'granted') {
      console.error('❌ Notification permission not granted');
      alert('🎯 New Task: ' + taskTitle + '\n' + taskDescription);
      return;
    }
    
    try {
      const notification = new Notification('🎯 New Task Assigned!', {
        body: `${taskTitle}\n${taskDescription}`,
        icon: '/skitelogo.png',
        badge: '/skitelogo.png',
        tag: 'new-task-' + Date.now(),
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200]
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error('❌ Notification error:', error);
        alert('🎯 New Task: ' + taskTitle);
      };

      setTimeout(() => {
        notification.close();
      }, 15000);
      
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      alert('🎯 New Task: ' + taskTitle + '\n' + taskDescription);
    }
  };

  // Format functions
  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrentDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return { hours: 0, minutes: 0 };
    const diffMs = new Date(end) - new Date(start);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

  // ✅ FETCH TASKS with proper notification logic
  const fetchTasks = async () => {
    if (!EMPLOYEE_ID) {
      console.log('❌ No EMPLOYEE_ID found');
      return;
    }
    
    try {
      const response = await fetch(`${TASKS_URL}/${EMPLOYEE_ID}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const tasksArray = Array.isArray(data) ? data : [];
        
        // ✅ Check for new tasks (only after first load)
        if (!isFirstLoadRef.current && tasksArray.length > previousTaskCountRef.current) {
          const newTasksCount = tasksArray.length - previousTaskCountRef.current;
          console.log(`🎉 DETECTED ${newTasksCount} NEW TASK(S)!`);
          
          const newTasks = tasksArray.slice(previousTaskCountRef.current);
          
          newTasks.forEach(task => {
            console.log('Showing notification for task:', task.title);
            showNotification(
              task.title,
              `Priority: ${task.priority} | Due: ${formatDate(task.dueDate)}`
            );
          });
        }
        
        previousTaskCountRef.current = tasksArray.length;
        setTasks(tasksArray);
        
        if (isFirstLoadRef.current) {
          isFirstLoadRef.current = false;
        }
      } else {
        const errText = await response.text();
        console.error("Failed to fetch tasks:", response.status, errText);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setTaskLoading(false);
    }
  };

  // ✅ Poll for new tasks every 10 seconds
  useEffect(() => {
    if (!EMPLOYEE_ID) return;
    
    fetchTasks();
    
    const interval = setInterval(() => {
      fetchTasks();
    }, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [EMPLOYEE_ID, token]);

  // --- TOGGLE TASK COMPLETION ---
  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    
    const originalTasks = [...tasks];
    setTasks(prevTasks => prevTasks.map(task => 
      task._id === taskId ? { ...task, status: newStatus } : task
    ));

    try {
      const url = `${TASKS_URL}/${taskId}/status`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
    } catch (error) {
      console.error("Error toggling task:", error);
      alert("Failed to update task status");
      setTasks(originalTasks);
    }
  };

  // --- Request notification permission button ---
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        new Notification('Success! 🎉', {
          body: 'Notifications are now enabled',
          icon: '/skitelogo.png'
        });
      } else {
        alert('Notification permission denied. Please enable it in your browser settings.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  // --- RECOVERY LOGIC (Attendance) ---
  useEffect(() => {
    if (!EMPLOYEE_ID) return;
    
    const checkActiveSession = async () => {
      try {
        const savedSession = JSON.parse(localStorage.getItem('activeAttendanceSession'));
        
        const response = await fetch(`${ATTENDANCE_URL}/status/${EMPLOYEE_ID}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.isCheckedIn) {
            const serverStartTime = new Date(data.checkInTime);
            setIsCheckedIn(true);
            setStartTime(serverStartTime);
            
            if (!savedSession || savedSession.userId !== EMPLOYEE_ID) {
              localStorage.setItem('activeAttendanceSession', JSON.stringify({
                userId: EMPLOYEE_ID,
                startTime: serverStartTime
              }));
            }
            return;
          }
        }
        
        if (savedSession && savedSession.userId === EMPLOYEE_ID) {
          const savedStartTime = new Date(savedSession.startTime);
          setIsCheckedIn(true);
          setStartTime(savedStartTime);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        const savedSession = JSON.parse(localStorage.getItem('activeAttendanceSession'));
        if (savedSession && savedSession.userId === EMPLOYEE_ID) {
          setIsCheckedIn(true);
          setStartTime(new Date(savedSession.startTime));
        }
      }
    };
    
    checkActiveSession();
  }, [EMPLOYEE_ID, token]);

  // --- ACTIONS ---
  const handleLogout = () => {
    localStorage.removeItem("employeeUser");
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("activeAttendanceSession");
    navigate('/'); 
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ATTENDANCE_URL}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: EMPLOYEE_ID })
      });

      const data = await response.json();

      if (!response.ok) {
        if(data.msg && data.msg.includes("already checked in")) {
           setIsCheckedIn(true);
           setStartTime(new Date()); 
           return;
        }
        
        alert(`Check-in failed: ${data.msg || 'Server Error'}`);
        return;
      }
      
      const sessionStartTime = new Date(data.checkInTime);
      setIsCheckedIn(true);
      setStartTime(sessionStartTime);
      
      setLastSession({
        checkInTime: null,
        checkOutTime: null,
        taskDescription: ''
      });
      
      toast.success(
        `🎉 Successfully Checked In! 
        Start Time: ${sessionStartTime.toLocaleTimeString()}`, 
        {
          duration: 4000,
          position: 'top-right',
        }
      );

      localStorage.setItem('activeAttendanceSession', JSON.stringify({
        userId: EMPLOYEE_ID,
        startTime: sessionStartTime
      }));

    } catch (error) {
      toast.error("❌ Network Error. Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!taskDescription.trim()) {
      toast("⚠️ Please enter a task description before checking out.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${ATTENDANCE_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          userId: EMPLOYEE_ID,
          taskDescription: taskDescription,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Check-out failed: ${data.msg || 'Server Error'}`);
        return;
      }

      const checkOutTime = new Date();
      setLastSession({
        checkInTime: startTime,
        checkOutTime: checkOutTime,
        taskDescription: taskDescription
      });

      toast.success(
        `👋 Checked Out successfully!
        Time: ${checkOutTime.toLocaleTimeString()}`, 
        {
          duration: 4000,
          position: 'top-right',
        }
      );

      setIsCheckedIn(false);
      setStartTime(null);
      setTaskDescription('');
      localStorage.removeItem('activeAttendanceSession');

    } catch (error) {
      toast.error("❌ Network Error. Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // --- STATS ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        
        {/* --- HEADER with Profile Image --- */}
        <header className="dashboard-header">
          <div className="welcome-text">
            {/* ✅ CHANGED: Replace UserCircle with actual profile image */}
            {EMPLOYEE_IMAGE ? (
              <img 
                src={`${API_UPLOAD}/${EMPLOYEE_IMAGE}`}
                alt={EMPLOYEE_NAME}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #3b82f6'
                }}
                onError={(e) => {
                  // Fallback to User icon if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* Placeholder icon (shown if no image or image fails) */}
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#e5e7eb',
                display: EMPLOYEE_IMAGE ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #3b82f6'
              }}
            >
              <User size={24} className="icon-blue" />
            </div>
            
            <span>Welcome, <strong>{EMPLOYEE_NAME}</strong></span>
          </div>
          
          {/* ✅ Notification Status & Controls */}
          {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
            <button 
              onClick={requestNotificationPermission}
              style={{
                padding: '8px 16px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Bell size={16} />
              Enable Notifications
            </button>
          )}
          
          <button className="btn-logout1" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </header>

        {/* --- Time Management --- */}
        <div className="card1 time-card">
          <div className="time-left-section">
            <div className="time-info">
              <div className="section-title">
                <Clock className="icon-blue" size={18} />
                <span>Current Time</span>
              </div>
              <div className="clock-display">
                <div className="clock-time">
                  {formatCurrentTime()}
                </div>
                <div className="clock-date">
                  {formatCurrentDate()}
                </div>
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
              <button className="btn-primary" onClick={handleCheckIn} disabled={loading}>
                {loading ? 'Checking In...' : <><Clock size={18} /> Check In</>}
              </button>
            ) : (
              <button className="btn-danger" onClick={handleCheckOut} disabled={loading}>
                {loading ? 'Checking Out...' : <><LogOut size={18} /> Check Out</>}
              </button>
            )}
          </div>
        </div>

        {/* --- Main Grid --- */}
        <div className="dashboard-grid">
          
          {/* TASKS COLUMN */}
          <div className="column-tasks">
            <div className="section-header">
              <ListTodo className="icon-blue" size={24} />
              <h2>My Tasks</h2>
            </div>
            
            <div className="card1 stats-row">
              <div className="stat-item">
                <p className="stat-number">{totalTasks}</p>
                <p className="stat-label">Total Assigned</p>
              </div>
              <div className="stat-item">
                <p className="stat-number text-green">{completedTasks}</p>
                <p className="stat-label">Completed</p>
              </div>
              <div className="stat-item">
                <p className="stat-number text-blue">{pendingTasks}</p>
                <p className="stat-label">Pending</p>
              </div>
            </div>
            
            <div className="card1 task-list">
              {taskLoading ? (
                <p style={{textAlign: 'center', padding: '30px', color: '#9ca3af'}}>Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <div style={{textAlign: 'center', padding: '30px', color: '#9ca3af', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}>
                  <AlertCircle />
                  <p>No tasks assigned yet.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task._id} className="task-item">
                    <div className="task-info">
                      <h3 style={{ 
                        textDecoration: task.status === 'Completed' ? 'line-through' : 'none', 
                        color: task.status === 'Completed' ? '#9ca3af' : 'inherit' 
                      }}>
                        {task.title}
                      </h3>
                      <div className="task-meta">
                        <CalendarDays size={14} />
                        <span>Due: {formatDate(task.dueDate)}</span>
                        {task.priority === 'High' && <span style={{color: '#ef4444', fontWeight:'bold', marginLeft:'5px'}}>! High Priority</span>}
                      </div>
                    </div>
                    <div className="task-actions">
                      <span className={`status-badge ${task.status === 'Completed' ? 'status-success' : 'status-pending'}`}>
                        {task.status}
                      </span>
                      <button 
                        className="check-btn" 
                        onClick={() => handleToggleTask(task._id, task.status)}
                      >
                        {task.status === 'Completed' ? (
                          <div className="circle-filled"><CheckCircle2 size={24} /></div>
                        ) : (
                          <div className="circle-outline"><CheckCircle2 size={24} /></div>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ATTENDANCE COLUMN */}
          <div className="column-attendance">
            <div className="section-header">
              <CalendarDays className="icon-blue" size={24} />
              <h2>Today's Session</h2>
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
                      <span>Check In: <strong>{formatTime(startTime)}</strong></span>
                    </div>
                    <div className="att-row">
                      <Clock size={16} />
                      <span>Duration: <strong>{calculateDuration(startTime, new Date()).hours}h {calculateDuration(startTime, new Date()).minutes}m</strong></span>
                    </div>
                    <div className="att-location">
                      <MapPin size={14} />
                      <span>Office (Active)</span>
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
                      <span>Check In: <strong>{formatTime(lastSession.checkInTime)}</strong></span>
                    </div>
                    <div className="att-row">
                      <ArrowUp size={18} className="icon-out" />
                      <span>Check Out: <strong>{formatTime(lastSession.checkOutTime)}</strong></span>
                    </div>
                    <div className="att-row">
                      <Clock size={16} />
                      <span>Duration: <strong>{calculateDuration(lastSession.checkInTime, lastSession.checkOutTime).hours}h {calculateDuration(lastSession.checkInTime, lastSession.checkOutTime).minutes}m</strong></span>
                    </div>
                    {lastSession.taskDescription && (
                      <div className="task-summary">
                        <CheckCircle size={14} className="icon-summary" />
                        <span>Task: <strong>{lastSession.taskDescription}</strong></span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="att-empty">
                  <Clock size={24} className="icon-empty" />
                  <p>Not checked in today</p>
                  <p className="att-empty-sub">Click "Check In" to start your workday</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
        <Outlet />
      </div>
      
    </div>
  );
};

export default EmployeeDashboard;
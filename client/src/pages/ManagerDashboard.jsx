import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, UserCheck, ArrowRight, LogOut, 
  Briefcase, Users, FileText, ScrollText,
  ReceiptText, PlayCircle, StopCircle, CalendarPlus,
  X, BadgeCheck, Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';
import { API_BASE } from '../api';
import './ManagerDashboard.css';

const ATTENDANCE_URL = `${API_BASE}/attendance`;
const LEAVE_URL = `${API_BASE}/leaves`;

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('managerUser') || '{}');
  const token = localStorage.getItem('managerToken');
  const MANAGER_ID = user?._id || user?.id;
  const MANAGER_NAME = user?.name || 'Manager';
  const MANAGER_DESIGNATION = user?.designation || 'Manager';

  // --- MANAGER LEVEL CHECK ---
  const isHighLevelManager = 
    user?.role?.toLowerCase() === 'manager' && 
    user?.designation?.toLowerCase() === 'manager';

  // --- ATTENDANCE STATE ---
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [attLoading, setAttLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastSession, setLastSession] = useState({ checkInTime: null });

  // --- TODAY STATUS STATE ---
  const [todayWorkHours, setTodayWorkHours] = useState(0);
  const [payrollStatus, setPayrollStatus] = useState('Absent');

  // --- LEAVE STATE ---
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveData, setLeaveData] = useState({ 
    fromDate: '', toDate: '', reason: '', leaveType: 'Sick Leave' 
  });
  const [leaveLoading, setLeaveLoading] = useState(false);

  // --- CLOCK ---
  useEffect(() => {
    const i = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // --- CHECK ACTIVE SESSION ---
  useEffect(() => {
    if (!MANAGER_ID || !token) return;
    const checkSession = async () => {
      try {
        const res = await fetch(`${ATTENDANCE_URL}/status/${MANAGER_ID}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.isCheckedIn) {
            setIsCheckedIn(true);
            setStartTime(new Date(data.checkInTime));
            return;
          }
          if (data.lastSession) setLastSession(data.lastSession);
        }
      } catch (err) { console.error(err); }
    };
    checkSession();
  }, [MANAGER_ID, token]);

  // --- CALCULATE TODAY STATUS ---
  const calculateDailyStatus = async () => {
    if (!MANAGER_ID) return;
    try {
      const res = await fetch(`${ATTENDANCE_URL}/${MANAGER_ID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const history = await res.json();
        const todayStr = new Date().toDateString();
        const todayRecords = Array.isArray(history) 
          ? history.filter(r => new Date(r.checkInTime).toDateString() === todayStr) 
          : [];

        let totalMillis = 0;
        let ruleViolation = false;

        todayRecords.forEach(r => {
          if (r.checkOutTime) {
            const inTime = new Date(r.checkInTime);
            const outTime = new Date(r.checkOutTime);
            if (inTime.toDateString() !== outTime.toDateString()) ruleViolation = true;
            if (outTime.getHours() >= 21) ruleViolation = true;
            totalMillis += outTime - inTime;
          }
        });

        if (isCheckedIn && startTime) {
          const now = new Date();
          const start = new Date(startTime);
          if (start.toDateString() === todayStr) {
            totalMillis += now - start;
            if (now.getHours() >= 21) ruleViolation = true;
          }
        }

        const hours = totalMillis / (1000 * 60 * 60);
        setTodayWorkHours(hours);

        if (ruleViolation) setPayrollStatus('Absent ❌');
        else if (hours >= 6) setPayrollStatus('Present');
        else if (hours >= 3) setPayrollStatus('Half Day');
        else setPayrollStatus('Absent / Short');
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    calculateDailyStatus();
    const interval = setInterval(calculateDailyStatus, 60000);
    return () => clearInterval(interval);
  }, [MANAGER_ID, isCheckedIn, startTime]);

  // --- CHECK IN ---
  const handleCheckIn = async () => {
    setAttLoading(true);
    try {
      const res = await fetch(`${ATTENDANCE_URL}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: MANAGER_ID })
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.msg || 'Check In Failed'); return; }
      setIsCheckedIn(true);
      setStartTime(new Date(data.checkInTime));
      calculateDailyStatus();
      toast.success('Checked In Successfully!');
    } catch (err) { toast.error('Network Error'); } 
    finally { setAttLoading(false); }
  };

  // --- CHECK OUT ---
  const handleCheckOut = async () => {
    if (!taskDescription.trim()) { 
      toast.warning('⚠️ Enter work summary to checkout.'); 
      return; 
    }
    const now = new Date();
    if (now.getHours() >= 21) toast.error('Late Checkout (After 9 PM). Marked as Absent.');
    
    setAttLoading(true);
    try {
      await fetch(`${ATTENDANCE_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: MANAGER_ID, taskDescription })
      });
      setIsCheckedIn(false);
      setStartTime(null);
      setTaskDescription('');
      setLastSession({ checkInTime: new Date() });
      calculateDailyStatus();
      toast.success('Checked Out Successfully!');
    } catch (err) { toast.error('Network Error'); } 
    finally { setAttLoading(false); }
  };

  // --- LEAVE SUBMIT ---
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveData.fromDate || !leaveData.toDate || !leaveData.reason) {
      toast.error('Please fill all fields');
      return;
    }
    setLeaveLoading(true);
    const templateParams = {
      from_name: MANAGER_NAME,
      designation: MANAGER_DESIGNATION,
      leave_type: leaveData.leaveType,
      from_date: leaveData.fromDate,
      to_date: leaveData.toDate,
      reason: leaveData.reason,
      to_email: 'walkalan28@gmail.com'
    };
    try {
      await fetch(`${LEAVE_URL}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          ...leaveData, 
          userId: MANAGER_ID, 
          name: MANAGER_NAME, 
          designation: MANAGER_DESIGNATION 
        })
      });
      const emailRes = await emailjs.send(
        'service_ythjnuq',
        'template_qtl1hoh',
        templateParams,
        'ExKCl2ZACI_vbkRBo'
      );
      if (emailRes.status === 200) {
        toast.success('Leave Request Sent! ✅');
        setIsLeaveModalOpen(false);
        setLeaveData({ fromDate: '', toDate: '', reason: '', leaveType: 'Sick Leave' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting leave request');
    } finally { setLeaveLoading(false); }
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem('managerToken');
    localStorage.removeItem('managerUser');
    navigate('/', { replace: true });
  };

  // --- DURATION CALC ---
  const calculateDuration = (start) => {
    if (!start) return { h: 0, m: 0 };
    const diff = new Date() - new Date(start);
    return { h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000) };
  };

  // --- NAVIGATION CARDS ---
  const managerActions = [
    {
      title: "Task Management",
      desc: "Assign and track tasks for Developers & SEO interns",
      icon: <ClipboardList size={32} />,
      path: "/manager-dashboard/tasks",
      color: "#4f46e5"
    },
    {
      title: "Attendance",
      desc: "Monitor daily check-ins and performance",
      icon: <UserCheck size={32} />,
      path: isHighLevelManager ? "/admin-dashboard/attendance" : "/manager-dashboard/attendance",
      color: "#10b981"
    }
  ];

  if (isHighLevelManager) {
    managerActions.push(
      {
        title: "Projects",
        desc: "Manage and track all ongoing business projects",
        icon: <Briefcase size={32} />,
        path: "/admin-dashboard/projects",
        color: "#f59e0b"
      },
      {
        title: "Leads",
        desc: "Track potential client inquiries and conversions",
        icon: <Users size={32} />,
        path: "/admin-dashboard/leads",
        color: "#ec4899"
      },
      {
        title: "Quote",
        desc: "View and manage business service quotes",
        icon: <ScrollText size={32} />,
        path: "/admin-dashboard/quote",
        color: "#8b5cf6"
      },
      {
        title: "Payment Receipt",
        desc: "Generate and manage payment receipts",
        icon: <ReceiptText size={32} />,
        path: "/admin-dashboard/receipt",
        color: "#e11d48"
      }
    );
  }

  return (
    <div className="manager-container">

      {/* HEADER */}
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manager Control Center</h1>
          <p>Welcome back, <strong>{MANAGER_NAME}</strong> ({MANAGER_DESIGNATION})</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      {/* ✅ SECTION 1: ATTENDANCE + STATUS */}
      <div style={{ 
        background: 'white', borderRadius: '16px', padding: '24px', 
        marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="#FF4500" /> My Attendance
        </h2>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

          {/* CLOCK + CHECK IN/OUT */}
          <div style={{ 
            flex: '1', minWidth: '280px', background: isCheckedIn ? '#f0fdf4' : '#fafafa', 
            borderRadius: '12px', padding: '20px', border: `2px solid ${isCheckedIn ? '#86efac' : '#e5e7eb'}`
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: '8px' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {isCheckedIn ? (
                <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '14px' }}>
                  ● Live: {calculateDuration(startTime).h}h {calculateDuration(startTime).m}m
                </span>
              ) : (
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>● Currently Offline</span>
              )}
            </div>

            {isCheckedIn ? (
              <>
                <input
                  type="text"
                  placeholder="Work Summary / Note..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  style={{ 
                    width: '100%', padding: '10px', borderRadius: '8px', 
                    border: '1px solid #ddd', marginBottom: '12px', fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={handleCheckOut}
                  disabled={attLoading}
                  style={{ 
                    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                    background: '#ef4444', color: 'white', fontWeight: '600', fontSize: '15px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <StopCircle size={18} /> {attLoading ? '...' : 'Check Out'}
                </button>
              </>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={attLoading}
                style={{ 
                  width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                  background: '#FF4500', color: 'white', fontWeight: '600', fontSize: '15px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <PlayCircle size={18} /> {attLoading ? '...' : 'Check In'}
              </button>
            )}
          </div>

          {/* TODAY STATUS */}
          <div style={{ 
            flex: '1', minWidth: '200px', background: '#fafafa', 
            borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px'
          }}>
            <BadgeCheck size={32} color="#FF4500" />
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {todayWorkHours.toFixed(1)} <span style={{ fontSize: '1rem', color: '#888' }}>hrs</span>
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>Total Work Today</div>
            <div style={{ 
              padding: '6px 16px', borderRadius: '20px', fontWeight: '600', fontSize: '14px',
              backgroundColor: payrollStatus === 'Present' ? '#e8f5e9' : payrollStatus === 'Half Day' ? '#fff3e0' : '#ffebee',
              color: payrollStatus === 'Present' ? '#2e7d32' : payrollStatus === 'Half Day' ? '#ef6c00' : '#c62828',
              border: `1px solid ${payrollStatus === 'Present' ? '#c8e6c9' : payrollStatus === 'Half Day' ? '#ffe0b2' : '#ffcdd2'}`
            }}>
              {payrollStatus === 'Present' ? '✅ Present' : payrollStatus === 'Half Day' ? '⚠️ Half Day' : '❌ Absent'}
            </div>

            {/* LEAVE BUTTON */}
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              style={{
                background: '#fff',
                color: '#ef4444',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid #fecaca' 
      }}
            >
              <CalendarPlus size={16} /> Request Leave
            </button>

            {lastSession?.checkInTime && (
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Last Check-in: {new Date(lastSession.checkInTime).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ SECTION 2: NAVIGATION CARDS */}
      <div style={{ 
        background: 'white', borderRadius: '16px', padding: '24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '20px' }}>
          Quick Actions
        </h2>
        <div className="manager-actions-grid">
          {managerActions.map((action, index) => (
            <div key={index} className="action-card" onClick={() => navigate(action.path)}>
              <div className="action-icon" style={{ backgroundColor: action.color + '20', color: action.color }}>
                {action.icon}
              </div>
              <div className="action-info">
                <h3>{action.title}</h3>
                <p>{action.desc}</p>
              </div>
              <ArrowRight className="arrow-icon" />
            </div>
          ))}
        </div>
      </div>

      {/* ✅ LEAVE MODAL */}
      {isLeaveModalOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setIsLeaveModalOpen(false)}
        >
          <div 
            style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Request Leave</h3>
              <button onClick={() => setIsLeaveModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit}>
              {/* LEAVE TYPE */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Leave Type</label>
                <select
                  value={leaveData.leaveType}
                  onChange={(e) => setLeaveData({ ...leaveData, leaveType: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                >
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave (Paid)</option>
                  <option value="Permission">Permission</option>
                </select>
              </div>

              {/* FROM / TO DATE */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>From Date</label>
                  <input
                    type="date" required value={leaveData.fromDate}
                    onChange={(e) => setLeaveData({ ...leaveData, fromDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>To Date</label>
                  <input
                    type="date" required value={leaveData.toDate}
                    onChange={(e) => setLeaveData({ ...leaveData, toDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* REASON */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Reason</label>
                <textarea
                  rows="3" required placeholder="Reason for leave..."
                  value={leaveData.reason}
                  onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit" disabled={leaveLoading}
                style={{ 
                  width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                  background: '#FF4500', color: 'white', fontWeight: '600', fontSize: '15px', cursor: 'pointer'
                }}
              >
                {leaveLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerDashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Attendance.css';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, X, ChevronLeft, ChevronRight, Calendar, 
  ListChecks, Search, Filter 
} from 'lucide-react';
import Leaves from '../components/Leaves'; // ✅ Import Leaves Component
import { API_BASE } from '../api';

const Attendance = () => {
  const navigate = useNavigate();
  
  // AUTH
  const adminToken = localStorage.getItem('adminToken');
  const managerToken = localStorage.getItem('managerToken');
  const employeeToken = localStorage.getItem('employeeToken');
  const token = adminToken || managerToken || employeeToken; 

  const managerUser = JSON.parse(localStorage.getItem('managerUser'));
  const isManager = !!managerUser;
  const allowedDesignations = ['Web Developer', 'Web Developer(intern)', 'SEO(intern)'];

  // ✅ ACTIVE TAB STATE
  const [activeTab, setActiveTab] = useState('attendance'); 

  // STATE
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  // FILTERS (Attendance)
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ✅ NEW STATE: LEAVE BADGE & FILTERS
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leaveMonth, setLeaveMonth] = useState("");

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- NEW: FETCH PENDING LEAVES FOR BADGE ---
  const fetchPendingLeavesCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/leaves/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const pending = Array.isArray(data) ? data.filter(l => l.status === 'Pending').length : 0;
        setPendingLeavesCount(pending);
      }
    } catch (err) { console.error("Badge Fetch Error", err); }
  };

  useEffect(() => {
    if (token) fetchPendingLeavesCount();
  }, [token, activeTab]);

  // --- FETCH DATA LOGIC (Exactly as your code) ---
  useEffect(() => {
    const fetchAttendance = async () => {
        try {
            if (!token) {
                setError("No authentication token found.");
                setLoading(false);
                return;
            }

            const storedUser = JSON.parse(localStorage.getItem('employeeUser') || localStorage.getItem('adminUser') || '{}');
            const designation = (storedUser?.designation || "").toLowerCase();
            const isContentWriter = designation.includes("content writ");
            const isAdmin = !!adminToken;

            let url = `${API_BASE}/attendance/all`;
            
            if (!isAdmin && !isContentWriter) {
                url = `${API_BASE}/attendance/${storedUser._id || storedUser.id}`;
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAttendance(Array.isArray(data) ? data : []);
            } else {
                const errorData = await response.json();
                setError(errorData.msg || "Failed to fetch records.");
            }

            setLoading(false);
        } catch (err) {
            console.error('Fetch error:', err);
            setError("Network error.");
            setLoading(false);
        }
    };

    if (activeTab === 'attendance') {
        fetchAttendance();
    }
  }, [navigate, token, activeTab, adminToken]);

  // FILTER LOGIC (Exactly as your code)
  useEffect(() => {
    let result = attendance;

    if (isManager) {
      result = result.filter((row) => {
        const designation = row.designation || row.employeeDesignation || (row.userId && row.userId.designation);
        return allowedDesignations.includes(designation);
      });
    }

    if (searchTerm) {
      result = result.filter((row) =>
        (row.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      result = result.filter((row) => new Date(row.checkIn) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter((row) => new Date(row.checkIn) <= to);
    }

    setFilteredAttendance(result);
    setCurrentPage(1); 
  }, [attendance, searchTerm, fromDate, toDate, isManager]);

  // PAGINATION CALCULATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAttendance.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  // HELPERS
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : "N/A";
  const formatTime = (dateString) => dateString ? new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn) return { text: "0h 0m", hours: 0, isAbsent: false, reason: "" };
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date(); 
    if (checkOut && start.toDateString() !== end.toDateString()) {
        return { text: "Date Mismatch", hours: 0, isAbsent: true, reason: "Next Day Checkout" };
    }
    if (checkOut && end.getHours() >= 21) { 
         return { text: "Late Checkout", hours: 0, isAbsent: true, reason: "After 9 PM" };
    }
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / 3600000); 
    const diffMins = Math.floor((diffMs % 3600000) / 60000); 
    return { text: `${diffHrs}h ${diffMins}m`, hours: diffMs / 3600000, isAbsent: false };
  };

  const renderStatusBadge = (hours, isAbsent, reason) => {
      if (isAbsent) return <span style={{backgroundColor:'#fef2f2', color:'#991b1b', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}} title={reason}>Absent</span>;
      if (hours >= 6) return <span style={{backgroundColor:'#d1fae5', color:'#065f46', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}}>Present</span>;
      if (hours >= 3) return <span style={{backgroundColor:'#ffedd5', color:'#9a3412', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}}>Half Day</span>;
      return <span style={{backgroundColor:'#fee2e2', color:'#991b1b', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}}>Short</span>;
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Report", 14, 15);
    const tableRows = filteredAttendance.map(row => {
        const { text, hours, isAbsent, reason } = calculateDuration(row.checkIn, row.checkOut);
        let statusText = isAbsent ? `Absent (${reason})` : hours >= 6 ? "Present" : hours >= 3 ? "Half Day" : "Short";
        return [row.employeeName, formatDate(row.checkIn), formatTime(row.checkIn), row.checkOut ? formatTime(row.checkOut) : "Active", isAbsent ? "—" : text, statusText];
    });
    autoTable(doc, { head: [["Employee", "Date", "In", "Out", "Duration", "Status"]], body: tableRows, startY: 20 });
    doc.save("attendance.pdf");
  };

  const deleteSingleRecord = async (id) => {
     try {
       await fetch(`${API_BASE}/attendance/deleterec/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
       return true;
     } catch(e) { return false; }
  };

  const deleteAllFilteredRecords = async () => {
    if(!window.confirm(`Delete ${filteredAttendance.length} records?`)) return;
    setIsDeleting(true);
    const ids = filteredAttendance.map(r => r._id);
    for(let id of ids) await deleteSingleRecord(id);
    setAttendance(prev => prev.filter(item => !ids.includes(item._id)));
    setIsDeleting(false);
    toast.success("Deleted records");
  };

  return (
    <div className="attendance-page1">
      <button className="modern-back-btn" 
              style={{
                  display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e0e0e0',
                  padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                  color: '#4b5563', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#FF4500';
                  e.currentTarget.style.color = '#FF4500';
                  e.currentTarget.style.backgroundColor = '#fff5f5';
                  e.currentTarget.style.transform = 'translateX(-3px)';
              }}
              onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.color = '#4b5563';
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.transform = 'translateX(0)';
              }} onClick={() => navigate(isManager ? "/manager-dashboard" : "/admin-dashboard")}>
        <ArrowLeft size={20} /> Back
      </button>

      <h2 className="page-title">Attendance & Leave Management</h2>

      {/* ✅ TAB NAVIGATION WITH NOTIFICATION BADGE */}
      <div style={{display:'flex', gap:'20px', borderBottom:'2px solid #eee', marginBottom:'20px'}}>
          <button 
            onClick={() => setActiveTab('attendance')}
            style={{
                padding:'10px 20px', 
                borderBottom: activeTab === 'attendance' ? '3px solid #FF4500' : 'none',
                color: activeTab === 'attendance' ? '#FF4500' : '#666',
                fontWeight: 'bold', cursor:'pointer', background:'none', borderTop:'none', borderLeft:'none', borderRight:'none',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}>
            <ListChecks size={18} /> Attendance Logs
          </button>
          <button 
            onClick={() => setActiveTab('leaves')}
            style={{
                padding:'10px 20px', 
                borderBottom: activeTab === 'leaves' ? '3px solid #FF4500' : 'none',
                color: activeTab === 'leaves' ? '#FF4500' : '#666',
                fontWeight: 'bold', cursor:'pointer', background:'none', borderTop:'none', borderLeft:'none', borderRight:'none',
                display: 'flex', alignItems: 'center', gap: '8px', position: 'relative'
            }}>
            <Calendar size={18} /> Leave Requests
            {/* ✅ DYNAMIC NOTIFICATION BADGE */}
            {pendingLeavesCount > 0 && (
              <span style={{
                position: 'absolute', top: '0', right: '-5px', background: '#ef4444',
                color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px'
              }}>
                {pendingLeavesCount}
              </span>
            )}
          </button>
      </div>

      {/* ✅ CONDITIONAL CONTENT */}
      {activeTab === 'leaves' ? (
          <>
            {/* ✅ NEW: LEAVE FILTERS */}
            <div className="filter-container1" style={{marginBottom:'20px', background:'#f9fafb', padding:'15px', borderRadius:'10px'}}>
              <div className="filter-inputs" style={{display:'flex', gap:'15px'}}>
                <div style={{display:'flex', alignItems:'center', background:'white', border:'1px solid #ddd', padding:'5px 10px', borderRadius:'8px'}}>
                  <Search size={16} color="#888" />
                  <input 
                    type="text" placeholder="Search Name..." value={leaveSearch} 
                    onChange={(e) => setLeaveSearch(e.target.value)} 
                    style={{border:'none', outline:'none', padding:'5px', marginLeft:'5px'}}
                  />
                </div>
                <select 
                  value={leaveMonth} onChange={(e) => setLeaveMonth(e.target.value)}
                  style={{padding:'8px', borderRadius:'8px', border:'1px solid #ddd'}}
                >
                  <option value="">All Months</option>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, index) => (
                    <option key={m} value={index}>{m}</option>
                  ))}
                </select>
                <button onClick={() => {setLeaveSearch(""); setLeaveMonth("");}} className="clear-btn">Reset</button>
              </div>
            </div>
            <Leaves searchTerm={leaveSearch} filterMonth={leaveMonth} />
          </>
      ) : (
          <>
            {/* EXISTING ATTENDANCE CONTENT (Exactly as your code) */}
            <div className="filter-container1">
                <div className="filter-inputs">
                <input type="text" placeholder="Search Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="date-input" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="date-input" />
                <button onClick={() => {setSearchTerm(""); setFromDate(""); setToDate("");}} className="clear-btn">Clear</button>
                </div>
                <div className="action-buttons">
                {!isManager && <button className="delete-btn" onClick={deleteAllFilteredRecords} disabled={isDeleting}>{isDeleting ? "..." : "Delete All"}</button>}
                <button onClick={downloadPDF} className="download-btn">Download PDF</button>
                </div>
            </div>

            {loading ? <div style={{padding:'20px', textAlign:'center'}}>Loading Attendance...</div> : (
                <div className="table-container">
                    <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>EMPLOYEE</th>
                            <th>DATE</th>
                            <th>IN</th>
                            <th>OUT</th>
                            <th>DURATION</th>
                            <th>STATUS</th>
                            <th>TASK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                        <tr><td colSpan="7" className="text-center">No records.</td></tr>
                        ) : (
                        currentItems.map((row) => {
                            const { text, hours, isAbsent, reason } = calculateDuration(row.checkIn, row.checkOut);
                            return (
                                <tr key={row._id} onClick={() => {setSelectedAttendance(row); setIsModalOpen(true);}} className="att-clickable-row">
                                <td><strong>{row.employeeName}</strong><br/><small>{row.designation}</small></td>
                                <td>{formatDate(row.checkIn)}</td>
                                <td className="text-green">{formatTime(row.checkIn)}</td>
                                <td className={row.checkOut ? "text-red" : "text-blue"}>{row.checkOut ? formatTime(row.checkOut) : "Active"}</td>
                                <td style={{fontWeight:'bold', color: isAbsent ? '#991b1b' : '#555'}}>{isAbsent ? "—" : text}</td>
                                <td>{renderStatusBadge(hours, isAbsent, reason)}</td>
                                <td className="td-task">{row.taskDescription || "—"}</td>
                                </tr>
                            );
                        })
                        )}
                    </tbody>
                    </table>
                </div>
            )}

            {filteredAttendance.length > 0 && (
                <div className="pagination-container" style={{display:'flex', justifyContent:'flex-end', marginTop:'15px', gap:'10px'}}>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={goToPrevPage} disabled={currentPage===1} style={{padding:'5px 10px'}}><ChevronLeft/></button>
                <button onClick={goToNextPage} disabled={currentPage===totalPages} style={{padding:'5px 10px'}}><ChevronRight/></button>
                </div>
            )}
          </>
      )}

      {/* DETAIL MODAL (Exactly as your code) */}
      {isModalOpen && selectedAttendance && (
        <div className="att-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="att-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="att-modal-header"><h3>Details</h3><button onClick={() => setIsModalOpen(false)}><X/></button></div>
            <div className="att-modal-content">
               <h3>{selectedAttendance.employeeName}</h3>
               <p>Date: {formatDate(selectedAttendance.checkIn)}</p>
               {(() => {
                   const { text, isAbsent, reason } = calculateDuration(selectedAttendance.checkIn, selectedAttendance.checkOut);
                   return (
                       <>
                         <p>Work Duration: <strong>{isAbsent ? "—" : text}</strong></p>
                         <p>Status: <strong>{isAbsent ? `Absent (${reason})` : "Present / Half Day"}</strong></p>
                       </>
                   );
               })()}
               <p>Task: {selectedAttendance.taskDescription}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
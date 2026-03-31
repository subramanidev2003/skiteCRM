import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Attendance.css';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, X, ChevronLeft, ChevronRight, Calendar, 
  ListChecks, Search, Filter, Briefcase 
} from 'lucide-react';
import Leaves from '../components/Leaves'; 
import { API_BASE } from '../api';

const Attendance = () => {
  const navigate = useNavigate();
  
  // AUTH
  const adminToken = localStorage.getItem('adminToken');
  const managerToken = localStorage.getItem('managerToken');
  const employeeToken = localStorage.getItem('employeeToken');
  const token = adminToken || managerToken || employeeToken; 

  const managerUser = JSON.parse(localStorage.getItem('managerUser') || '{}');
  const isManager = !!managerToken;
  const allowedDesignations = ['Web Developer', 'Web Developer(intern)', 'SEO(intern)'];

  // ✅ ACTIVE TAB STATE
  const [activeTab, setActiveTab] = useState('attendance'); 

  // STATE
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // ✅ CL SUMMARY STATES (Added as per logic)
  const [clSummary, setClSummary] = useState([]);
  const [clLoading, setClLoading] = useState(false);
  const [clFromDate, setClFromDate] = useState("");
  const [clToDate, setClToDate] = useState("");

  // MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  // FILTERS
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // LEAVE BADGE & FILTERS
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leaveMonth, setLeaveMonth] = useState("");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- FETCH PENDING LEAVES FOR BADGE ---
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

  // --- FETCH ATTENDANCE DATA ---
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
            setError("Network error.");
            setLoading(false);
        }
  };

  // --- ✅ NEW: CL SUMMARY LOGIC (Grouping All Employees) ---
  const fetchCLSummary = async () => {
    setClLoading(true);
    try {
      const [empRes, leaveRes] = await Promise.all([
        fetch(`${API_BASE}/user/all`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/leaves/cl-reports?from=${clFromDate}&to=${clToDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      const employees = await empRes.json();
      const leaves = await leaveRes.json();

      const allUsers = employees.employees || employees.users || employees || [];
      const approvedCLs = Array.isArray(leaves) ? leaves : [];

      // Grouping by User ID to sum days
      const aggregated = allUsers.map(user => {
        const userLeaves = approvedCLs.filter(l => (l.userId?._id || l.userId) === user._id);
        const total = userLeaves.reduce((acc, curr) => {
          const s = new Date(curr.fromDate);
          const e = new Date(curr.toDate);
          return acc + (Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
        }, 0);
        return { id: user._id, name: user.name, designation: user.designation, totalCL: total };
      });
      setClSummary(aggregated);
    } catch (err) { 
        console.error("CL Summary Error", err); 
    } finally { 
        setClLoading(false); 
    }
  };

  useEffect(() => {
    if (token) {
      fetchPendingLeavesCount();
      if (activeTab === 'attendance') fetchAttendance();
      if (activeTab === 'cl-management') fetchCLSummary();
    }
  }, [token, activeTab, clFromDate, clToDate]);

  // FILTER LOGIC
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
        (row.employeeName || row.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      result = result.filter((row) => new Date(row.checkInTime || row.date) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter((row) => new Date(row.checkInTime || row.date) <= to);
    }
    setFilteredAttendance(result);
    setCurrentPage(1); 
  }, [attendance, searchTerm, fromDate, toDate, isManager]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAttendance.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  // --- HELPERS ---
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : "N/A";
  
  const formatTime = (row, type) => {
      if (row.isCL) return type === 'in' ? "09:30 AM" : "06:30 PM";
      const timeVal = type === 'in' ? row.checkInTime || row.checkIn : row.checkOutTime || row.checkOut;
      return timeVal ? new Date(timeVal).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : (type === 'in' ? "--:--" : "Active");
  };

  const calculateDuration = (row) => {
    if (row.isCL) return { text: "9h 0m", hours: 9, isAbsent: false, reason: "Casual Leave" };
    const checkIn = row.checkInTime || row.checkIn;
    const checkOut = row.checkOutTime || row.checkOut;
    if (!checkIn) return { text: "0h 0m", hours: 0, isAbsent: false, reason: "" };
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date(); 
    if (checkOut && start.toDateString() !== end.toDateString()) return { text: "Date Mismatch", hours: 0, isAbsent: true, reason: "Next Day Checkout" };
    if (checkOut && end.getHours() >= 21) return { text: "Late Checkout", hours: 0, isAbsent: true, reason: "After 9 PM" };
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / 3600000); 
    const diffMins = Math.floor((diffMs % 3600000) / 60000); 
    return { text: `${diffHrs}h ${diffMins}m`, hours: diffMs / 3600000, isAbsent: false };
  };

  const renderStatusBadge = (row) => {
      const { hours, isAbsent, reason } = calculateDuration(row);
      if (row.isCL) return <span style={{backgroundColor:'#e0f2fe', color:'#0369a1', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}}>Present (CL)</span>;
      if (isAbsent) return <span style={{backgroundColor:'#fef2f2', color:'#991b1b', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}} title={reason}>Absent</span>;
      if (hours >= 6) return <span style={{backgroundColor:'#d1fae5', color:'#065f46', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}}>Present</span>;
      if (hours >= 3) return <span style={{backgroundColor:'#ffedd5', color:'#9a3412', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}}>Half Day</span>;
      return <span style={{backgroundColor:'#fee2e2', color:'#991b1b', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}}>Short</span>;
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Report", 14, 15);
    const tableRows = filteredAttendance.map(row => {
        const { text, hours, isAbsent, reason } = calculateDuration(row);
        let statusText = row.isCL ? "Present (CL)" : (isAbsent ? `Absent (${reason})` : hours >= 6 ? "Present" : hours >= 3 ? "Half Day" : "Short");
        return [row.employeeName || row.name, formatDate(row.checkInTime || row.date), formatTime(row, 'in'), formatTime(row, 'out'), text, statusText];
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
              style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e0e0e0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#4b5563'}}
              onClick={() => navigate(managerToken ? "/manager-dashboard" : "/admin-dashboard")}>
        <ArrowLeft size={20} /> Back
      </button>

      <h2 className="page-title">Attendance & Leave Management</h2>

      {/* ✅ TAB NAVIGATION (Original UI) */}
      <div style={{display:'flex', gap:'20px', borderBottom:'2px solid #eee', marginBottom:'20px'}}>
          <button onClick={() => setActiveTab('attendance')} style={{padding:'10px 20px', borderBottom: activeTab === 'attendance' ? '3px solid #FF4500' : 'none', color: activeTab === 'attendance' ? '#FF4500' : '#666', fontWeight: 'bold', cursor:'pointer', background:'none', border:'none', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <ListChecks size={18} /> Attendance Logs
          </button>
          <button onClick={() => setActiveTab('leaves')} style={{padding:'10px 20px', borderBottom: activeTab === 'leaves' ? '3px solid #FF4500' : 'none', color: activeTab === 'leaves' ? '#FF4500' : '#666', fontWeight: 'bold', cursor:'pointer', background:'none', border:'none', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative'}}>
            <Calendar size={18} /> Leave Requests
            {pendingLeavesCount > 0 && <span style={{position: 'absolute', top: '0', right: '-5px', background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px'}}>{pendingLeavesCount}</span>}
          </button>
          <button onClick={() => setActiveTab('cl-management')} style={{padding:'10px 20px', borderBottom: activeTab === 'cl-management' ? '3px solid #FF4500' : 'none', color: activeTab === 'cl-management' ? '#FF4500' : '#666', fontWeight: 'bold', cursor:'pointer', background:'none', border:'none', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Briefcase size={18} /> CL Summary
          </button>
      </div>

      {activeTab === 'attendance' ? (
          <>
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
                    <thead><tr><th>EMPLOYEE</th><th>DATE</th><th>IN</th><th>OUT</th><th>DURATION</th><th>STATUS</th><th>TASK</th></tr></thead>
                    <tbody>
                        {currentItems.length === 0 ? (<tr><td colSpan="7" className="text-center">No records.</td></tr>) : (
                        currentItems.map((row) => {
                            const { text } = calculateDuration(row);
                            return (
                                <tr key={row._id} onClick={() => {setSelectedAttendance(row); setIsModalOpen(true);}} className="att-clickable-row">
                                <td><strong>{row.employeeName || row.name}</strong><br/><small>{row.designation}</small></td>
                                <td>{formatDate(row.checkInTime || row.date)}</td>
                                <td className="text-green">{formatTime(row, 'in')}</td>
                                <td className={row.checkOutTime || row.checkOut ? "text-red" : "text-blue"}>{formatTime(row, 'out')}</td>
                                <td style={{fontWeight:'bold'}}>{text}</td>
                                <td>{renderStatusBadge(row)}</td>
                                <td className="td-task">{row.taskDescription || (row.isCL ? "Casual Leave" : "—")}</td>
                                </tr>
                            );
                        }))}
                    </tbody>
                    </table>
                </div>
            )}
            <div className="pagination-container" style={{display:'flex', justifyContent:'flex-end', marginTop:'15px', gap:'10px'}}>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={goToPrevPage} disabled={currentPage===1} style={{padding:'5px 10px'}}><ChevronLeft/></button>
                <button onClick={goToNextPage} disabled={currentPage===totalPages} style={{padding:'5px 10px'}}><ChevronRight/></button>
            </div>
          </>
      ) : activeTab === 'leaves' ? (
    <>
      <div className="filter-container1" style={{marginBottom:'20px', background:'#f9fafb', padding:'15px', borderRadius:'10px'}}>
        <div className="filter-inputs" style={{display:'flex', gap:'15px'}}>
          <div style={{display:'flex', alignItems:'center', background:'white', border:'1px solid #ddd', padding:'5px 10px', borderRadius:'8px'}}>
            <Search size={16} color="#888" />
            <input 
              type="text" placeholder="Search Name..." 
              value={leaveSearch} 
              onChange={(e) => setLeaveSearch(e.target.value)} 
              style={{border:'none', outline:'none', padding:'5px', marginLeft:'5px'}}
            />
          </div>
          
          {/* ✅ Date Filters instead of Month Dropdown */}
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="date-input" title="From Date" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="date-input" title="To Date" />
          
          <button onClick={() => {setLeaveSearch(""); setFromDate(""); setToDate("");}} className="clear-btn">Reset</button>
        </div>
      </div>
      
      {/* ✅ Passing the correct props here */}
      <Leaves searchTerm={leaveSearch} fromDate={fromDate} toDate={toDate} />
    </>
      ) : (
        /* ✅ CL SUMMARY TAB CONTENT */
        <div className="cl-reports-tab">
          <div className="filter-container1" style={{background:'#fffbf0', border:'1px solid #ffe0b2', marginBottom:'20px'}}>
             <div className="filter-inputs">
                <label style={{fontSize:'14px', fontWeight:'600'}}>Filter Total CL by Date Range:</label>
                <input type="date" value={clFromDate} onChange={e => setClFromDate(e.target.value)} className="date-input" />
                <input type="date" value={clToDate} onChange={e => setClToDate(e.target.value)} className="date-input" />
                <button onClick={() => {setClFromDate(""); setClToDate("");}} className="clear-btn">Reset</button>
             </div>
          </div>
          <div className="table-container">
            <table className="attendance-table">
              <thead><tr><th>EMPLOYEE NAME</th><th>DESIGNATION</th><th style={{textAlign:'center'}}>TOTAL CL TAKEN</th><th>STATUS</th></tr></thead>
              <tbody>
                {clLoading ? <tr><td colSpan="4" className="text-center">Calculating...</td></tr> : 
                  clSummary.map(emp => (
                    <tr key={emp.id}>
                      <td><strong>{emp.name}</strong></td>
                      <td>{emp.designation || "Staff"}</td>
                      <td style={{textAlign:'center'}}><span style={{padding:'4px 12px', borderRadius:'20px', background: emp.totalCL > 0 ? '#fff7ed' : '#f3f4f6', color: emp.totalCL > 0 ? '#ea580c' : '#9ca3af', fontWeight:'bold', border:'1px solid #fdba74'}}>{emp.totalCL} Day(s)</span></td>
                      <td>{emp.totalCL > 0 ? <span style={{backgroundColor:'#d1fae5', color:'#065f46', padding:'4px 8px', borderRadius:'12px', fontSize:'10px'}}>Active</span> : "--"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isModalOpen && selectedAttendance && (
        <div className="att-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="att-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="att-modal-header"><h3>Details</h3><button onClick={() => setIsModalOpen(false)}><X/></button></div>
            <div className="att-modal-content">
               <h3>{selectedAttendance.employeeName || selectedAttendance.name}</h3>
               <p>Date: {formatDate(selectedAttendance.checkInTime || selectedAttendance.date)}</p>
               {(() => {
                   const { text, isAbsent, reason } = calculateDuration(selectedAttendance);
                   return (
                       <>
                         <p>Work Duration: <strong>{isAbsent ? "—" : text}</strong></p>
                         <p>Status: <strong>{selectedAttendance.isCL ? "Casual Leave" : (isAbsent ? `Absent (${reason})` : "Present / Half Day")}</strong></p>
                       </>
                   );
               })()}
               <p>Task: {selectedAttendance.taskDescription || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
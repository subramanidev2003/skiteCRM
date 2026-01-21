import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Attendance.css';
import { toast } from 'react-toastify';
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = 'https://skitecrm.onrender.com/api';

const Attendance = () => {
  const navigate = useNavigate();
  
  // AUTH
  const adminToken = localStorage.getItem('adminToken');
  const managerToken = localStorage.getItem('managerToken');
  const token = adminToken || managerToken;
  const managerUser = JSON.parse(localStorage.getItem('managerUser'));
  const isManager = !!managerUser;
  const allowedDesignations = ['Web Developer', 'Web Developer(intern)', 'SEO(intern)'];

  // STATE
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  // FILTERS
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // FETCH DATA
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        if (!token) {
          setError("No authentication token found.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/attendance/all`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.clear(); 
          navigate('/');
          return;
        }

        const data = await response.json();
        setAttendance(data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError("Network error.");
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [navigate, token]);

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

  // --- HELPERS (Updated with Duration Logic) ---
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : "N/A";
  const formatTime = (dateString) => dateString ? new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";

  // New Function: Calculate Duration
  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn) return { text: "0h 0m", hours: 0 };
    
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date(); // If no checkout, calculate till now
    
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / 3600000); // hours
    const diffMins = Math.floor((diffMs % 3600000) / 60000); // minutes
    
    const totalHoursDecimal = diffMs / (1000 * 60 * 60);

    return { 
        text: `${diffHrs}h ${diffMins}m`, 
        hours: totalHoursDecimal 
    };
  };

  // New Function: Get Status Component
  const renderStatusBadge = (hours) => {
      if (hours >= 6) return <span style={{backgroundColor:'#d1fae5', color:'#065f46', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}}>Present</span>;
      if (hours >= 3) return <span style={{backgroundColor:'#ffedd5', color:'#9a3412', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}}>Half Day</span>;
      return <span style={{backgroundColor:'#fee2e2', color:'#991b1b', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600'}}>Short</span>;
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Report", 14, 15);
    
    // Updated PDF rows to include Duration and Status text
    const tableRows = filteredAttendance.map(row => {
        const { text, hours } = calculateDuration(row.checkIn, row.checkOut);
        let statusText = "Short";
        if(hours >= 6) statusText = "Present";
        else if(hours >= 3) statusText = "Half Day";

        return [
            row.employeeName, 
            formatDate(row.checkIn), 
            formatTime(row.checkIn),
            row.checkOut ? formatTime(row.checkOut) : "Active", 
            text, // Duration
            statusText // Status
        ];
    });

    autoTable(doc, { 
        head: [["Employee", "Date", "In", "Out", "Duration", "Status"]], 
        body: tableRows, 
        startY: 20 
    });
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

  if (loading) return <div className="attendance-page1">Loading...</div>;

  return (
    <div className="attendance-page1">
      <button className="modern-back-btn" // New Class Name
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#4b5563',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
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

      <h2 className="page-title">Attendance History</h2>

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

      <div className="table-container">
        <table className="attendance-table">
          <thead>
            {/* Added DURATION and STATUS columns */}
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
                // Calculate logic for each row
                const { text, hours } = calculateDuration(row.checkIn, row.checkOut);

                return (
                    <tr key={row._id} onClick={() => {setSelectedAttendance(row); setIsModalOpen(true);}} className="att-clickable-row">
                      <td><strong>{row.employeeName}</strong><br/><small>{row.designation}</small></td>
                      <td>{formatDate(row.checkIn)}</td>
                      <td className="text-green">{formatTime(row.checkIn)}</td>
                      <td className={row.checkOut ? "text-red" : "text-blue"}>{row.checkOut ? formatTime(row.checkOut) : "Active"}</td>
                      
                      {/* New Columns Data */}
                      <td style={{fontWeight:'bold', color: '#555'}}>{text}</td>
                      <td>{renderStatusBadge(hours)}</td>

                      <td className="td-task">{row.taskDescription || "—"}</td>
                    </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      {filteredAttendance.length > 0 && (
        <div className="pagination-container" style={{display:'flex', justifyContent:'flex-end', marginTop:'15px', gap:'10px'}}>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={goToPrevPage} disabled={currentPage===1} style={{padding:'5px 10px'}}><ChevronLeft/></button>
          <button onClick={goToNextPage} disabled={currentPage===totalPages} style={{padding:'5px 10px'}}><ChevronRight/></button>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && selectedAttendance && (
        <div className="att-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="att-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="att-modal-header"><h3>Details</h3><button onClick={() => setIsModalOpen(false)}><X/></button></div>
            <div className="att-modal-content">
               <h3>{selectedAttendance.employeeName}</h3>
               <p>Date: {formatDate(selectedAttendance.checkIn)}</p>
               {/* Show duration in Modal too */}
               <p>Work Duration: <strong>{calculateDuration(selectedAttendance.checkIn, selectedAttendance.checkOut).text}</strong></p>
               <p>Task: {selectedAttendance.taskDescription}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Attendance.css';
import { toast } from 'react-toastify';
import { ArrowLeft, X, User, Calendar, Clock, FileText } from 'lucide-react';

const API_BASE = 'https://skitecrm.onrender.com/api';

const Attendance = () => {
  const navigate = useNavigate();
  
  // ✅ AUTH & ROLE LOGIC
  const adminToken = localStorage.getItem('adminToken');
  const managerToken = localStorage.getItem('managerToken');
  const token = adminToken || managerToken;
  
  const managerUser = JSON.parse(localStorage.getItem('managerUser'));
  const isManager = !!managerUser;

  // ✅ DESIGNATIONS ALLOWED FOR MANAGER
  const allowedDesignations = ['Web Developer', 'Web Developer(intern)', 'SEO(intern)'];

  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        if (!token) {
          setError("No authentication token found. Please login.");
          setTimeout(() => navigate('/'), 2000);
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

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch attendance");
          setLoading(false);
          return;
        }

        const data = await response.json();
        setAttendance(data);
        setLoading(false);

      } catch (err) {
        console.error('Fetch error:', err);
        setError("Network error. Please try again later.");
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [navigate, token]);

  // ✅ UPDATED FILTER LOGIC (Role-Based + Search + Date)
  useEffect(() => {
    let result = attendance;

    // 1. Manager-Specific Designation Filtering
    if (isManager) {
      result = result.filter((row) => {
        // Checking multiple possible field names depending on your backend schema
        const designation = row.designation || row.employeeDesignation || (row.userId && row.userId.designation);
        return allowedDesignations.includes(designation);
      });
    }

    // 2. Name Search
    if (searchTerm) {
      result = result.filter((row) =>
        (row.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 3. Date Filtering
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
  }, [attendance, searchTerm, fromDate, toDate, isManager]);

  // --- ACTIONS ---

  const deleteSingleRecord = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/attendance/deleterec/${id}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (err) { return false; }
  };

  const deleteAllFilteredRecords = async () => {
    if (filteredAttendance.length === 0) return;
    const confirmation = window.confirm(`Delete ALL ${filteredAttendance.length} records?`);
    if (!confirmation) return;

    setIsDeleting(true);
    let successfulDeletions = 0;
    const idsToDelete = filteredAttendance.map(row => row._id || row.id).filter(id => id);

    for (const id of idsToDelete) {
      const success = await deleteSingleRecord(id);
      if (success) successfulDeletions++;
    }

    setIsDeleting(false);
    if (successfulDeletions > 0) {
      setAttendance(prev => prev.filter(item => !idsToDelete.includes(item._id) && !idsToDelete.includes(item.id)));
      toast.success(`Deleted ${successfulDeletions} records.`);
    }
  };

  // --- HELPERS ---

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Report", 14, 15);
    const tableRows = filteredAttendance.map(row => [
      row.employeeName || "Unknown",
      formatDate(row.checkIn),
      formatTime(row.checkIn),
      row.checkOut ? formatTime(row.checkOut) : "Active",
      row.taskDescription || "—"
    ]);
    autoTable(doc, { head: [["Employee", "Date", "Check In", "Check Out", "Task"]], body: tableRows, startY: 20 });
    doc.save("attendance_report.pdf");
  };

  const openModal = (record) => { setSelectedAttendance(record); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setSelectedAttendance(null); };

  if (loading) return <div className="attendance-page1">Loading records...</div>;

  return (
    <div className="attendance-page1">
      {/* ✅ DYNAMIC BACK BUTTON */}
      <button className="task-btn-back mb-4" onClick={() => navigate(isManager ? "/manager-dashboard" : "/admin-dashboard")}>
        <ArrowLeft size={20} /> Back To Dashboard
      </button>

      <h2 className="page-title">{isManager ? "Team Attendance History" : "Company Attendance History"}</h2>

      <div className="filter-container1">
        <div className="filter-inputs">
          <input 
            type="text" 
            placeholder="Search by Name..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="search-input" 
          />
          <div className="date-group">
            <label>From:</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="date-input" />
          </div>
          <div className="date-group">
            <label>To:</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="date-input" />
          </div>
          <button onClick={() => {setSearchTerm(""); setFromDate(""); setToDate("");}} className="clear-btn">Clear</button>
        </div>
        
      <div className="action-buttons">
  {/* Hide ONLY the delete button for managers */}
  {!isManager && (
    <button 
      className="delete-btn" 
      onClick={deleteAllFilteredRecords} 
      disabled={isDeleting || filteredAttendance.length === 0}
    >
      {isDeleting ? "Deleting..." : `Delete (${filteredAttendance.length})`}
    </button>
  )}
  
  <button onClick={downloadPDF} className="download-btn">
    Download PDF
  </button>
</div>
      </div>

      <div className="table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>DATE</th>
              <th>CHECK IN</th>
              <th>CHECK OUT</th>
              <th>TASK DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No records found for your team.</td></tr>
            ) : (
              filteredAttendance.map((row) => (
                <tr key={row._id || Math.random()} onClick={() => openModal(row)} className="att-clickable-row">
                  <td data-label="Employee">
                    <strong>{row.employeeName}</strong>
                    <br/><small style={{color: '#666'}}>{row.designation || row.employeeDesignation}</small>
                  </td>
                  <td data-label="Date">{formatDate(row.checkIn)}</td>
                  <td data-label="Check In" className="text-green">{formatTime(row.checkIn)}</td>
                  <td data-label="Check Out" className={row.checkOut ? "text-red" : "text-blue"}>
                    {row.checkOut ? formatTime(row.checkOut) : "Active"}
                  </td>
                  <td data-label="Task" className="td-task">{row.taskDescription || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ DETAIL MODAL */}
      {isModalOpen && selectedAttendance && (
        <div className="att-modal-overlay" onClick={closeModal}>
          <div className="att-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="att-modal-header">
              <span className="att-modal-title">Record Details</span>
              <button className="att-modal-close" onClick={closeModal}><X size={24} /></button>
            </div>
            <div className="att-modal-content">
              <div className="att-profile-section">
                <div className="att-avatar">{selectedAttendance.employeeName?.charAt(0)}</div>
                <h3>{selectedAttendance.employeeName}</h3>
                <p>{selectedAttendance.designation || selectedAttendance.employeeDesignation}</p>
              </div>
              <div className="att-grid">
                <div className="att-item"><label><Calendar size={14}/> Date</label><div>{formatDate(selectedAttendance.checkIn)}</div></div>
                <div className="att-item"><label><Clock size={14}/> Check In</label><div className="text-green">{formatTime(selectedAttendance.checkIn)}</div></div>
                <div className="att-item"><label><Clock size={14}/> Check Out</label><div className="text-red">{selectedAttendance.checkOut ? formatTime(selectedAttendance.checkOut) : "Still Logged In"}</div></div>
              </div>
              <div className="att-section">
                <label><FileText size={14}/> Work Done</label>
                <div className="att-desc-box">{selectedAttendance.taskDescription || "No description provided."}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
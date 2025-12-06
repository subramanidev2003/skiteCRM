import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Attendance.css';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

const Attendance = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false); // New state for bulk deletion

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const getToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('employeeToken') || localStorage.getItem('token');
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      // ... (fetchAttendance logic remains the same)
      try {
        const token = getToken();
        if (!token) {
          setError("No authentication token found. Please login.");
          setTimeout(() => navigate('/login'), 2000);
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
            navigate('/login');
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
        setFilteredAttendance(data);
        setLoading(false);

      } catch (err) {
        console.error('Fetch error:', err);
        setError("Network error. Please try again later.");
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [navigate]);

  // FILTER LOGIC
  useEffect(() => {
    let result = attendance;

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
  }, [attendance, searchTerm, fromDate, toDate]);

  // Helper function to delete a single record (reused for bulk deletion)
  const deleteSingleRecord = async (id) => {
    const token = getToken();
    try {
      // Assuming your backend expects the ID as a path parameter
      const response = await fetch(`${API_BASE}/attendance/deleterec/${id}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (err) {
      console.error(`Error deleting ID ${id}:`, err);
      return false;
    }
  };

  // ✅ NEW: Bulk Delete Function for Filtered Records
  const deleteAllFilteredRecords = async () => {
    if (filteredAttendance.length === 0) {
      alert("There are no records to delete.");
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to delete ALL ${filteredAttendance.length} attendance records currently shown in the table?`
    );
    if (!confirmation) {
      return;
    }

    setIsDeleting(true);
    let successfulDeletions = 0;
    const failedIds = [];

    // 1. Get all IDs to delete
    const idsToDelete = filteredAttendance.map(row => row._id || row.id).filter(id => id);

    // 2. Iterate and delete each record
    for (const id of idsToDelete) {
      const success = await deleteSingleRecord(id);
      if (success) {
        successfulDeletions++;
      } else {
        failedIds.push(id);
      }
    }

    setIsDeleting(false);

    // 3. Update State (Remove all successfully deleted items)
    if (successfulDeletions > 0) {
      setAttendance(prev => 
        prev.filter(item => 
          !idsToDelete.includes(item._id) && !idsToDelete.includes(item.id)
        )
      );
    }

    // 4. Alert user
    if (failedIds.length === 0) {
      toast.success(`Successfully deleted ${successfulDeletions} records.`);
    } else {
      toast(`Deleted ${successfulDeletions} records. ${failedIds.length} failed to delete.`);
    }
  };


  // Helpers (Format functions and downloadPDF remain the same)
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Attendance Report", 14, 22);
    const tableColumn = ["Employee", "Date", "Check In", "Check Out", "Task"];
    const tableRows = [];
    filteredAttendance.forEach(row => {
      const rowData = [
        row.employeeName || "Unknown",
        formatDate(row.checkIn),
        formatTime(row.checkIn),
        row.checkOut ? formatTime(row.checkOut) : "Active",
        row.taskDescription || "—"
      ];
      tableRows.push(rowData);
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 40 });
    doc.save("attendance_report.pdf");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  };

  if (loading) return <div className="attendance-page">Loading records...</div>;
  if (error) return <div className="attendance-page"><div className="error-text">{error}</div></div>;

  return (
    <div className="attendance-page1">
      <button
        className="btn-primary1 mb-4"
        onClick={() => navigate("/admin-dashboard")}
      >
        <ArrowLeft size={20} /> Back To Dashboard
      </button>
      <h2 className="page-title">Attendance History</h2>

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
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-group">
            <label>To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="date-input"
            />
          </div>
          <button onClick={clearFilters} className="clear-btn">
            Clear
          </button>
        </div>

        {/* ✅ BULK DELETE BUTTON IS HERE */}
        <button
          className="delete-btn"
          onClick={deleteAllFilteredRecords}
          disabled={isDeleting || filteredAttendance.length === 0}
        >
          {isDeleting
            ? "Deleting..."
            : `Delete All ${filteredAttendance.length}`}
        </button>

        <button onClick={downloadPDF} className="download-btn">
          Download PDF
        </button>
      </div>

      <div className="table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th className="th-employee">EMPLOYEE</th>
              <th className="th-date">DATE</th>
              <th className="th-time">CHECK IN</th>
              <th className="th-time">CHECK OUT</th>
              <th className="th-task1">TASK DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  No attendance records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredAttendance.map((row) => (
                <tr key={row._id || row.id || Math.random()}>
                  <td className="td-employee">
                    {row.employeeName || "Unknown"}
                  </td>
                  <td className="td-date">{formatDate(row.checkIn)}</td>
                  <td className="td-time">{formatTime(row.checkIn)}</td>
                  <td className="td-time">
                    {row.checkOut ? formatTime(row.checkOut) : "Active"}
                  </td>
                  <td className="td-task">{row.taskDescription || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
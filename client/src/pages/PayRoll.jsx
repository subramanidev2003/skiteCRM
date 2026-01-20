import React, { useState, useEffect } from 'react';
import { Search, IndianRupee, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import './Attendance.css'; 

const API_BASE = 'http://localhost:4000/api';

const PayRoll = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // --- DATA STATE ---
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [payrollData, setPayrollData] = useState([]);

  // --- FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  
  // DEFAULT DATE LOGIC (7th to 7th Cycle)
  const getCycleDates = () => {
    const now = new Date();
    const currentDay = now.getDate();
    let start, end;

    if (currentDay >= 7) {
      start = new Date(now.getFullYear(), now.getMonth(), 7);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 7);
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 7);
      end = new Date(now.getFullYear(), now.getMonth(), 7);
    }

    const toLocalISO = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date - offset).toISOString().split('T')[0];
    };

    return { start: toLocalISO(start), end: toLocalISO(end) };
  };

  const [startDate, setStartDate] = useState(getCycleDates().start);
  const [endDate, setEndDate] = useState(getCycleDates().end);

  // AUTH TOKEN
  const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

  // 1. FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) return;
        
        const userRes = await fetch(`${API_BASE}/user/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await userRes.json();

        const attRes = await fetch(`${API_BASE}/attendance/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const attendance = await attRes.json();

        if (userRes.ok && attRes.ok) {
          setEmployees(users);
          setAttendanceRecords(attendance);
        }
      } catch (error) {
        console.error("Error fetching data", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // 2. CALCULATE PAYROLL LOGIC (Updated for Sorting & Filtering)
  useEffect(() => {
    if (employees.length === 0) return;

    const calculatedData = employees.map((emp) => {
      const perDaySalary = emp.salaryPerDay || 0; 

      const empAttendance = attendanceRecords.filter((record) => {
        const recordUserId = record.userId?._id || record.userId;
        const isUserMatch = recordUserId === emp._id;
        
        const rawCheckIn = record.checkIn || record.checkInTime;
        if (!rawCheckIn) return false;

        const recordDate = new Date(rawCheckIn).toISOString().split('T')[0];
        const isDateMatch = recordDate >= startDate && recordDate <= endDate;

        return isUserMatch && isDateMatch;
      });

      let totalDays = 0;

      empAttendance.forEach((record) => {
        const rawCheckIn = record.checkIn || record.checkInTime;
        const rawCheckOut = record.checkOut || record.checkOutTime;

        if (rawCheckIn) {
          const start = new Date(rawCheckIn);
          const end = rawCheckOut ? new Date(rawCheckOut) : new Date(); 
          
          const diffMs = end - start;
          const hours = diffMs / (1000 * 60 * 60);

          if (hours >= 6) {
            totalDays += 1; 
          } else if (hours >= 3) {
            totalDays += 0.5;
          }
        }
      });

      const totalSalary = totalDays * perDaySalary;

      return {
        id: emp._id,
        name: emp.name,
        designation: emp.designation || "", // Ensure string to avoid crash
        perDaySalary: perDaySalary,
        presentDays: totalDays,
        totalSalary: totalSalary,
        attendanceCount: empAttendance.length
      };
    });

    // --- ✅ CHANGED LOGIC HERE ---

    // 1. FILTER: Search Term AND Remove "Team Lead"
    let processedData = calculatedData.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isTeamLead = item.designation.toLowerCase().includes('team lead'); 
        return matchesSearch && !isTeamLead; // Exclude Team Lead
    });

    // 2. SORT: Move Interns to the Bottom
    processedData.sort((a, b) => {
        const isAIntern = a.designation.toLowerCase().includes('intern');
        const isBIntern = b.designation.toLowerCase().includes('intern');

        if (isAIntern && !isBIntern) return 1; // A is Intern -> Move Down
        if (!isAIntern && isBIntern) return -1; // B is Intern -> Move Down
        return 0; // No change if both are same category
    });

    setPayrollData(processedData);

  }, [employees, attendanceRecords, startDate, endDate, searchTerm]);

  // 3. DOWNLOAD PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Payroll Report (${startDate} to ${endDate})`, 14, 15);
    
    const tableRows = payrollData.map(row => [
        row.name,
        row.designation,
        `Rs. ${row.perDaySalary}`,
        row.presentDays,
        `Rs. ${row.totalSalary.toLocaleString('en-IN')}`
    ]);

    autoTable(doc, { 
        head: [["Employee", "Role", "Per Day", "Paid Days", "Total Salary"]], 
        body: tableRows, 
        startY: 20 
    });
    doc.save(`Payroll_${startDate}_${endDate}.pdf`);
  };

  if (loading) return <div className="attendance-page1">Loading Payroll...</div>;

  return (
    <div className="attendance-page1">
      <div className="flex items-center justify-between mb-4">
        <button className="task-btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} /> Back
        </button>
        <h2 className="page-title">Employee Payroll</h2>
      </div>

      <div className="filter-container1" style={{display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', background:'#fff', padding:'15px', borderRadius:'8px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
        
        <div className="search-box" style={{position:'relative', flex:1, minWidth:'200px'}}>
            <Search size={18} style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#888'}}/>
            <input 
              type="text" 
              placeholder="Search Employee..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{padding:'8px 10px 8px 35px', width:'100%', border:'1px solid #ddd', borderRadius:'5px'}}
            />
        </div>

        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <label style={{fontWeight:'500', fontSize:'0.9rem'}}>From:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{padding:'8px', border:'1px solid #ddd', borderRadius:'5px'}}
            />
        </div>

        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <label style={{fontWeight:'500', fontSize:'0.9rem'}}>To:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{padding:'8px', border:'1px solid #ddd', borderRadius:'5px'}}
            />
        </div>

        <button onClick={downloadPDF} className="download-btn" style={{display:'flex', alignItems:'center', gap:'5px'}}>
            <Download size={16}/> PDF
        </button>

      </div>

      <div className="table-container" style={{marginTop:'20px'}}>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>DESIGNATION</th>
              <th>PER DAY SALARY</th>
              <th>PRESENT DAYS</th>
              <th>TOTAL SALARY</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No records found for this period.</td></tr>
            ) : (
              payrollData.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.designation}</td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'4px', color:'#555'}}>
                        <IndianRupee size={14}/> {row.perDaySalary}
                    </div>
                  </td>
                  <td style={{fontWeight:'bold', color: row.presentDays > 0 ? '#2e7d32' : '#c62828'}}>
                    {row.presentDays} Days
                  </td>
                  <td>
                    <div style={{display:'inline-flex', alignItems:'center', gap:'4px', fontWeight:'bold', color:'#fff', background: '#FF4500', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem'}}>
                        <IndianRupee size={14}/> {row.totalSalary.toLocaleString('en-IN')}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:'15px', fontSize:'0.85rem', color:'#666', fontStyle:'italic'}}>
        * Calculation Logic: Work hours &ge; 6 hrs = 1 Day | 3 hrs - 6 hrs = 0.5 Day
      </div>
    </div>
  );
}

export default PayRoll;
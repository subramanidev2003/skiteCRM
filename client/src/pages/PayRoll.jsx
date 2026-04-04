import React, { useState, useEffect } from 'react';
import { Search, IndianRupee, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import { API_BASE } from '../api';
import './Attendance.css'; 

const PayRoll = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // --- DATA STATE ---
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [payrollData, setPayrollData] = useState([]);

  const [manualDays, setManualDays] = useState({});

  // --- FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  
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

    const format = (d) => d.toLocaleDateString('en-CA'); 
    return { start: format(start), end: format(end) };
  };

  const [startDate, setStartDate] = useState(getCycleDates().start);
  const [endDate, setEndDate] = useState(getCycleDates().end);

  const addOneDay = (dateStr) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-CA');
  };

  // ✅ FIX: officerToken add பண்ணினேன்
  const officerToken = localStorage.getItem('officerToken');
  const token = localStorage.getItem('adminToken') || 
                localStorage.getItem('managerToken') || 
                officerToken;

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

  // 2. CALCULATE PAYROLL LOGIC
  useEffect(() => {
    if (employees.length === 0) return;

    const nextDayAfterEnd = addOneDay(endDate);
    
    const calculatedData = employees.map((emp) => {
      const perDaySalary = Number(emp.salaryPerDay) || Number(emp.salary) || Number(emp.amount) || 0; 
      
      const empAttendance = attendanceRecords.filter((record) => {
        const recordUserId = record.userId?._id || record.userId;
        const isIdMatch = String(recordUserId) === String(emp._id);

        let isNameMatch = false;
        if (record.userId && record.userId.name) {
             isNameMatch = record.userId.name.trim().toLowerCase() === emp.name.trim().toLowerCase();
        } else if (record.employeeName) { 
             isNameMatch = record.employeeName.trim().toLowerCase() === emp.name.trim().toLowerCase();
        }

        const isUserMatch = isIdMatch || isNameMatch;
        
        const rawCheckIn = record.checkIn || record.checkInTime;
        if (!rawCheckIn) return false;

        const recordDate = new Date(rawCheckIn).toLocaleDateString('en-CA');
        const isDateMatch = recordDate >= startDate && recordDate < nextDayAfterEnd;

        return isUserMatch && isDateMatch;
      });

      let totalDays = 0;

      empAttendance.forEach((record) => {
        const rawCheckIn  = record.checkIn || record.checkInTime;
        const rawCheckOut = record.checkOut || record.checkOutTime;

        if (rawCheckIn) {
          const start = new Date(rawCheckIn);
          let end;
          let isCheckout = false;

          if (rawCheckOut) {
             end = new Date(rawCheckOut);
             isCheckout = true;
          } else {
             end = new Date(); 
          }
          
          if (start.toDateString() !== end.toDateString()) return; 

          if (isCheckout) {
              const checkoutHour = end.getHours();
              if (checkoutHour >= 21) return; 
          }

          const diffMs = end - start;
          const hours  = diffMs / (1000 * 60 * 60);

          if (hours >= 6)      totalDays += 1; 
          else if (hours >= 3) totalDays += 0.5;
        }
      });

      return {
        id: emp._id,
        name: emp.name,
        designation: emp.designation || "", 
        perDaySalary: perDaySalary,
        presentDays: totalDays, 
        attendanceCount: empAttendance.length
      };
    });

    let processedData = calculatedData.filter(item => {
        const matchesSearch  = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isTeamLead     = item.designation.toLowerCase().includes('team lead'); 
        return matchesSearch && !isTeamLead; 
    });

    processedData.sort((a, b) => {
        const isAIntern = a.designation.toLowerCase().includes('intern');
        const isBIntern = b.designation.toLowerCase().includes('intern');
        if (isAIntern && !isBIntern) return 1; 
        if (!isAIntern && isBIntern) return -1; 
        return 0; 
    });

    setPayrollData(processedData);

  }, [employees, attendanceRecords, startDate, endDate, searchTerm]);

  const handleManualDaysChange = (id, value) => {
    setManualDays(prev => ({
        ...prev,
        [id]: parseFloat(value) || 0
    }));
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Payroll Report (${startDate} to ${endDate})`, 14, 15);
    
    const tableRows = payrollData.map(row => {
        const addedDays  = manualDays[row.id] || 0;
        const finalDays  = row.presentDays + addedDays;
        const finalSalary = finalDays * row.perDaySalary;

        return [
            row.name,
            row.designation,
            `Rs. ${row.perDaySalary}`,
            `${row.presentDays} + ${addedDays} = ${finalDays}`,
            `Rs. ${finalSalary.toLocaleString('en-IN')}`
        ];
    });

    autoTable(doc, { 
        head: [["Employee", "Role", "Per Day", "Days (Calc + Add)", "Total Salary"]], 
        body: tableRows, 
        startY: 20 
    });
    doc.save(`Payroll_${startDate}_${endDate}.pdf`);
  };

  // ✅ FIX: Back button — officer → officer-dashboard
  const handleBack = () => {
    if (officerToken) return navigate('/officer-dashboard');
    return navigate('/admin-dashboard');
  };

  if (loading) return <div className="attendance-page1">Loading Payroll...</div>;

  return (
    <div className="attendance-page1">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={handleBack}
          className="modern-back-btn" 
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', background: 'white',
            border: '1px solid #e0e0e0', padding: '8px 16px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#4b5563',
            transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
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
              <th>PER DAY</th>
              <th>CALC DAYS</th>
              <th>ADD DAYS</th>
              <th>TOTAL SALARY</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.length === 0 ? (
              <tr><td colSpan="6" className="text-center">No records found for this period.</td></tr>
            ) : (
              payrollData.map((row) => {
                const addedDays  = manualDays[row.id] || 0;
                const finalDays  = row.presentDays + addedDays;
                const finalSalary = finalDays * row.perDaySalary;

                return (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.designation}</td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:'4px', color:'#555'}}>
                          <IndianRupee size={14}/> {row.perDaySalary}
                      </div>
                    </td>
                    <td style={{fontWeight:'bold', color: '#2e7d32'}}>
                      {row.presentDays} Days
                    </td>
                    <td>
                        <input 
                            type="number" 
                            placeholder="0"
                            min="0"
                            step="0.5"
                            value={manualDays[row.id] || ''}
                            onChange={(e) => handleManualDaysChange(row.id, e.target.value)}
                            style={{
                                width: '60px', 
                                padding: '5px', 
                                border: '1px solid #FF4500', 
                                borderRadius: '5px',
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}
                        />
                    </td>
                    <td>
                      <div style={{display:'inline-flex', alignItems:'center', gap:'4px', fontWeight:'bold', color:'#fff', background: '#FF4500', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem'}}>
                          <IndianRupee size={14}/> {finalSalary.toLocaleString('en-IN')}
                      </div>
                      <div style={{fontSize:'10px', color:'#888', marginTop:'2px'}}>
                          ({row.presentDays} + {addedDays} = {finalDays} days)
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:'15px', fontSize:'0.85rem', color:'#666', fontStyle:'italic'}}>
        * Calculation Logic: &ge;6 hrs = 1 Day | &ge;3 hrs = 0.5 Day. Use "Add Days" column to adjust salary manually.
      </div>
    </div>
  );
}

export default PayRoll;
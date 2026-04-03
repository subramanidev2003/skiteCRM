import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Save, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { API_BASE } from '../api';
import { toast } from 'react-toastify';

const BulkAttendance = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('adminToken');
    
    const [holidayDates, setHolidayDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    // ✅ FIXED: Correct Sunday Generator (No Timezone Issues)
    const addAllSundays = () => {
        const year = new Date().getFullYear();
        const sundays = [];
        // Loop through all days of the year
        let d = new Date(year, 0, 1); // January 1st

        while (d.getFullYear() === year) {
            if (d.getDay() === 0) { // 0 is Sunday
                // Manual format YYYY-MM-DD to avoid toISOString timezone shift
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const formattedDate = `${yyyy}-${mm}-${dd}`;
                sundays.push(formattedDate);
            }
            d.setDate(d.getDate() + 1);
        }

        const uniqueHolidays = Array.from(new Set([...holidayDates, ...sundays]));
        setHolidayDates(uniqueHolidays.sort());
        // BulkAttendance.jsx - Line 32 approx
toast.info(`All Sundays for ${year} have been added successfully!`);
    };

    const addHoliday = () => {
        if (!selectedDate) return;
        if (holidayDates.includes(selectedDate)) return toast.warning("Date already exists");
        setHolidayDates([...holidayDates, selectedDate].sort());
        setSelectedDate("");
    };

    const removeDate = (date) => setHolidayDates(holidayDates.filter(d => d !== date));

    const processBulkAttendance = async () => {
        if (holidayDates.length === 0) return toast.error("No dates selected!");
        if (!window.confirm(`Mark attendance for ${holidayDates.length} days?`)) return;

        setIsProcessing(true);
        try {
            const userRes = await fetch(`${API_BASE}/user/all`, { headers: { 'Authorization': `Bearer ${token}` } });
            const userData = await userRes.json();
            const employees = userData.employees || userData.users || userData || [];

            // INACTIVE LIST: Exclusion logic
            const inactiveNames = ["Hemapriya P", "Akshar", "Prabhakaran", "sowmiya", "Nandhini V"];
            
            const activeEmployees = employees.filter(emp => {
                const name = emp.name?.trim().toLowerCase();
                const designation = (emp.designation || '').toLowerCase();
                if (name === "prabhakaran" && designation.includes("team lead")) return false;
                return !inactiveNames.some(inactive => name === inactive.trim().toLowerCase());
            });

            if (activeEmployees.length === 0) throw new Error("No active employees found");

            setProgress({ current: 0, total: holidayDates.length });

            for (let i = 0; i < holidayDates.length; i++) {
                const dateStr = holidayDates[i];
                const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
                const taskDesc = dayName === 'Sunday' ? "Sunday" : "Holiday";

                // Standard work timings: 09:30 AM to 06:30 PM
                const isoCheckIn = new Date(`${dateStr}T09:30:00`).toISOString();
                const isoCheckOut = new Date(`${dateStr}T18:30:00`).toISOString();

                await fetch(`${API_BASE}/attendance/bulk-mark`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        date: dateStr,
                        employees: activeEmployees.map(emp => emp._id),
                        checkIn: isoCheckIn,
                        checkOut: isoCheckOut,
                        taskDescription: taskDesc
                    })
                });
                setProgress(prev => ({ ...prev, current: i + 1 }));
            }
            toast.success("Done! Attendance updated correctly. ✅");
            setHolidayDates([]);
        } catch (err) { toast.error(err.message); } finally { setIsProcessing(false); }
    };

    return (
        <div className="attendance-page1">
            <button className="modern-back-btn" onClick={() => navigate(-1)} style={{display:'flex', alignItems:'center', gap:'8px', background:'white', border:'1px solid #ddd', padding:'8px 15px', borderRadius:'8px', cursor:'pointer'}}>
                <ArrowLeft size={20} /> Back
            </button>
            <h2 className="page-title">Yearly Bulk Attendance</h2>
            <div className="bulk-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Select Date</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }} />
                            <button onClick={addHoliday} className="save-btn" style={{width:'auto', padding:'0 20px'}}>Add Date</button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button onClick={addAllSundays} className="history-btn" style={{ background: '#4f46e5', color: 'white', border: 'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'8px' }}>
                            <Calendar size={18} /> Add All Sundays
                        </button>
                    </div>
                </div>
                <div className="date-list" style={{ border: '1px solid #eee', borderRadius: '10px', padding: '15px', maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
                    <h4>Dates to Process ({holidayDates.length})</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop:'10px' }}>
                        {holidayDates.map(date => (
                            <span key={date} style={{ background: '#f3f4f6', padding: '5px 12px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {new Date(date).toLocaleDateString()}
                                <Trash2 size={14} color="red" cursor="pointer" onClick={() => removeDate(date)} />
                            </span>
                        ))}
                    </div>
                </div>
                {isProcessing && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}><Loader2 className="animate-spin" /><span>Processing Day {progress.current} of {progress.total}</span></div>
                        <div style={{ width: '100%', height: '8px', background: '#dbeafe', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${(progress.current/progress.total)*100}%`, height: '100%', background: '#3b82f6' }}></div></div>
                    </div>
                )}
                <button onClick={processBulkAttendance} disabled={isProcessing || holidayDates.length === 0} className="save-btn" style={{ width: '100%', padding: '15px', fontSize: '16px' }}>
                    {isProcessing ? 'PROCESSING...' : 'MARK PRESENT (ACTIVE EMPLOYEES ONLY)'}
                </button>
            </div>
        </div>
    );
};
export default BulkAttendance;
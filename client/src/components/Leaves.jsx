import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE } from '../api';
import '../pages/Attendance.css';

// ✅ Receive props: searchTerm, fromDate, toDate
const Leaves = ({ searchTerm, fromDate, toDate }) => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

    useEffect(() => { fetchLeaves(); }, []);

    const fetchLeaves = async () => {
        try {
            const res = await fetch(`${API_BASE}/leaves/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if(res.ok) {
                const data = await res.json();
                // ✅ Preserving your sorting logic (Pending first)
                setLeaves(data.sort((a,b) => (a.status === 'Pending' ? -1 : 1)));
            }
        } catch(err) { console.error(err); } finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;
        try {
            const res = await fetch(`${API_BASE}/leaves/update/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            if(res.ok) {
                toast.success(`Leave ${status}`);
                fetchLeaves();
            }
        } catch(err) { toast.error("Error updating status"); }
    };

    // ✅ NEW: FILTER LOGIC (Name + Date Range)
    const filteredLeaves = leaves.filter((leave) => {
        // 1. Name Match
        const matchesSearch = (leave.name || "").toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Date Range Match
        const leaveStart = new Date(leave.fromDate).setHours(0, 0, 0, 0);
        const leaveEnd = new Date(leave.toDate).setHours(23, 59, 59, 999);

        let matchesDate = true;
        if (fromDate) {
            const filterFrom = new Date(fromDate).setHours(0, 0, 0, 0);
            matchesDate = matchesDate && leaveStart >= filterFrom;
        }
        if (toDate) {
            const filterTo = new Date(toDate).setHours(23, 59, 59, 999);
            matchesDate = matchesDate && leaveEnd <= filterTo;
        }

        return matchesSearch && matchesDate;
    });

    if(loading) return <div style={{padding:'20px', textAlign:'center'}}>Loading...</div>;

    return (
        <div style={{marginTop:'20px'}}>
            <table className="attendance-table">
                <thead>
                    <tr><th>Employee</th><th>Dates</th><th>Reason</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                    {filteredLeaves.length === 0 ? (
                        <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>No matching requests found.</td></tr>
                    ) : (
                        filteredLeaves.map(leave => (
                            <tr key={leave._id}>
                                <td><strong>{leave.name}</strong><br/><small>{leave.designation}</small></td>
                                <td>{new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}</td>
                                <td>{leave.reason}</td>
                                <td><span className={`status-badge ${leave.status.toLowerCase()}`}>{leave.status}</span></td>
                                <td>
                                    {leave.status === 'Pending' && (
                                        <div style={{display:'flex', gap:'10px'}}>
                                            <button onClick={() => updateStatus(leave._id, 'Approved')} style={{color:'green', background:'none', border:'none', cursor:'pointer'}} title="Approve"><Check/></button>
                                            <button onClick={() => updateStatus(leave._id, 'Rejected')} style={{color:'red', background:'none', border:'none', cursor:'pointer'}} title="Reject"><X/></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Leaves;
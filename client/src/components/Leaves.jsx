import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import '../pages/Attendance.css';

const Leaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

    useEffect(() => { fetchLeaves(); }, []);

    const fetchLeaves = async () => {
        try {
            const res = await fetch('https://skitecrm-1l7f.onrender.com/api/leaves/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if(res.ok) {
                const data = await res.json();
                setLeaves(data.sort((a,b) => (a.status === 'Pending' ? -1 : 1)));
            }
        } catch(err) { console.error(err); } finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`https://skitecrm-1l7f.onrender.com/api/leaves/update/${id}`, {
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

    if(loading) return <div>Loading...</div>;

    return (
        <div style={{marginTop:'20px'}}>
            <table className="attendance-table">
                <thead>
                    <tr><th>Employee</th><th>Dates</th><th>Reason</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                    {leaves.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center'}}>No requests.</td></tr> : 
                        leaves.map(leave => (
                            <tr key={leave._id}>
                                <td><strong>{leave.name}</strong><br/><small>{leave.designation}</small></td>
                                <td>{new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}</td>
                                <td>{leave.reason}</td>
                                <td><span className={`status-badge ${leave.status.toLowerCase()}`}>{leave.status}</span></td>
                                <td>
                                    {leave.status === 'Pending' && (
                                        <div style={{display:'flex', gap:'10px'}}>
                                            <button onClick={() => updateStatus(leave._id, 'Approved')} style={{color:'green'}}><Check/></button>
                                            <button onClick={() => updateStatus(leave._id, 'Rejected')} style={{color:'red'}}><X/></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    );
};
export default Leaves;
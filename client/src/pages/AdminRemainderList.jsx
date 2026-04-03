import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE } from '../api';

const AdminRemainderList = () => {
    const { type } = useParams(); 
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRemainderLeads = async () => {
        try {
            const res = await fetch(`${API_BASE}/leads/admin/all`);
            const data = await res.json();
            const todayStr = new Date().toLocaleDateString('en-CA');

            let filtered = [];
            if (type === 'today') {
                filtered = data.filter(l => l.remainder2Date === todayStr && l.remainder2Status !== 'Completed');
            } else {
                filtered = data.filter(l => l.remainder2Date && l.remainder2Date < todayStr && l.remainder2Status !== 'Completed');
            }
            setLeads(filtered);
        } catch (err) { toast.error("Error loading"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRemainderLeads(); }, [type]);

    const markComplete = async (e, lead) => {
        e.stopPropagation();
        try {
            const res = await fetch(`${API_BASE}/leads/update/${lead._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...lead, remainder2Status: 'Completed' })
            });
            if (res.ok) {
                toast.success("Done!");
                fetchRemainderLeads(); 
            }
        } catch (err) { toast.error("Failed"); }
    };

    return (
        <div className="ad-page-container">
            <div className="ad-page-header">
                <button className="ad-btn-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <h1 className="ad-page-title">{type === 'today' ? "Today's Remainder" : "Pending Overview"}</h1>
            </div>
            <div className="ad-table-wrapper" style={{background:'white', borderRadius:'12px', padding:'10px', overflowX:'auto'}}>
                <table className="ad-leads-table" style={{width: '100%', minWidth:'800px'}}>
                    <thead>
                        <tr style={{background:'#f9fafb'}}>
                            <th>Date</th><th>Client</th><th>Task</th><th style={{textAlign:'center'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <tr key={lead._id} onClick={() => navigate(`/admin-dashboard/lead-detail/${lead._id}`, {state: {lead}})} style={{cursor:'pointer'}}>
                                <td>{lead.remainder2Date}</td>
                                <td><strong>{lead.name}</strong><br/>{lead.phoneNumber}</td>
                                <td>{lead.remainder2}</td>
                                <td style={{textAlign:'center'}}>
                                    <button onClick={(e) => markComplete(e, lead)} className="add-lead-btn" style={{background: '#10b981', width:'auto'}}>Complete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leads.length === 0 && <p style={{textAlign: 'center', padding: '40px', color:'#9ca3af'}}>All clear!</p>}
            </div>
        </div>
    );
};
export default AdminRemainderList;
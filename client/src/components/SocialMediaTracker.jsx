import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Check, Link, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import './SocialMedia.css'; 

const API_BASE = 'http://localhost:4000/api';

const SocialMediaTracker = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [client, setClient] = useState(null);
  const [days, setDays] = useState([]); 
  const [allHistoryDays, setAllHistoryDays] = useState([]); 
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [dirtyRows, setDirtyRows] = useState({}); 
  const [videoTarget, setVideoTarget] = useState(0); 
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [isInitialized, setIsInitialized] = useState(false);

  const convertMonthToInputFormat = (monthStr) => {
    if (!monthStr) return new Date().toISOString().slice(0, 7);
    const [monthName, year] = monthStr.split(' ');
    const date = new Date(`${monthName} 1, ${year}`);
    const monthNum = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${monthNum}`;
  };

  const generateMonthDays = (year, month, existingDays) => {
    const tempDays = [];
    const daysInMonth = new Date(year, month, 0).getDate(); 

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const found = existingDays.find(d => d.date === dateStr);
        tempDays.push(found || { date: dateStr, videoLink: '', postStatus: 'Pending' });
    }
    return tempDays;
  };

  useEffect(() => {
    fetchClientData();
  }, [selectedMonth]); 

  const fetchClientData = async () => {
    try {
        const res = await fetch(`${API_BASE}/social-media/${id}`);
        const data = await res.json();
        if (res.ok) {
            setClient(data);
            setPaymentStatus(data.paymentStatus || 'Pending');
            setVideoTarget(data.videoTarget || 0); 
            setAllHistoryDays(data.days || []);

            if (!isInitialized && data.month) {
                const dbMonth = convertMonthToInputFormat(data.month);
                if (dbMonth !== selectedMonth) {
                    setSelectedMonth(dbMonth);
                    setIsInitialized(true); 
                    return; 
                }
            }

            const [year, month] = selectedMonth.split('-');
            setDays(generateMonthDays(parseInt(year), parseInt(month), data.days || []));
            setIsInitialized(true);
        }
    } catch (err) { console.error(err); }
  };

  const handleVideoChange = (index, value) => {
    const newDays = [...days];
    newDays[index].videoLink = value;
    setDays(newDays);
    setDirtyRows(prev => ({ ...prev, [index]: true })); 
  };

  const handleStatusChange = async (index, value) => {
    const newDays = [...days];
    newDays[index].postStatus = value;
    setDays(newDays);

    await saveChanges(newDays, true); 
    toast.success("Status Updated ✅", { autoClose: 1000, hideProgressBar: true });
  };

  const saveSingleRow = async (index) => {
    const dayData = days[index];
    setDirtyRows(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
    });
    await saveChanges([dayData], true); 
  };

  const saveChanges = async (daysToSave = days, silent = false) => {
    try {
        const [year, month] = selectedMonth.split('-');
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        const res = await fetch(`${API_BASE}/social-media/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                days: daysToSave, 
                paymentStatus,
                currentMonth: monthName,
                videoTarget: videoTarget 
            }) 
        });
        
        if (res.ok) {
            if(!silent) toast.success("Data Saved Successfully!");
            const data = await res.json();
            setAllHistoryDays(data.days); // Update full history
            setClient(prev => ({...prev, month: monthName}));
        }
    } catch (err) { toast.error("Failed to save"); }
  };

  // ✅ CORRECTED LOGIC: Only count if status is 'Posted'
  // பழைய கோடில் videoLink இருக்கிறதா என்று பார்த்தோம், இப்போது postStatus பார்க்கிறோம்.
  const postedCount = days.filter(d => d.postStatus === 'Posted').length;
  
  const remainingVideos = Math.max(0, videoTarget - postedCount);

  if (!client) return <div className="sm-wrapper" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>;

  return (
    <div className="sm-wrapper">
        <div className="sm-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button onClick={() => navigate('/social-media-clients')} className="btn-back">
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="sm-title">
                    <h1>{client.clientName}</h1>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{background: '#e0f2fe', padding: '6px 15px', borderRadius: '8px', color: '#0369a1', fontWeight: 'bold', fontSize: '14px', border: '1px solid #bae6fd'}}>
                    Pending: {remainingVideos} / {videoTarget}
                </div>

                <div style={{display:'flex', alignItems:'center', gap:'5px', background:'#fff', padding:'5px 10px', borderRadius:'8px', border:'1px solid #e0e5f2'}}>
                    <span style={{fontSize:'12px', color:'#a3aed0', fontWeight:'600'}}>Target:</span>
                    <input 
                        type="number" 
                        value={videoTarget}
                        onChange={(e) => setVideoTarget(parseInt(e.target.value) || 0)}
                        style={{width: '40px', border: 'none', fontWeight: 'bold', outline: 'none', textAlign: 'center'}}
                    />
                </div>

                <div style={{display:'flex', alignItems:'center', gap:'10px', background:'#f8f9fa', padding:'5px 10px', borderRadius:'8px', border:'1px solid #e0e5f2'}}>
                    <span style={{fontSize:'13px', color:'#a3aed0', fontWeight:'600'}}>Filter:</span>
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{
                            border: 'none', background:'transparent',
                            color: '#1b2559', fontWeight: 'bold', cursor: 'pointer',
                            fontSize: '14px', outline:'none'
                        }}
                    />
                </div>

                <button className="btn-success" onClick={() => saveChanges(days, false)}>
                    <Save size={18} /> Save All
                </button>
            </div>
        </div>

        <div className="tracker-container">
            <table className="sm-table">
                <thead>
                    <tr>
                        <th style={{width: '20%'}}>Date</th>
                        <th style={{width: '45%'}}>Video Number / Link</th>
                        <th style={{width: '35%'}}>Post Status</th>
                    </tr>
                </thead>
                <tbody>
                    {days.map((day, index) => (
                        <tr key={index}>
                            <td>
                                <div style={{display:'flex', alignItems:'center', gap:'10px', color: '#1b2559', fontWeight: 'bold'}}>
                                    <div style={{background: '#f4f7fe', padding: '8px', borderRadius: '8px'}}>
                                        <Calendar size={16} color="#4318FF"/> 
                                    </div>
                                    {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                </div>
                            </td>
                            <td>
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <div style={{position: 'relative', flex: 1}}>
                                        <input 
                                            type="text" 
                                            placeholder="Enter Video No..." 
                                            value={day.videoLink || ''}
                                            onChange={(e) => handleVideoChange(index, e.target.value)}
                                            style={{
                                                width: '100%', padding: '8px 10px 8px 35px', 
                                                borderRadius: '8px', border: '1px solid #e0e5f2', outline: 'none'
                                            }}
                                        />
                                        <Link size={14} color="#a3aed0" style={{position: 'absolute', left: '10px', top: '12px'}}/>
                                    </div>
                                    {dirtyRows[index] && (
                                        <button 
                                            onClick={() => saveSingleRow(index)}
                                            style={{
                                                background: '#05cd99', color: 'white', border: 'none', 
                                                borderRadius: '6px', padding: '8px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 5px rgba(5,205,153,0.3)',
                                                animation: 'fadeIn 0.2s ease'
                                            }}
                                            title="Save Changes"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div style={{position: 'relative'}}>
                                    <select 
                                        className={`status-select ${day.postStatus === 'Posted' ? 'posted' : day.postStatus === 'Not Posted' ? 'not-posted' : 'pending'}`}
                                        value={day.postStatus} 
                                        onChange={(e) => handleStatusChange(index, e.target.value)}
                                    >
                                        <option value="Pending">⏳ Pending</option>
                                        <option value="Posted">✅ Posted</option>
                                        <option value="Not Posted">❌ Not Posted</option>
                                    </select>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="payment-footer">
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div style={{background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%'}}>
                    <IndianRupee size={24} color="white"/> 
                </div>
                <div>
                    <h3>Month End Payment Status</h3>
                    <span style={{fontSize: '12px', opacity: 0.7}}>Status for {new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                </div>
            </div>
            
            <select 
                className={`payment-select ${paymentStatus === 'Paid' ? 'paid' : 'pending'}`}
                value={paymentStatus} 
                onChange={(e) => setPaymentStatus(e.target.value)}
            >
                <option value="Pending">Pending Payment</option>
                <option value="Paid">Payment Received</option>
            </select>
        </div>
    </div>
  );
};

export default SocialMediaTracker;
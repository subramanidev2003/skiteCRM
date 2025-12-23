import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Conversion.css'; // ✅ Using the NEW Separate CSS

const Conversion = () => {
  const navigate = useNavigate();
  const [allLeads, setAllLeads] = useState([]); 
  const [chartData, setChartData] = useState([]);
  const [filter, setFilter] = useState('Overall');

  const COLORS = ['#28a745', '#ff7f50']; // Green & Orange

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetch("https://skitecrm.onrender.com/api/leads/common/all")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setAllLeads(data);
        processData(data, 'Overall');
      })
      .catch((err) => console.error("Error loading leads", err));
  }, []);

  const processData = (leadsToProcess, selectedFilter) => {
    let filtered = leadsToProcess;

    if (selectedFilter !== 'Overall') {
      const monthIndex = monthNames.indexOf(selectedFilter);
      filtered = leadsToProcess.filter(lead => {
        // Ensure date is parsed correctly
        const leadDate = new Date(lead.date);
        return leadDate.getMonth() === monthIndex;
      });
    }

    const completed = filtered.filter(lead => lead.closing === 'Yes').length;
    const pending = filtered.filter(lead => lead.closing !== 'Yes').length;

    setChartData([
      { name: 'Completed', value: completed },
      { name: 'Pending', value: pending },
    ]);
  };

  const handleFilterChange = (e) => {
    const selected = e.target.value;
    setFilter(selected);
    processData(allLeads, selected);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalLeads = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="conversion-container">
        
        {/* HEADER */}
        <div className="analytics-header">
            <button className="back-button" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back
            </button>
            <h1 className="analytics-title">Analytics Dashboard</h1>
            <div style={{width: '80px'}}></div> {/* Spacer for alignment */}
        </div>

        {/* MAIN CARD */}
        <div className="analytics-card">
            
            {/* Filter Section */}
            <div className="filter-container">
                <select className="modern-select" value={filter} onChange={handleFilterChange}>
                    <option value="Overall">Overall Performance</option>
                    {monthNames.map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>
            </div>

            {/* CHART SECTION */}
            {totalLeads === 0 ? (
                <div className="no-data-msg">
                    No leads found for <strong>{filter}</strong>
                </div>
            ) : (
                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={130}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* STATS BOXES */}
            <div className="stats-row">
                <div className="stat-box success">
                    <span className="stat-label">Completed Leads</span>
                    <span className="stat-value text-success">{chartData[0]?.value || 0}</span>
                </div>
                
                <div className="stat-box pending">
                    <span className="stat-label">Pending Leads</span>
                    <span className="stat-value text-pending">{chartData[1]?.value || 0}</span>
                </div>
            </div>

        </div>
    </div>
  );
};

export default Conversion;
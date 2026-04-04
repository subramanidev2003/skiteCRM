import React, { useState, useEffect } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ArrowLeft, Calendar, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../api';
import './FinancialGraph.css'; 

const FinancialGraph = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ FIXED: Officer detect via pathname
  const isOfficer = location.pathname.startsWith('/officer');
  const base = isOfficer ? '/officer' : '/admin-dashboard';

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, transRes] = await Promise.all([
        fetch(`${API_BASE}/invoice/all`),
        fetch(`${API_BASE}/transaction/all`)
      ]);

      const invoices = await invRes.json();
      const transactions = await transRes.json();

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      let monthlyStats = months.map(month => ({
        name: month,
        income: 0,
        expense: 0,
        profit: 0
      }));

      const isWithinRange = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr).toISOString().split('T')[0];
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        if (!fromDate && !toDate) {
          return new Date(dateStr).getFullYear() === new Date().getFullYear();
        }
        return true;
      };

      if (invRes.ok) {
        invoices.forEach(inv => {
          if (inv.paidAmount > 0 && isWithinRange(inv.date)) {
            const monthIndex = new Date(inv.date).getMonth();
            monthlyStats[monthIndex].income += inv.paidAmount;
          }
        });
      }

      if (transRes.ok) {
        transactions.forEach(t => {
          if (isWithinRange(t.date)) {
            const monthIndex = new Date(t.date).getMonth();
            if (t.type === 'income') {
              monthlyStats[monthIndex].income += t.amount;
            } else if (t.type === 'expense') {
              monthlyStats[monthIndex].expense += t.amount;
            }
          }
        });
      }

      const finalData = monthlyStats.map(item => ({
        ...item,
        profit: item.income - item.expense
      }));

      setChartData(finalData);
    } catch (err) {
      console.error("Error fetching graph data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [fromDate, toDate]);

  return (
    <div className="graph-container">
      
      <div className="graph-header-section">
        <div className="header-left">
          {/* ✅ FIXED: Back goes to correct accounts page */}
          <button className="modern-back-btn" onClick={() => navigate(`${base}/accounts`)}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h2>Financial Overview</h2>
        </div>

        <div className="graph-filters">
          <div className="date-input-group">
            <Calendar size={16} />
            <label>From:</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="date-input-group">
            <Calendar size={16} />
            <label>To:</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          {(fromDate || toDate) && (
            <button className="clear-filter-btn" onClick={() => { setFromDate(''); setToDate(''); }}>
              <X size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="chart-wrapper mt-5">
        {loading ? (
          <div className="chart-loader">
            <p>Processing data...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="income" name="Income" barSize={35} fill="#32e90e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" barSize={35} fill="#ff0000" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#ff6404" strokeWidth={4} dot={{r: 6, fill: '#ff6404'}} activeDot={{ r: 8 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="graph-summary">
        <div className="summary-card income">
          <span>Total Income</span>
          <h3>₹ {chartData.reduce((acc, curr) => acc + curr.income, 0).toLocaleString()}</h3>
        </div>
        <div className="summary-card expense">
          <span>Total Expense</span>
          <h3>₹ {chartData.reduce((acc, curr) => acc + curr.expense, 0).toLocaleString()}</h3>
        </div>
        <div className="summary-card profit">
          <span>Net Profit</span>
          <h3 style={{ color: chartData.reduce((acc, curr) => acc + curr.profit, 0) >= 0 ? '#ff6404' : '#d32f2f' }}>
            ₹ {chartData.reduce((acc, curr) => acc + curr.profit, 0).toLocaleString()}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default FinancialGraph;
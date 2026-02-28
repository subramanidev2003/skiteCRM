import React, { useState, useEffect } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area 
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import './FinancialGraph.css'; // CSS தனியாக கீழே உள்ளது

// const API_BASE = 'https://skitecrm-1l7f.onrender.com/api';

const FinancialGraph = () => {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH & PROCESS DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Invoices & Transactions
        const [invRes, transRes] = await Promise.all([
          fetch(`${API_BASE}/invoice/all`),
          fetch(`${API_BASE}/transaction/all`)
        ]);

        const invoices = await invRes.json();
        const transactions = await transRes.json();

        // 2. Initialize Monthly Data Structure
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = new Date().getFullYear();
        
        // மாதம் வாரியாக டேட்டாவை சேமிக்க ஒரு டெம்ப்ளேட்
        let monthlyStats = months.map(month => ({
          name: month,
          income: 0,
          expense: 0,
          profit: 0
        }));

        // 3. Process Invoice Income (Paid Amounts)
        if (invRes.ok) {
          invoices.forEach(inv => {
            if (inv.paidAmount > 0) {
              const date = new Date(inv.date); // அல்லது inv.updatedAt
              if (date.getFullYear() === currentYear) {
                const monthIndex = date.getMonth();
                monthlyStats[monthIndex].income += inv.paidAmount;
              }
            }
          });
        }

        // 4. Process Transactions (Manual Income & Expense)
        if (transRes.ok) {
          transactions.forEach(t => {
            const date = new Date(t.date);
            if (date.getFullYear() === currentYear) {
              const monthIndex = date.getMonth();
              if (t.type === 'income') {
                monthlyStats[monthIndex].income += t.amount;
              } else if (t.type === 'expense') {
                monthlyStats[monthIndex].expense += t.amount;
              }
            }
          });
        }

        // 5. Calculate Profit
        monthlyStats = monthlyStats.map(item => ({
          ...item,
          profit: item.income - item.expense
        }));

        setChartData(monthlyStats);

      } catch (err) {
        console.error("Error fetching graph data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="graph-container">
      
      <div className="header-left">
            {/* ✅ UPDATED BUTTON */}
            <button className="modern-back-btn" onClick={() => navigate('/admin-dashboard/accounts')}>
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>
            <h2>Financial Overview</h2>
        </div>

      <div className="chart-wrapper mt-5">
        {loading ? (
          <p>Loading Chart...</p>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid stroke="#f5f5f5" />
              <XAxis dataKey="name" scale="point" padding={{ left: 20, right: 20 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              
              {/* Income Bar (Blue) */}
              <Bar dataKey="income" name="Income" barSize={20} fill="#32e90e" radius={[4, 4, 0, 0]} />
              
              {/* Expense Bar (Dark Blue) */}
              <Bar dataKey="expense" name="Expenses" barSize={20} fill="#ff0000" radius={[4, 4, 0, 0]} />
              
              {/* Profit Line (Red/Orange) */}
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#ff6404" strokeWidth={3} dot={{r: 4}} />
            
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="graph-summary">
        <div className="summary-card">
            <span>Total Income</span>
            <h3 style={{color: '#32e90e'}}>₹ {chartData.reduce((acc, curr) => acc + curr.income, 0).toLocaleString()}</h3>
        </div>
        <div className="summary-card">
            <span>Total Expense</span>
            <h3 style={{color: '#ff0000'}}>₹ {chartData.reduce((acc, curr) => acc + curr.expense, 0).toLocaleString()}</h3>
        </div>
        <div className="summary-card">
            <span>Net Profit</span>
            <h3 style={{color: '#ff6404'}}>₹ {chartData.reduce((acc, curr) => acc + curr.profit, 0).toLocaleString()}</h3>
        </div>
      </div>

    </div>
  );
};

export default FinancialGraph;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ReceiptIndianRupee, TrendingUp, BarChart2 } from 'lucide-react'; // BarChart2 icon import
import './Accounts.css';

const Accounts = () => {
  const navigate = useNavigate();

  return (
    <div className="accounts-container">
      
      <div className="accounts-header">
        <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
          <ArrowLeft size={24} color="#333" />
        </button>
        <h2>Accounts Department</h2>
      </div>

      <div className="accounts-grid">
        
        {/* Card 1: Invoice Payment */}
        <div className="account-card" onClick={() => navigate('/admin-dashboard/invoice-payment')}>
          <div className="icon-box orange">
            <ReceiptIndianRupee size={40} color="#fff" />
          </div>
          <h3>Invoice Payment</h3>
          <p>Manage customer invoice payments and status.</p>
        </div>

        {/* Card 2: Income & Expense */}
        <div className="account-card" onClick={() => navigate('/admin-dashboard/income-expense')}>
          <div className="icon-box green">
            <TrendingUp size={40} color="#fff" />
          </div>
          <h3>Income & Expense</h3>
          <p>Track daily income and operational expenses.</p>
        </div>

        {/* ✅ Card 3: NEW Profit Graph */}
        <div className="account-card" onClick={() => navigate('/admin-dashboard/financial-graph')}>
          <div className="icon-box blue" style={{background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'}}>
            <BarChart2 size={40} color="#fff" />
          </div>
          <h3>Profit Graph</h3>
          <p>Visual analytics of Income, Expense & Profit.</p>
        </div>

      </div>
    </div>
  );
};

export default Accounts;
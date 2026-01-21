import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Wallet, FileText, CheckCircle, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './IncomeExpense.css';

const API_BASE = 'https://skitecrm.onrender.com/api';

const IncomeExpense = () => {
  const navigate = useNavigate();
  
  // Data State
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [manualIncomes, setManualIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState({
    from: new Date().toISOString().slice(0, 8) + '01', 
    to: new Date().toISOString().split('T')[0]         
  });

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({ 
    description: '', 
    amount: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const invRes = await fetch(`${API_BASE}/invoice/all`);
      const invData = await invRes.json();
      if (invRes.ok) setInvoices(invData);

      const transRes = await fetch(`${API_BASE}/transaction/all`);
      const transData = await transRes.json();
      if (transRes.ok) {
        setExpenses(transData.filter(t => t.type === 'expense'));
        setManualIncomes(transData.filter(t => t.type === 'income'));
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- FILTER LOGIC ---
  const filterByDate = (data) => {
    if (!dateFilter.from || !dateFilter.to) return data;
    const from = new Date(dateFilter.from).setHours(0,0,0,0);
    const to = new Date(dateFilter.to).setHours(23,59,59,999);

    return data.filter(item => {
      const itemDate = new Date(item.date).getTime();
      return itemDate >= from && itemDate <= to;
    });
  };

  const filteredInvoices = filterByDate(invoices);
  const filteredExpenses = filterByDate(expenses);
  const filteredManualIncomes = filterByDate(manualIncomes);

  // --- CALCULATIONS ---
  const invoiceIncome = filteredInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const manualIncomeTotal = filteredManualIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  
  // மொத்த வருமானம்
  const totalIncome = invoiceIncome + manualIncomeTotal;
  
  // மொத்த செலவு
  const totalExpense = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // ✅ Net Balance (வருமானம் - செலவு)
  const netBalance = totalIncome - totalExpense;

  // --- HANDLERS ---
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if(!expenseForm.description || !expenseForm.amount) return toast.warning("Fill all fields");

    try {
      const res = await fetch(`${API_BASE}/transaction/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expenseForm, type: 'expense', category: 'General' }) 
      });

      if (res.ok) {
        toast.success("Expense Added!");
        fetchData();
        setExpenseForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      }
    } catch (err) { toast.error("Server Error"); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this?")) return;
    try {
      await fetch(`${API_BASE}/transaction/delete/${id}`, { method: 'DELETE' });
      toast.success("Deleted");
      fetchData();
    } catch (err) { toast.error("Error deleting"); }
  };

  return (
    <div className="ie-container">
      
      {/* HEADER */}
      <div className="ie-header">
        <div className="header-left">
                    {/* ✅ UPDATED BUTTON */}
                    <button className="modern-back-btn" onClick={() => navigate('/admin-dashboard/accounts')}>
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    <h2>Accounts Overview</h2>
                </div>
        
        {/* Optional: Show Total Revenue separately here if needed */}
        <div className="net-balance-card" style={{background: '#e0f2fe', border: '1px solid #bae6fd'}}>
            <span style={{color: '#0284c7'}}>Total Revenue</span>
            <h4 style={{margin:0, color: '#0369a1'}}>₹ {totalIncome.toLocaleString()}</h4>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-group">
            <Filter size={18} color="#555"/>
            <span>Filter by Date:</span>
        </div>
        <div className="date-inputs">
            <label>From:</label>
            <input 
                type="date" 
                value={dateFilter.from} 
                onChange={(e) => setDateFilter({...dateFilter, from: e.target.value})}
            />
            <label>To:</label>
            <input 
                type="date" 
                value={dateFilter.to} 
                onChange={(e) => setDateFilter({...dateFilter, to: e.target.value})}
            />
        </div>
      </div>

      {/* GRID LAYOUT */}
      <div className="ie-grid-layout">
        
        {/* --- LEFT COLUMN: NET BALANCE (Income - Expense) --- */}
        <div className="column-section income-section">
            <div className="section-header green-header">
                <TrendingUp size={20} /> 
                {/* ✅ CHANGE HERE: Showing Net Balance instead of Total Income */}
                <div>
                  <h3 style={{margin:0}}>Cash in Hand: ₹ {netBalance.toLocaleString()}</h3>
                  <span style={{fontSize: '12px', fontWeight: 'normal'}}>(Income - Expense)</span>
                </div>
            </div>

            <div className="scrollable-list">
                <h4 className="list-title">Income Sources</h4>
                {filteredInvoices.filter(inv => (inv.paidAmount || 0) > 0).map(inv => (
                    <div key={inv._id} className="income-item invoice-item">
                        <div className="item-left">
                            <FileText size={16} color="#555"/>
                            <div>
                                <span className="item-name">{inv.clientDetails.name}</span>
                                <span className="item-sub">{new Date(inv.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="item-amount green-text">
                            + ₹ {inv.paidAmount.toLocaleString()}
                        </div>
                    </div>
                ))}
                 {/* Manual Incomes List... */}
                 {filteredManualIncomes.map(inc => (
                    <div key={inc._id} className="income-item">
                        <div className="item-left">
                            <CheckCircle size={16} color="#10b981"/>
                            <div>
                                <span className="item-name">{inc.description}</span>
                                <span className="item-sub">{new Date(inc.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="item-right">
                            <span className="item-amount green-text">+ ₹ {inc.amount.toLocaleString()}</span>
                            <button onClick={() => handleDelete(inc._id)} className="icon-del"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- RIGHT COLUMN: EXPENSE --- */}
        <div className="column-section expense-section">
            <div className="section-header red-header">
                <TrendingDown size={20} />
                <h3>Total Expense: ₹ {totalExpense.toLocaleString()}</h3>
            </div>

            <form className="expense-form" onSubmit={handleAddExpense}>
                <div className="input-row">
                    <input 
                        type="date" 
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                        style={{width: '130px'}} 
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Expense Description" 
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                        style={{flex: 2}}
                        required
                    />
                    <input 
                        type="number" 
                        placeholder="Amount" 
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                        style={{flex: 1}}
                        required
                    />
                    <button type="submit"><Plus size={18}/></button>
                </div>
            </form>

            <div className="scrollable-list">
                <h4 className="list-title">Expense List</h4>
                {filteredExpenses.map(exp => (
                    <div key={exp._id} className="income-item expense-item">
                        <div className="item-left">
                            <div className="dot red-dot"></div>
                            <div>
                                <span className="item-name">{exp.description}</span>
                                <span className="item-sub">{new Date(exp.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="item-right">
                            <span className="item-amount red-text">- ₹ {exp.amount.toLocaleString()}</span>
                            <button onClick={() => handleDelete(exp._id)} className="icon-del"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default IncomeExpense;
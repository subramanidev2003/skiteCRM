import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Search, FileText, FileX, Calendar, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE } from '../api';
import './Invoice.css'; 

import skitelogo from '../assets/skite-logo.jpg'; 
import skitesign from '../assets/sign.jpg';
import skiteseal from '../assets/seal.png'; 

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('gst'); 
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const senderDetails = {
    name: "SKITE",
    addressLine1: "No 5, Lord Avenue, Ganapathy",
    addressLine2: "Polyclinic, Gandhinagar, Coimbatore - 641021",
    gst: "33REAPS5023G1ZE",
    email: "skitedigital.in@gmail.com",
    website: "www.skitedigital.in",
    phone: "8754281434"
  };

  const bankDetails = {
    bankName: "Union Bank of India", accountNo: "252511010000196",
    ifsc: "UBIN0825255", branch: "Sundarapuram", accountName: "SKITE"
  };

  // ✅ FIX: officerToken add பண்ணினேன்
  const officerToken = localStorage.getItem('officerToken');
  const token = localStorage.getItem('adminToken') || 
                localStorage.getItem('accountantToken') || 
                officerToken;

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE}/invoice/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setInvoices(Array.isArray(data) ? data : []);
    } catch (error) { toast.error("Server Error"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE}/invoice/delete/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Deleted!");
        setInvoices(prev => prev.filter(inv => inv._id !== id));
      }
    } catch (error) { toast.error("Error deleting"); }
  };

  const numberToWords = (price) => {
    const sglDigit = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"];
    const dblDigit = ["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tensPlace = ["","Ten","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    const convert = (num) => {
      if (num < 10) return sglDigit[num];
      if (num < 20) return dblDigit[num - 10];
      if (num < 100) return tensPlace[Math.floor(num/10)] + (num%10 !== 0 ? " " + sglDigit[num%10] : "");
      if (num < 1000) return sglDigit[Math.floor(num/100)] + " Hundred" + (num%100 !== 0 ? " and " + convert(num%100) : "");
      if (num < 100000) return convert(Math.floor(num/1000)) + " Thousand" + (num%1000 !== 0 ? " " + convert(num%1000) : "");
      if (num < 10000000) return convert(Math.floor(num/100000)) + " Lakh" + (num%100000 !== 0 ? " " + convert(num%100000) : "");
      return "";
    };
    const num = Math.floor(price);
    return num === 0 ? "Zero Rupees Only" : "Indian Rupees " + convert(num) + " Only";
  };

  const filteredInvoices = invoices.filter(inv => {
    const isGST = inv.taxRate && Number(inv.taxRate) > 0;
    if (activeTab === 'gst'    && !isGST) return false;
    if (activeTab === 'nongst' &&  isGST) return false;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (inv.clientDetails?.name  || '').toLowerCase().includes(searchLower) ||
      (inv.invoiceNo            || '').toLowerCase().includes(searchLower) ||
      (inv.clientDetails?.gstNo || '').toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;

    if (fromDate || toDate) {
        const d = new Date(inv.date);
        const invDateString = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (fromDate && invDateString < fromDate) return false;
        if (toDate   && invDateString > toDate)   return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const downloadAllInvoicesBulk = async () => {
    if (filteredInvoices.length === 0) return toast.warning("No records to download!");

    const invoicesToDownload = [...filteredInvoices].reverse();
    const doc = new jsPDF();
    const orangeColor = [255, 69, 0];

    const getImageBase64 = (imgSrc) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpg'));
      };
      img.onerror = () => resolve(null);
      img.src = imgSrc;
    });

    let logoBase64 = await getImageBase64(skitelogo);
    let signBase64 = await getImageBase64(skitesign);
    let sealBase64 = await getImageBase64(skiteseal);

    for (let i = 0; i < invoicesToDownload.length; i++) {
      if (i > 0) doc.addPage();
      const inv = invoicesToDownload[i];

      if (logoBase64) doc.addImage(logoBase64, 'JPG', 14, 10, 40, 29);
      doc.setFontSize(10).setFont("helvetica","bold").setTextColor(0).text("SKITE", 14, 40);
      doc.setFont("helvetica","normal").text(senderDetails.addressLine1, 14, 46);
      doc.text(senderDetails.addressLine2, 14, 51);
      doc.text(`GST NO: ${senderDetails.gst}`, 14, 57);
      doc.setFontSize(22).setTextColor(255,69,0).text("INVOICE", 195, 25, { align: 'right' });

      const infoY = 75;
      doc.setFontSize(10).setTextColor(0).setFont("helvetica","bold").text("ISSUED TO:", 14, infoY);
      doc.setFont("helvetica","normal").text(inv.clientDetails?.name || "N/A", 14, infoY+6);
      doc.text(inv.clientDetails?.addressLine1 || "", 14, infoY+11);
      doc.text(inv.clientDetails?.location || "", 14, infoY+16);
      if (inv.clientDetails?.gstNo) { doc.setFont("helvetica","bold").text(`GST: ${inv.clientDetails.gstNo}`, 14, infoY+22); }

      doc.setFont("helvetica","bold").text("INVOICE NO:", 120, infoY);
      doc.setFont("helvetica","normal").text(inv.invoiceNo, 155, infoY);
      doc.setFont("helvetica","bold").text("DATE:", 120, infoY+6);
      doc.setFont("helvetica","normal").text(new Date(inv.date).toLocaleDateString('en-GB'), 155, infoY+6);

      const tableBody = inv.items.map(item => [
        item.description, item.hsn, Number(item.price||0).toFixed(2), item.qty, (item.price * item.qty).toFixed(2)
      ]);
      tableBody.push(
        ['','','','Subtotal', Number(inv.subtotal||0).toFixed(2)],
        ['','','',`CGST ${inv.taxRate}%`, Number(inv.cgst||0).toFixed(2)],
        ['','','',`SGST ${inv.taxRate}%`, Number(inv.sgst||0).toFixed(2)],
        ['','','','TOTAL', Number(inv.grandTotal||0).toFixed(2)]
      );

      autoTable(doc, {
        startY: infoY+30,
        head: [['DESCRIPTION','HSN','UNIT PRICE','QTY','TOTAL']],
        body: tableBody, theme: 'grid',
        headStyles: { fillColor: orangeColor },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 80 }, 4: { halign: 'right' } }
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10).setFont("helvetica","bold").text("Amount in Words:", 14, finalY);
      doc.setFont("helvetica","italic").text(numberToWords(inv.grandTotal), 45, finalY);
      doc.setFont("helvetica","normal").text("PAY TO:", 14, finalY+15);
      doc.setFont("helvetica","bold").text(bankDetails.bankName, 14, finalY+20);
      doc.setFont("helvetica","normal");
      doc.text(`Acc No: ${bankDetails.accountNo}`, 14, finalY+25);
      doc.text(`IFSC: ${bankDetails.ifsc}`, 14, finalY+30);
      doc.text("for SKITE", 150, finalY+35);
      if (signBase64) doc.addImage(signBase64, 'JPG', 140, finalY+40, 50, 20);
      if (sealBase64) doc.addImage(sealBase64, 'PNG', 75, finalY+15, 60, 60);
      doc.setFont("helvetica","bold").text("Authorised Signatory", 150, finalY+65);
    }
    doc.save(`Skite_Bulk_Invoices_${activeTab}_${new Date().getTime()}.pdf`);
  };

  // ✅ FIX: Back & Create New — officer → /officer paths
  const handleBack = () => {
    if (officerToken) return navigate('/officer-dashboard');
    return navigate('/admin-dashboard');
  };

  const handleCreateNew = () => {
    if (officerToken) return navigate('/officer/invoice');
    return navigate('/admin-dashboard/invoice');
  };

  const handleRowClick = (id) => {
    if (officerToken) return navigate(`/officer/invoice/${id}`);
    return navigate(`/admin-dashboard/invoice/${id}`);
  };

  return (
    <div className="history-page-container">
      <div className="history-header">
        <div className="header-left">
          {/* ✅ FIX: Back → correct dashboard */}
          <button onClick={handleBack} className="back-btn-modern"><ArrowLeft size={18} /> Dashboard</button>
          <h1>Invoice History</h1>
        </div>
        <div className="header-right">
          <button onClick={downloadAllInvoicesBulk} className="btn-bulk-download"><Download size={18} /> Bulk PDF Download</button>
          {/* ✅ FIX: Create New → correct path */}
          <button onClick={handleCreateNew} className="btn-create-new"><Plus size={18} /> Create New</button>
        </div>
      </div>

      <div className="tabs-wrapper">
        <button className={activeTab === 'gst'    ? 'tab active' : 'tab'} onClick={() => setActiveTab('gst')}><FileText size={18} /> GST Invoices</button>
        <button className={activeTab === 'nongst' ? 'tab active' : 'tab'} onClick={() => setActiveTab('nongst')}><FileX size={18} /> Without GST</button>
      </div>

      <div className="filters-bar-container">
        <div className="search-box"><Search size={18} /><input type="text" placeholder="Search Client, Inv No or GST..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <div className="date-filters">
          <div className="date-input-group"><Calendar size={16}/><label>From:</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
          <div className="date-input-group"><Calendar size={16}/><label>To:</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
          {(searchTerm || fromDate || toDate) && <button className="clear-filters-btn" onClick={() => {setSearchTerm(''); setFromDate(''); setToDate('');}}><X size={16}/> Clear</button>}
        </div>
      </div>

      <div className="history-table-wrapper">
        {loading ? <div className="loading-state">Loading...</div> : (
          <table className="history-main-table">
            <thead>
              <tr>
                <th>INVOICE NO</th><th>DATE</th><th>CLIENT NAME</th><th>GST NO</th><th>AMOUNT</th><th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 
                ? <tr><td colSpan="6" className="empty-row">No Invoices Found.</td></tr>
                : filteredInvoices.map((inv) => (
                  <tr key={inv._id} onClick={() => handleRowClick(inv._id)}>
                    <td className="inv-no-cell">{inv.invoiceNo}</td>
                    <td>{new Date(inv.date).toLocaleDateString('en-GB')}</td>
                    <td className="client-name-cell">{inv.clientDetails?.name || 'N/A'}</td>
                    <td style={{fontWeight:'bold', color: inv.clientDetails?.gstNo ? '#28a745' : '#888'}}>
                      {inv.clientDetails?.gstNo || '---'}
                    </td>
                    <td className="amount-cell">₹ {inv.grandTotal?.toLocaleString('en-IN')}</td>
                    <td><button onClick={(e) => { e.stopPropagation(); handleDelete(inv._id); }} className="delete-icon-btn"><Trash2 size={18} /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistory;
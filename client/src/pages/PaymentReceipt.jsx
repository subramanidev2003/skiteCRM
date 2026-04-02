import React, { useState } from 'react';
import { ArrowLeft, Download, Save, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import { API_BASE } from '../api';
import './Quote.css'; // reuse same CSS

import skitelogo from '../assets/skite-logo.jpg';
import skitesign from '../assets/sign.jpg';
import skiteseal from '../assets/seal.png';

const PaymentReceipt = () => {
  const navigate = useNavigate();
  const isSales = !!localStorage.getItem("salesUser");

  const senderDetails = {
    name: "SKITE",
    gst: "33REAPS5023G1ZE",
    email: "skitedigital.in@gmail.com",
    website: "www.skitedigital.in",
    phone: "8754281434",
    address: "No 5, Lord Avenue, Ganapathy Polyclinic, Gandhinagar, Coimbatore - 641021"
  };

  const bankDetails = {
    bankName: "Union Bank of India",
    accountName: "SKITE",
    accountNo: "252511010000196",
    ifsc: "UBIN0825255",
    branch: "Sundarapuram"
  };

  const [receiptMeta, setReceiptMeta] = useState({
    receiptNo: 'RCP001',
    date: new Date().toISOString().split('T')[0]
  });

  const [clientDetails, setClientDetails] = useState({
    name: '',
    address: '',
    gst: ''
  });

  const [paymentDetails, setPaymentDetails] = useState({
    utrNo: '',
    paymentMode: 'Bank Transfer',
    amountPaid: '',
    description: '',
    balanceAmount: ''
  });

  const paymentModes = ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'NEFT', 'RTGS', 'IMPS'];

  // --- Save to DB ---
  const saveReceiptToDB = async () => {
    if (!clientDetails.name) { toast.error("Please enter Client Name!"); return; }
    if (!paymentDetails.amountPaid) { toast.error("Please enter Amount Paid!"); return; }

    const receiptData = {
      receiptNo: receiptMeta.receiptNo,
      date: receiptMeta.date,
      clientDetails,
      paymentDetails: {
        ...paymentDetails,
        amountPaid: parseFloat(paymentDetails.amountPaid) || 0,
        balanceAmount: parseFloat(paymentDetails.balanceAmount) || 0
      }
    };

    try {
      const response = await fetch(`${API_BASE}/receipt/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData)
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Receipt Saved Successfully!");
      } else {
        toast.error(data.message || "Failed to save receipt");
      }
    } catch (error) {
      toast.error("Server Error");
    }
  };

  const getImageBase64 = (imgSrc) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imgSrc;
    });
  };

  // --- PDF Generation ---
  const generatePDF = async () => {
    let fileName = prompt("Enter PDF File Name:", `Receipt_${receiptMeta.receiptNo}`);
    if (fileName === null) return;
    if (!fileName.trim()) fileName = `Receipt_${receiptMeta.receiptNo}`;
    if (!fileName.endsWith('.pdf')) fileName += '.pdf';

    const doc = new jsPDF();
    const orange = [255, 69, 0];
    const lightOrange = [255, 239, 234];

    // --- LOGO ---
    try { const lb = await getImageBase64(skitelogo); doc.addImage(lb, 'PNG', 14, 10, 40, 29); } catch (e) {}

    // --- Company Info ---
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text("SKITE", 14, 43);
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(senderDetails.address, 14, 48);
    doc.text(`Email: ${senderDetails.email}  |  Phone: ${senderDetails.phone}`, 14, 53);
    doc.text(`GSTIN: ${senderDetails.gst}`, 14, 58);

    // --- RECEIPT Title ---
    doc.setFontSize(26); doc.setTextColor(...orange); doc.setFont("helvetica", "bold");
    doc.text("RECEIPT", 196, 22, { align: 'right' });

    // --- Orange line separator ---
    doc.setDrawColor(...orange); doc.setLineWidth(0.8);
    doc.line(14, 63, 196, 63);

    // --- Receipt Meta Box ---
    doc.setFillColor(...lightOrange);
    doc.roundedRect(130, 68, 66, 22, 2, 2, 'F');
    doc.setFontSize(9); doc.setTextColor(...orange); doc.setFont("helvetica", "bold");
    doc.text("RECEIPT NO:", 133, 75);
    doc.text("DATE:", 133, 82);
    doc.setTextColor(0); doc.setFont("helvetica", "normal");
    doc.text(receiptMeta.receiptNo, 163, 75);
    const d = new Date(receiptMeta.date);
    doc.text(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`, 163, 82);

    // --- RECEIVED FROM ---
    doc.setFontSize(9); doc.setTextColor(...orange); doc.setFont("helvetica", "bold");
    doc.text("RECEIVED FROM:", 14, 75);
    doc.setFontSize(11); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text(clientDetails.name || 'Client Name', 14, 82);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);

    let cy = 87;
    if (clientDetails.address) {
      const lines = doc.splitTextToSize(clientDetails.address, 110);
      lines.forEach(l => { doc.text(l, 14, cy); cy += 4.5; });
    }
    if (clientDetails.gst) { doc.text(`GSTIN: ${clientDetails.gst}`, 14, cy); cy += 5; }

    // --- Orange line ---
    doc.setDrawColor(...orange); doc.setLineWidth(0.5);
    doc.line(14, Math.max(cy + 2, 95), 196, Math.max(cy + 2, 95));

    let tableY = Math.max(cy + 7, 100);

    // --- Payment Details Table ---
    const amountPaid = parseFloat(paymentDetails.amountPaid) || 0;
    const balanceAmount = parseFloat(paymentDetails.balanceAmount) || 0;

    const tableBody = [
      ['Description / Service', paymentDetails.description || 'Payment Received'],
      ['Payment Mode', paymentDetails.paymentMode],
      ['UTR / Transaction No', paymentDetails.utrNo || '-'],
      ['Amount Paid', `₹ ${amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
    ];
    if (balanceAmount > 0) {
      tableBody.push(['Balance Amount', `₹ ${balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`]);
    }

    autoTable(doc, {
      startY: tableY,
      body: tableBody,
      theme: 'grid',
      tableLineColor: orange,
      tableLineWidth: 0.1,
      margin: { left: 14, right: 14 },
      bodyStyles: { textColor: 0, cellPadding: 4, lineColor: orange, lineWidth: 0.1, fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold', fillColor: lightOrange, textColor: orange },
        1: { cellWidth: 102, fontStyle: 'normal' }
      }
    });

    let currentY = doc.lastAutoTable.finalY + 5;

    // --- TOTAL PAID Box ---
    doc.setFillColor(...orange);
    doc.roundedRect(14, currentY, 182, 12, 2, 2, 'F');
    doc.setFontSize(12); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
    doc.text("TOTAL AMOUNT RECEIVED", 20, currentY + 8);
    doc.text(`₹ ${amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 193, currentY + 8, { align: 'right' });

    currentY += 20;

    // --- Amount in Words ---
    doc.setFontSize(9); doc.setTextColor(100); doc.setFont("helvetica", "italic");
    const inWords = numberToWords(amountPaid);
    doc.text(`Amount in Words: ${inWords} Only`, 14, currentY);

    currentY += 12;

    // --- Bank Details ---
    doc.setFontSize(10); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text("Our Bank Details:", 14, currentY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Bank: ${bankDetails.bankName}  |  A/C: ${bankDetails.accountNo}  |  IFSC: ${bankDetails.ifsc}  |  Branch: ${bankDetails.branch}`, 14, currentY + 6);

    currentY += 18;

    if (currentY + 50 > 280) { doc.addPage(); currentY = 20; }

    // --- Seal & Sign ---
    try { const sl = await getImageBase64(skiteseal); doc.addImage(sl, 'PNG', 75, currentY - 8, 50, 55); } catch (e) {}
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0);
    doc.text("for SKITE", 150, currentY + 5);
    try { const sg = await getImageBase64(skitesign); doc.addImage(sg, 'PNG', 140, currentY + 5, 55, 25); } catch (e) {}
    doc.setFont("helvetica", "bold");
    doc.text("Authorised Signatory", 150, currentY + 38);

    // --- Footer ---
    doc.setDrawColor(...orange); doc.setLineWidth(0.5);
    doc.line(14, 285, 196, 285);
    doc.setFontSize(8); doc.setTextColor(150); doc.setFont("helvetica", "normal");
    doc.text("This is a Computer Generated Receipt", 105, 291, { align: 'center' });

    doc.save(fileName);
  };

  // Number to Words helper
  const numberToWords = (num) => {
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if (num === 0) return 'Zero Rupees';
    const inWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n/10)] + (n%10 ? ' ' + a[n%10] : '');
      if (n < 1000) return a[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + inWords(n%100) : '');
      if (n < 100000) return inWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + inWords(n%1000) : '');
      if (n < 10000000) return inWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + inWords(n%100000) : '');
      return inWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + inWords(n%10000000) : '');
    };
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let result = inWords(rupees) + ' Rupees';
    if (paise > 0) result += ' and ' + inWords(paise) + ' Paise';
    return result;
  };

// ✅ புதியது - இதை போடுங்க
const storedUser = JSON.parse(
  localStorage.getItem("adminUser") || 
  localStorage.getItem("managerUser") || 
  localStorage.getItem("userData") || '{}'
);
const isManager = storedUser?.role?.toLowerCase() === 'manager';

const handleBack = () => {
  if (isSales) navigate('/sales-dashboard');
  else if (isManager) navigate('/manager-dashboard');
  else navigate('/admin-dashboard');
};

const handleHistory = () => {
  if (isSales) navigate('/sales-dashboard/receipt-history');
  else navigate('/admin-dashboard/receipt-history');
};
  const amountPaid = parseFloat(paymentDetails.amountPaid) || 0;
  const balanceAmount = parseFloat(paymentDetails.balanceAmount) || 0;

  return (
    <div className="quote-container">
      {/* HEADER */}
      <div className="quote-header-nav">
        <div className="quote-header-left">
          <button onClick={handleBack} className="modern-back-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e0e0e0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#4b5563', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <ArrowLeft size={20} />
            <span>{isSales ? 'Sales Panel' : 'Admin Dashboard'}</span>
          </button>
          <h2>Payment Receipt</h2>
        </div>
        <div className="header-actions">
          <button className="action-btn history-btn" onClick={handleHistory}>
            <History size={18} /> History
          </button>
          <button className="action-btn save-btn" onClick={saveReceiptToDB}>
            <Save size={18} /> Save
          </button>
          <button className="action-btn pdf-btn" onClick={generatePDF}>
            <Download size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="quote-workspace">
        {/* LEFT: FORM */}
        <div className="quote-form">

          {/* Receipt Details */}
          <div className="form-section">
            <h3>Receipt Details</h3>
            <div className="row-inputs" style={{ display: 'flex', gap: '12px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Receipt No</label>
                <input type="text" value={receiptMeta.receiptNo}
                  onChange={(e) => setReceiptMeta({...receiptMeta, receiptNo: e.target.value})} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Date</label>
                <input type="date" value={receiptMeta.date}
                  onChange={(e) => setReceiptMeta({...receiptMeta, date: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="form-section">
            <h3>Client Details</h3>
            <div className="input-group">
              <label>Client / Business Name</label>
              <input type="text" value={clientDetails.name}
                onChange={(e) => setClientDetails({...clientDetails, name: e.target.value})}
                placeholder="Enter Client or Business Name" />
            </div>
            <div className="input-group">
              <label>Client GSTIN</label>
              <input type="text" value={clientDetails.gst}
                onChange={(e) => setClientDetails({...clientDetails, gst: e.target.value.toUpperCase()})}
                placeholder="GST Number (Optional)" />
            </div>
            <div className="input-group full-width" style={{ marginTop: '10px' }}>
              <label>Client Address</label>
              <textarea value={clientDetails.address}
                onChange={(e) => setClientDetails({...clientDetails, address: e.target.value})}
                placeholder="Enter Billing Address" rows="3"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            </div>
          </div>

          {/* Payment Details */}
          <div className="form-section">
            <h3>Payment Details</h3>
            <div className="input-group">
              <label>Description / Service</label>
              <input type="text" value={paymentDetails.description}
                onChange={(e) => setPaymentDetails({...paymentDetails, description: e.target.value})}
                placeholder="e.g. Website Development - 50% Advance" />
            </div>
            <div className="row-inputs" style={{ display: 'flex', gap: '12px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Payment Mode</label>
                <select value={paymentDetails.paymentMode}
                  onChange={(e) => setPaymentDetails({...paymentDetails, paymentMode: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}>
                  {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>UTR / Transaction No</label>
                <input type="text" value={paymentDetails.utrNo}
                  onChange={(e) => setPaymentDetails({...paymentDetails, utrNo: e.target.value})}
                  placeholder="UTR Number" />
              </div>
            </div>
            <div className="row-inputs" style={{ display: 'flex', gap: '12px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Amount Paid (₹)</label>
                <input type="number" value={paymentDetails.amountPaid}
                  onChange={(e) => setPaymentDetails({...paymentDetails, amountPaid: e.target.value})}
                  placeholder="0.00" onWheel={(e) => e.target.blur()} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Balance Amount (₹)</label>
                <input type="number" value={paymentDetails.balanceAmount}
                  onChange={(e) => setPaymentDetails({...paymentDetails, balanceAmount: e.target.value})}
                  placeholder="0.00 (Optional)" onWheel={(e) => e.target.blur()} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="quote-preview">
          {/* Header */}
          <div className="preview-header">
            <div className="preview-company">
              <div className="company-logo-box"><span>SKITE</span></div>
              <h2>SKITE</h2>
              <p>{senderDetails.email}</p>
              <p>{senderDetails.phone}</p>
              <p>GST: {senderDetails.gst}</p>
            </div>
            <div className="preview-quote-info">
              <h2 style={{ color: '#FF4500' }}>RECEIPT</h2>
              <p><strong>NO:</strong> {receiptMeta.receiptNo}</p>
              <p><strong>DATE:</strong> {new Date(receiptMeta.date).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          {/* Client */}
          <div className="preview-client">
            <h4>RECEIVED FROM:</h4>
            <p style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{clientDetails.name || 'Client Name'}</p>
            {clientDetails.address && (
              <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0', fontSize: '0.9em', color: '#555' }}>{clientDetails.address}</p>
            )}
            {clientDetails.gst && <p style={{ fontWeight: '500' }}>GSTIN: {clientDetails.gst}</p>}
          </div>

          {/* Payment Table */}
          <table className="preview-table">
            <tbody>
              <tr>
                <td style={{ fontWeight: '600', color: '#FF4500', background: '#fff5f0', width: '45%' }}>Description</td>
                <td>{paymentDetails.description || 'Payment Received'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '600', color: '#FF4500', background: '#fff5f0' }}>Payment Mode</td>
                <td>{paymentDetails.paymentMode}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '600', color: '#FF4500', background: '#fff5f0' }}>UTR / Txn No</td>
                <td>{paymentDetails.utrNo || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '600', color: '#FF4500', background: '#fff5f0' }}>Amount Paid</td>
                <td style={{ fontWeight: '700', fontSize: '1.1em' }}>
                  ₹ {amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {balanceAmount > 0 && (
                <tr>
                  <td style={{ fontWeight: '600', color: '#FF4500', background: '#fff5f0' }}>Balance Amount</td>
                  <td style={{ color: '#e53e3e', fontWeight: '600' }}>
                    ₹ {balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Total Box */}
          <div style={{ background: '#FF4500', color: 'white', padding: '14px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0', fontWeight: '700', fontSize: '1.1em' }}>
            <span>TOTAL AMOUNT RECEIVED</span>
            <span>₹ {amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Amount in Words */}
          <p style={{ fontSize: '0.85em', color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
            {amountPaid > 0 ? `${numberToWords(amountPaid)} Only` : ''}
          </p>

          {/* Footer note */}
          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
            <p style={{ fontSize: '0.8em', color: '#999' }}>This is a Computer Generated Receipt</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
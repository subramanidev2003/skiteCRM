import React, { useState } from 'react';
import { ArrowLeft, Download, Plus, Trash2, Save, History } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify'; 
import './Quote.css'; 

// IMAGES IMPORT
import skitelogo from '../assets/skite-logo.jpg'; 
import skitesign from '../assets/sign.jpg'; 
import skiteseal from '../assets/seal.png'; 

const Quote = () => {
  const navigate = useNavigate();

  // --- SENDER DETAILS ---
  const senderDetails = {
    name: "SKITE",
    addressLine1: "No 5, Lord Avenue, Ganapathy",
    addressLine2: "Polyclinic, Gandhinagar,",
    addressLine3: "Coimbatore - 641021",
    gst: "33REAPS5023G1ZE",
    email: "skitedigital.in@gmail.com",
    website: "www.skitedigital.in",
    phone: "8754281434"
  };

  const bankDetails = {
    bankName: "Union Bank of India",
    accountName: "SKITE",
    accountNo: "252511010000196",
    ifsc: "UBIN0825255",
    branch: "Sundarapuram"
  };

  // --- STATE ---
  const [quoteMeta, setQuoteMeta] = useState({
    quoteNo: 'SKT34',
    date: new Date().toISOString().split('T')[0]
  });

  const [clientDetails, setClientDetails] = useState({
    name: '',
    businessName: '',
    addressLine1: '',
    addressLine2: '',
    location: ''
  });

  // ✅ ADDED QTY HERE
  const [items, setItems] = useState([
    { description: 'Social Media Poster', hsn: 'Monthly 10 Poster', price: 9000, qty: 1 }
  ]);

  const [taxRate, setTaxRate] = useState(18); 

  const [terms, setTerms] = useState(`50% advance payment required to start the project.
Final 50% on project completion before deployment.
The complete website will be built on our subdomain for preview and approval before final deployment.
Any additional page will be charged at Rs.1,500 per page.`);

  // --- CALCULATIONS (UPDATED WITH QTY) ---
  const calculateTotal = () => {
    // ✅ Price * Qty Logic Added
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, grandTotal };
  };

  const { subtotal, taxAmount, grandTotal } = calculateTotal();

  // --- HANDLERS ---
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    // ✅ Default Qty is 1
    setItems([...items, { description: '', hsn: '', price: 0, qty: 1 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // 💾 SAVE TO DB FUNCTION
  const saveQuoteToDB = async () => {
    if (!clientDetails.name) {
        toast.error("Please enter Client Name!");
        return;
    }

    try {
      const quoteData = {
        quoteNo: quoteMeta.quoteNo,
        date: quoteMeta.date,
        clientDetails: clientDetails,
        // ✅ Send Qty and Calculate Item Total for Backend
        items: items.map(item => ({
          ...item,
          total: item.price * item.qty
        })),
        subtotal,
        taxRate,
        taxAmount,
        grandTotal,
        terms
      };

      const response = await fetch('https://skitecrm.onrender.com/api/quote/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Quote Saved Successfully!");
      } else {
        toast.error(data.message || "Failed to save quote");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Server Error");
    }
  };

  // 🖨️ PDF GENERATION
  const generatePDF = async () => {
    
    let fileName = prompt("Enter PDF File Name:", `Quote_${quoteMeta.quoteNo}`);
    
    if (fileName === null) return;
    if (!fileName.trim()) fileName = `Quote_${quoteMeta.quoteNo}`;
    if (!fileName.endsWith('.pdf')) fileName += '.pdf';

    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    if (!window.jspdf.jsPDF.API.autoTable) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const orangeColor = [255, 69, 0];

    const formatCurrency = (num) => {
      return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    try {
        doc.addImage(skitelogo, 'JPG', 14, 10, 40, 29); 
    } catch (e) { console.error("Logo Error:", e); }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("SKITE", 14, 42);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Email: ${senderDetails.email}`, 14, 47);
    doc.text(`Phone: ${senderDetails.phone}`, 14, 52);
    doc.text(`Website: ${senderDetails.website}`, 14, 57);
    doc.text(`GSTIN: ${senderDetails.gst}`, 14, 62);

    doc.setFontSize(24);
    doc.setTextColor(255, 69, 0);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTE", 196, 20, { align: 'right' });

    const clientY = 72;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0); 
    doc.text("QUOTE TO:", 14, clientY);
    doc.setFont("helvetica", "normal");
    doc.text(clientDetails.businessName || clientDetails.name || 'N/A', 14, clientY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("NO:", 155, clientY); 
    doc.setFont("helvetica", "normal");
    doc.text(quoteMeta.quoteNo, 166, clientY);

    doc.setFont("helvetica", "bold");
    doc.text("DATE:", 155, clientY + 6);
    doc.setFont("helvetica", "normal");
    const dateObj = new Date(quoteMeta.date);
    const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
    doc.text(formattedDate, 170, clientY + 6);

    // ✅ UPDATED TABLE COLUMNS FOR PDF (ADDED QTY & TOTAL)
    const tableBody = items.map(item => [
      item.description,
      item.hsn,
      formatCurrency(item.price),
      item.qty, // Added Qty
      formatCurrency(item.price * item.qty) // Added Total
    ]);

    doc.autoTable({
      startY: clientY + 15,
      // ✅ Added QTY and TOTAL headers
      head: [['DESCRIPTION', 'DETAILS', 'PRICE', 'QTY', 'TOTAL']], 
      body: tableBody,
      theme: 'grid',
      tableLineColor: orangeColor,
      tableLineWidth: 0.1,
      margin: { left: 14, right: 14 },
      headStyles: {
        fillColor: orangeColor,
        textColor: 255,
        fontStyle: 'bold',
        lineColor: orangeColor,
        lineWidth: 0.1,
        halign: 'center',
        fontSize: 10,
        cellPadding: 3
      },
      bodyStyles: {
        textColor: 0,
        cellPadding: 3,
        lineColor: orangeColor,
        lineWidth: 0.1,
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 50 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 15 },
        4: { halign: 'right', cellWidth: 25 }
      }
    });

    let finalY = doc.lastAutoTable.finalY + 12;

    if (finalY + 60 > 280) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(255, 69, 0);
    doc.setFont("helvetica", "bold");
    doc.text("TERMS & CONDITION", 14, finalY);

    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    const termsLines = terms.split('\n');
    let termY = finalY + 6;
    
    termsLines.forEach(line => {
      const wrappedLines = doc.splitTextToSize(line, 110);
      wrappedLines.forEach(wrappedLine => {
        doc.text(wrappedLine, 14, termY);
        termY += 3.5;
      });
    });

    const totalsX = 125;
    const totalsStartY = finalY - 9;
    const rowHeight = 8;

    // Subtotal
    doc.setFillColor(255, 239, 234);
    doc.rect(totalsX, totalsStartY, 72, rowHeight, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 69, 0);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal", totalsX + 3, totalsStartY + 5.5);
    doc.setTextColor(0);
    doc.text(formatCurrency(subtotal), totalsX + 69, totalsStartY + 5.5, { align: 'right' });

    // Tax
    doc.setFillColor(255, 239, 234);
    doc.rect(totalsX, totalsStartY + rowHeight + 1, 72, rowHeight, 'F');
    doc.setTextColor(255, 69, 0);
    doc.text(`Tax ${taxRate}%`, totalsX + 3, totalsStartY + rowHeight + 6.5);
    doc.setTextColor(0);
    doc.text(formatCurrency(taxAmount), totalsX + 69, totalsStartY + rowHeight + 6.5, { align: 'right' });

    // Total
    doc.setFillColor(255, 69, 0);
    doc.rect(totalsX, totalsStartY + (rowHeight + 1) * 2, 72, rowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", totalsX + 3, totalsStartY + (rowHeight + 1) * 2 + 5.5);
    doc.text(formatCurrency(grandTotal), totalsX + 69, totalsStartY + (rowHeight + 1) * 2 + 5.5, { align: 'right' });

    finalY = Math.max(termY, totalsStartY + (rowHeight + 1) * 3) + 15;

    if (finalY + 90 > 285) { 
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details:", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Bank Name: ${bankDetails.bankName}`, 14, finalY + 6);
    doc.text(`Account Name: ${bankDetails.accountName}`, 14, finalY + 11);
    doc.text(`Account Number: ${bankDetails.accountNo}`, 14, finalY + 16);
    doc.text(`IFSC Code: ${bankDetails.ifsc}`, 14, finalY + 21);
    doc.text(`Branch: ${bankDetails.branch}`, 14, finalY + 26);

    const signY = finalY + 0;
    doc.setFont("helvetica", "normal");
    doc.text("for SKITE", 150, signY + 5);
    
    try {
        doc.addImage(skitesign, 'JPG', 140, signY + 5, 55, 25); 
    } catch (e) { console.error("Sign Error:", e); }

    try {
      doc.addImage(skiteseal, 'PNG', 75, finalY - 20, 60, 75);
    } catch (e) { console.error("Seal Error:", e); }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Authorised Signatory", 150, signY + 40);

    const pageHeight = doc.internal.pageSize.height || 297;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("This is a Computer Generated Quote", 105, pageHeight - 10, { align: "center" });

    doc.save(fileName);
  };

  return (
    <div className="quote-container">
      
      {/* HEADER SECTION */}
      <div className="quote-header-nav">
        <div className="quote-header-left">
          <button 
                onClick={() => navigate('/admin-dashboard')}
                className="modern-back-btn" // New Class Name
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#4b5563',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#FF4500';
                    e.currentTarget.style.color = '#FF4500';
                    e.currentTarget.style.backgroundColor = '#fff5f5';
                    e.currentTarget.style.transform = 'translateX(-3px)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.color = '#4b5563';
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateX(0)';
                }}
            >
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>
          <h2>Create Quote</h2>
        </div>
        
        <div className="header-actions">
          <button 
            className="action-btn history-btn" 
            onClick={() => navigate('/admin-dashboard/quote-history')}
          >
            <History size={18} /> History
          </button>

          <button 
            className="action-btn save-btn" 
            onClick={saveQuoteToDB}
          >
            <Save size={18} /> Save
          </button>

          <button 
            className="action-btn pdf-btn" 
            onClick={generatePDF}
          >
            <Download size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="quote-workspace">
        {/* LEFT: FORM */}
        <div className="quote-form">
          <div className="form-section">
            <h3>Quote Details</h3>
            <div className="row-inputs">
              <div className="input-group">
                <label>Quote No</label>
                <input 
                  type="text" 
                  value={quoteMeta.quoteNo} 
                  onChange={(e) => setQuoteMeta({...quoteMeta, quoteNo: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Date</label>
                <input 
                  type="date" 
                  value={quoteMeta.date} 
                  onChange={(e) => setQuoteMeta({...quoteMeta, date: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Client Details</h3>
            <div className="input-group">
              <label>Client Name</label>
              <input 
                type="text" 
                value={clientDetails.name} 
                onChange={(e) => setClientDetails({...clientDetails, name: e.target.value})}
                placeholder="Client Name"
              />
            </div>
            <div className="input-group">
              <label>Business Name</label>
              <input 
                type="text" 
                value={clientDetails.businessName} 
                onChange={(e) => setClientDetails({...clientDetails, businessName: e.target.value})}
                placeholder="Business Name"
              />
            </div>
          </div>

        <div className="items-section">
            <h3 style={{color: '#FF4500', marginBottom: '15px'}}>Items</h3>

            {/* ❌ பழைய Header பகுதி நீக்கப்பட்டது (Labels உள்ளே சேர்க்கப்பட்டுள்ளது) */}

            {items.map((item, index) => (
              <div key={index} className="item-card">
                
                {/* --- வரிசை 1: Description & Details --- */}
                <div className="item-row-top">
                  <div className="input-wrapper description-wrapper">
                    <label>Description</label>
                    <input 
                      type="text" 
                      placeholder="Item Description" 
                      value={item.description} 
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="input-wrapper details-wrapper">
                    <label>HSN / Details</label>
                    <input 
                      type="text" 
                      placeholder="HSN" 
                      value={item.hsn} 
                      onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                    />
                  </div>
                </div>

                {/* --- வரிசை 2: Price, Qty & Delete --- */}
                <div className="item-row-bottom">
                  <div className="input-wrapper price-wrapper">
                    <label>Price</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={item.price} 
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="input-wrapper qty-wrapper">
                    <label>Qty</label>
                    <input 
                      type="number" 
                      placeholder="1" 
                      value={item.qty} 
                      onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="delete-wrapper">
                    <label>&nbsp;</label> {/* Empty label for alignment */}
                    <button 
                      onClick={() => removeItem(index)}
                      className="remove-btn"
                      title="Remove Item"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>

              </div>
            ))}

            <button onClick={addItem} className="add-item-btn">
              <Plus size={16}/> Add Item
            </button>
          </div>

          <div className="tax-total-section">
            <div className="tax-total-wrapper">
              <div className="tax-input-group">
                <label>Tax Rate (%)</label>
                <input 
                  type="number" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="total-display">
                <h3>Total: ₹{grandTotal.toLocaleString('en-IN')}</h3>
              </div>
            </div>
          </div>

          <div className="terms-section">
            <h3>Terms & Conditions</h3>
            <textarea 
              value={terms} 
              onChange={(e) => setTerms(e.target.value)}
            />
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="quote-preview">
          <div className="preview-header">
            <div className="preview-company">
              <div className="company-logo-box">
                <span>SKITE</span>
              </div>
              <h2>SKITE</h2>
              <p>{senderDetails.email}</p>
              <p>{senderDetails.phone}</p>
              <p>GST: {senderDetails.gst}</p>
            </div>
            <div className="preview-quote-info">
              <h2>QUOTE</h2>
              <p><strong>NO:</strong> {quoteMeta.quoteNo}</p>
              <p><strong>DATE:</strong> {new Date(quoteMeta.date).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div className="preview-client">
            <h4>QUOTE TO:</h4>
            <p>{clientDetails.clientName || clientDetails.name || 'N/A'}</p>
            <p>{clientDetails.businessName || clientDetails.name || 'N/A'}</p>

          </div>

          {/* ✅ UPDATED PREVIEW TABLE WITH QTY & TOTAL */}
          <table className="preview-table">
            <thead>
              <tr>
                <th>DESCRIPTION</th>
                <th>DETAILS</th>
                <th>PRICE</th>
                <th>QTY</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td>{item.hsn}</td>
                  <td>₹ {item.price.toLocaleString('en-IN')}</td>
                  <td>{item.qty}</td>
                  <td>₹ {(item.price * item.qty).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="preview-footer">
            <div className="preview-terms">
              <h4>TERMS & CONDITION</h4>
              <pre>{terms}</pre>
            </div>

            <div className="preview-totals">
              <div className="preview-totals-row subtotal">
                <span>Subtotal</span>
                <span>₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="preview-totals-row tax">
                <span>Tax {taxRate}%</span>
                <span>₹ {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="preview-totals-row total">
                <span>TOTAL</span>
                <span>₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quote;
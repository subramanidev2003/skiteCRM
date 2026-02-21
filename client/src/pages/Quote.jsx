import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Plus, Trash2, Save, History } from 'lucide-react'; 
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable'; 
import { toast } from 'react-toastify'; 
import './Quote.css'; 

import skitelogo from '../assets/skite-logo.jpg'; 
import skitesign from '../assets/sign.jpg'; 
import skiteseal from '../assets/seal.png'; 

const Quote = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isSales = !!localStorage.getItem("salesUser");

  const senderDetails = {
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

  const [quoteMeta, setQuoteMeta] = useState({
    quoteNo: 'Loading...', // ✅ Initial state
    refNo: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [clientDetails, setClientDetails] = useState({
    name: '',
    address: '',
    gst: ''
  });

  const [items, setItems] = useState([
    { description: 'Social Media Poster', hsn: 'Monthly 10 Poster', price: 9000, qty: 1 }
  ]);

  const [taxRate, setTaxRate] = useState(9);

  const [terms, setTerms] = useState(`50% advance payment required to start the project.
Final 50% on project completion before deployment.
The complete website will be built on our subdomain for preview and approval before final deployment.
Any additional page will be charged at Rs.1,500 per page.`);

  const [pageLoading, setPageLoading] = useState(false);

  // --- ✅ NEW LOGIC: GET HIGHEST QUOTE NO ---
  const generateNextQuoteNo = async () => {
    try {
      const response = await fetch('https://skitecrm-1l7f.onrender.com/api/quote/all');
      const data = await response.json();

      if (response.ok && Array.isArray(data) && data.length > 0) {
        let maxNum = 0;
        let prefix = 'SKT'; 
        
        data.forEach(q => {
          if (q.quoteNo) {
            // Extracts prefix and trailing numbers (e.g., "SKT44" -> "SKT" and "44")
            const match = q.quoteNo.match(/^(.*?)(\d+)$/);
            if (match) {
              const num = parseInt(match[2], 10);
              if (num > maxNum) {
                maxNum = num;
                prefix = match[1] || 'SKT';
              }
            }
          }
        });
        
        const nextNum = maxNum > 0 ? maxNum + 1 : 45; // Defaults to 45 if nothing found
        return `${prefix}${nextNum}`;
      }
      return 'SKT45'; 
    } catch (error) {
      console.error("Error generating quote no:", error);
      return 'SKT45';
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      if (id) {
        fetchQuoteById(id);
      } else {
        // Fetch next quote number for new quote
        const nextQuoteNo = await generateNextQuoteNo();
        setQuoteMeta(prev => ({ ...prev, quoteNo: nextQuoteNo }));
      }
    };
    initializeData();
  }, [id]);

  const fetchQuoteById = async (quoteId) => {
    setPageLoading(true);
    try {
      const response = await fetch(`https://skitecrm-1l7f.onrender.com/api/quote/${quoteId}`);
      const data = await response.json();

      if (response.ok) {
        setQuoteMeta({
          quoteNo: data.quoteNo || '',
          refNo: data.refNo || '',
          date: data.date
            ? new Date(data.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        });

        const cd = data.clientDetails || {};
        const resolvedAddress =
          cd.address ||                          
          [cd.addressLine1, cd.addressLine2, cd.location]
            .filter(Boolean)
            .join(', ') ||                       
          '';

        setClientDetails({
          name: cd.name || '',
          address: resolvedAddress,
          gst: cd.gst || cd.gstin || ''         
        });

        setItems(
          data.items?.length > 0
            ? data.items
            : [{ description: '', hsn: '', price: 0, qty: 1 }]
        );
        setTaxRate(data.taxRate ?? 9);
        setTerms(data.terms || '');
      } else {
        toast.error("Failed to load quote");
      }
    } catch (error) {
      toast.error("Server Error while loading quote");
    } finally {
      setPageLoading(false);
    }
  };

  // --- CALCULATIONS ---
  const calculateTotal = () => {
    const subtotal = items.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 1)), 0);
    const cgst = (subtotal * taxRate) / 100;
    const sgst = (subtotal * taxRate) / 100;
    const grandTotal = Math.round(subtotal + cgst + sgst);
    return { subtotal, cgst, sgst, grandTotal };
  };

  const { subtotal, cgst, sgst, grandTotal } = calculateTotal();

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', hsn: '', price: 0, qty: 1 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const saveQuoteToDB = async () => {
    if (!clientDetails.name) {
      toast.error("Please enter Client Name!");
      return;
    }

    const validItems = items.filter(item => item.description?.trim() !== "" || item.price > 0);
    const quoteData = {
      quoteNo: quoteMeta.quoteNo,
      refNo: quoteMeta.refNo,
      date: quoteMeta.date,
      clientDetails,
      items: validItems.map(item => ({ ...item, total: item.price * item.qty })),
      subtotal, taxRate, cgst, sgst, grandTotal, terms
    };

    try {
      let response;
      if (id) {
        response = await fetch(`https://skitecrm-1l7f.onrender.com/api/quote/update/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quoteData)
        });
      } else {
        response = await fetch('https://skitecrm-1l7f.onrender.com/api/quote/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quoteData)
        });
      }

      const data = await response.json();
      if (response.ok) {
        toast.success(id ? "Quote Updated Successfully!" : "Quote Saved Successfully!");
        // ✅ Auto-refresh to next Quote No if it was a new Quote Create
        if (!id) {
            const nextNo = await generateNextQuoteNo();
            setQuoteMeta(prev => ({ ...prev, quoteNo: nextNo }));
        }
      } else {
        toast.error(data.message || "Failed to save quote");
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
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imgSrc;
    });
  };

  const generatePDF = async () => {
    let fileName = prompt("Enter PDF File Name:", `Quote_${quoteMeta.quoteNo}`);
    if (fileName === null) return;
    if (!fileName.trim()) fileName = `Quote_${quoteMeta.quoteNo}`;
    if (!fileName.endsWith('.pdf')) fileName += '.pdf';

    const doc = new jsPDF();
    const orangeColor = [255, 69, 0];
    const formatCurrency = (num) =>
      num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    try { const lb = await getImageBase64(skitelogo); doc.addImage(lb, 'PNG', 14, 10, 40, 29); } catch (e) {}

    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text("SKITE", 14, 42);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Email: ${senderDetails.email}`, 14, 47);
    doc.text(`Phone: ${senderDetails.phone}`, 14, 52);
    doc.text(`Website: ${senderDetails.website}`, 14, 57);
    doc.text(`GSTIN: ${senderDetails.gst}`, 14, 62);

    doc.setFontSize(24); doc.setTextColor(255, 69, 0); doc.setFont("helvetica", "bold");
    doc.text("QUOTE", 196, 20, { align: 'right' });

    const clientY = 72;
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text("QUOTE TO:", 14, clientY);
    doc.setFontSize(11);
    doc.text(clientDetails.name || 'N/A', 14, clientY + 6);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);

    let currentDetailY = clientY + 11;
    if (clientDetails.address) {
      const splitAddress = doc.splitTextToSize(clientDetails.address, 90);
      doc.text(splitAddress, 14, currentDetailY);
      currentDetailY += splitAddress.length * 4.5;
    } else {
      currentDetailY += 5;
    }
    if (clientDetails.gst) {
      doc.text(`GSTIN: ${clientDetails.gst}`, 14, currentDetailY + 2);
      currentDetailY += 6;
    }

    doc.setFont("helvetica", "bold");
    doc.text("NO:", 155, clientY);
    doc.setFont("helvetica", "normal");
    doc.text(quoteMeta.quoteNo, 166, clientY);

    let metaY = clientY + 6;
    if (quoteMeta.refNo) {
      doc.setFont("helvetica", "bold"); doc.text("R.No:", 155, metaY);
      doc.setFont("helvetica", "normal"); doc.text(quoteMeta.refNo, 170, metaY);
      metaY += 6;
    }
    doc.setFont("helvetica", "bold"); doc.text("DATE:", 155, metaY);
    doc.setFont("helvetica", "normal");
    const dateObj = new Date(quoteMeta.date);
    doc.text(
      `${String(dateObj.getDate()).padStart(2,'0')}/${String(dateObj.getMonth()+1).padStart(2,'0')}/${dateObj.getFullYear()}`,
      170, metaY
    );

    const tableStartY = Math.max(currentDetailY + 10, 95);
    const validItems = items.filter(item => item.description?.trim() !== "" || item.price > 0);

    autoTable(doc, {
      startY: tableStartY,
      head: [['DESCRIPTION', 'DETAILS', 'PRICE', 'QTY', 'TOTAL']],
      body: validItems.map(item => [
        item.description, item.hsn,
        formatCurrency(item.price), item.qty,
        formatCurrency(item.price * item.qty)
      ]),
      theme: 'grid', tableLineColor: orangeColor, tableLineWidth: 0.1,
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: orangeColor, textColor: 255, fontStyle: 'bold', lineColor: orangeColor, lineWidth: 0.1, halign: 'center', fontSize: 10, cellPadding: 3 },
      bodyStyles: { textColor: 0, cellPadding: 3, lineColor: orangeColor, lineWidth: 0.1, fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold' }, 1: { cellWidth: 45 },
        2: { halign: 'right', cellWidth: 25 }, 3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'right', cellWidth: 32 }
      }
    });

    let currentY = doc.lastAutoTable.finalY + 10;
    if (currentY + 60 > 270) { doc.addPage(); currentY = 20; }

    const totalsX = 125, totalsStartY = currentY, rowHeight = 8;

    [['Subtotal', subtotal], [`CGST ${taxRate}%`, cgst], [`SGST ${taxRate}%`, sgst]].forEach(([label, val], i) => {
      doc.setFillColor(255, 239, 234);
      doc.rect(totalsX, totalsStartY + (rowHeight + 1) * i, 72, rowHeight, 'F');
      doc.setFontSize(10); doc.setTextColor(255, 69, 0); doc.setFont("helvetica", "normal");
      doc.text(label, totalsX + 3, totalsStartY + (rowHeight + 1) * i + 5.5);
      doc.setTextColor(0);
      doc.text(formatCurrency(val), totalsX + 69, totalsStartY + (rowHeight + 1) * i + 5.5, { align: 'right' });
    });

    doc.setFillColor(255, 69, 0);
    doc.rect(totalsX, totalsStartY + (rowHeight + 1) * 3, 72, rowHeight, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
    doc.text("TOTAL", totalsX + 3, totalsStartY + (rowHeight + 1) * 3 + 5.5);
    doc.text(grandTotal.toLocaleString('en-IN'), totalsX + 69, totalsStartY + (rowHeight + 1) * 3 + 5.5, { align: 'right' });

    doc.setFontSize(11); doc.setTextColor(255, 69, 0); doc.setFont("helvetica", "bold");
    doc.text("TERMS & CONDITION", 14, totalsStartY);
    doc.setTextColor(0); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    let termY = totalsStartY + 6;
    terms.split('\n').forEach(line => {
      doc.splitTextToSize(line, 105).forEach(w => { doc.text(w, 14, termY); termY += 3.5; });
    });

    currentY = Math.max(termY, totalsStartY + (rowHeight + 1) * 4) + 15;
    if (currentY + 70 > 280) { doc.addPage(); currentY = 20; }

    doc.setFontSize(10); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text("Payment Details:", 14, currentY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Bank Name: ${bankDetails.bankName}`, 14, currentY + 6);
    doc.text(`Account Name: ${bankDetails.accountName}`, 14, currentY + 11);
    doc.text(`Account Number: ${bankDetails.accountNo}`, 14, currentY + 16);
    doc.text(`IFSC Code: ${bankDetails.ifsc}`, 14, currentY + 21);
    doc.text(`Branch: ${bankDetails.branch}`, 14, currentY + 26);

    const signY = currentY;
    doc.text("for SKITE", 150, signY + 5);
    try { const s = await getImageBase64(skitesign); doc.addImage(s, 'PNG', 140, signY + 5, 55, 25); } catch (e) {}
    try { const sl = await getImageBase64(skiteseal); doc.addImage(sl, 'PNG', 75, currentY - 10, 50, 62); } catch (e) {}
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("Authorised Signatory", 150, signY + 40);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text("This is a Computer Generated Quote", 105, (doc.internal.pageSize.height || 297) - 10, { align: "center" });

    doc.save(fileName);
  };

  const handleBack = () => navigate(isSales ? '/sales-dashboard' : '/admin-dashboard');
  const handleHistory = () => navigate(isSales ? '/sales-dashboard/quote-history' : '/admin-dashboard/quote-history');

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#FF4500' }}>
        Loading Quote...
      </div>
    );
  }

  return (
    <div className="quote-container">
      <div className="quote-header-nav">
        <div className="quote-header-left">
          <button onClick={handleBack} className="modern-back-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e0e0e0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#4b5563', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <ArrowLeft size={20} />
            <span>{isSales ? 'Sales Panel' : 'Admin Dashboard'}</span>
          </button>
          <h2>{id ? 'Edit Quote' : 'Create Quote'}</h2>
        </div>

        <div className="header-actions">
          <button className="action-btn history-btn" onClick={handleHistory}>
            <History size={18} /> History
          </button>
          <button className="action-btn save-btn" onClick={saveQuoteToDB}>
            <Save size={18} /> Save
          </button>
          <button className="action-btn pdf-btn" onClick={generatePDF}>
            <Download size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="quote-workspace">
        <div className="quote-form">
          <div className="form-section">
            <h3>Quote Details</h3>
            <div className="row-inputs" style={{ display: 'flex', gap: '12px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Quote No</label>
                <input type="text" value={quoteMeta.quoteNo}
                  onChange={(e) => setQuoteMeta({...quoteMeta, quoteNo: e.target.value})} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>R.No</label>
                <input type="text" placeholder="Reference No (Optional)"
                  value={quoteMeta.refNo}
                  onChange={(e) => setQuoteMeta({...quoteMeta, refNo: e.target.value})} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Date</label>
                <input type="date" value={quoteMeta.date}
                  onChange={(e) => setQuoteMeta({...quoteMeta, date: e.target.value})} />
              </div>
            </div>
          </div>

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

          <div className="items-section">
            <h3 style={{ color: '#FF4500', marginBottom: '15px' }}>Items</h3>
            {items.map((item, index) => (
              <div key={index} className="item-card">
                <div className="item-row-top">
                  <div className="input-wrapper description-wrapper">
                    <label>Description</label>
                    <input type="text" placeholder="Item Description" value={item.description || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                  </div>
                  <div className="input-wrapper details-wrapper">
                    <label>HSN / Details</label>
                    <input type="text" placeholder="HSN" value={item.hsn || ''}
                      onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} />
                  </div>
                </div>
                <div className="item-row-bottom">
                  <div className="input-wrapper price-wrapper">
                    <label>Price</label>
                    <input type="number" placeholder="0.00" value={item.price || 0}
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="input-wrapper qty-wrapper">
                    <label>Qty</label>
                    <input type="number" placeholder="1" value={item.qty || 1}
                      onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="delete-wrapper">
                    <label>&nbsp;</label>
                    <button onClick={() => removeItem(index)} className="remove-btn"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addItem} className="add-item-btn"><Plus size={16} /> Add Item</button>
          </div>

          <div className="tax-total-section">
            <div className="tax-total-wrapper">
              <div className="tax-input-group">
                <label>Tax Rate (SGST/CGST %)</label>
                <input type="number" value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  placeholder="0" onWheel={(e) => e.target.blur()}
                  style={{ width: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', background: 'white' }} />
              </div>
              <div className="total-display">
                <h3>Total: ₹{grandTotal.toLocaleString('en-IN')}</h3>
              </div>
            </div>
          </div>

          <div className="terms-section">
            <h3>Terms & Conditions</h3>
            <textarea value={terms} onChange={(e) => setTerms(e.target.value)} />
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="quote-preview">
          <div className="preview-header">
            <div className="preview-company">
              <div className="company-logo-box"><span>SKITE</span></div>
              <h2>SKITE</h2>
              <p>{senderDetails.email}</p>
              <p>{senderDetails.phone}</p>
              <p>GST: {senderDetails.gst}</p>
            </div>
            <div className="preview-quote-info">
              <h2>QUOTE</h2>
              <p><strong>NO:</strong> {quoteMeta.quoteNo}</p>
              {quoteMeta.refNo && <p><strong>R.No:</strong> {quoteMeta.refNo}</p>}
              <p><strong>DATE:</strong> {new Date(quoteMeta.date).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div className="preview-client">
            <h4>QUOTE TO:</h4>
            <p style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{clientDetails.name || 'Client / Business Name'}</p>
            {clientDetails.address && (
              <p style={{ whiteSpace: 'pre-wrap', margin: '5px 0', fontSize: '0.95em', color: '#555' }}>
                {clientDetails.address}
              </p>
            )}
            {clientDetails.gst && <p style={{ fontWeight: '500' }}>GSTIN: {clientDetails.gst}</p>}
          </div>

          <table className="preview-table">
            <thead>
              <tr>
                <th>DESCRIPTION</th><th>DETAILS</th><th>PRICE</th><th>QTY</th><th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td>{item.hsn}</td>
                  <td>₹ {(item.price || 0).toLocaleString('en-IN')}</td>
                  <td>{item.qty || 1}</td>
                  <td>₹ {((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</td>
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
                <span>CGST {taxRate}%</span>
                <span>₹ {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="preview-totals-row tax">
                <span>SGST {taxRate}%</span>
                <span>₹ {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="preview-totals-row total">
                <span>TOTAL</span>
                <span>₹ {grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quote;
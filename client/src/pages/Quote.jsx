import React, { useState } from 'react';
// ✅ Save, History ஐகான்கள் சேர்க்கப்பட்டுள்ளன
import { ArrowLeft, Download, Plus, Trash2, Save, History } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify'; 
import './Invoice.css'; 

// ✅ IMAGES IMPORT
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

  const [items, setItems] = useState([
    { description: 'Social Media Poster', hsn: 'Monthly 10 Poster', price: 9000, qty: 1 }
  ]);

  const [taxRate, setTaxRate] = useState(18); 

  const [terms, setTerms] = useState(`50% advance payment required to start the project.
Final 50% on project completion before deployment.
The complete website will be built on our subdomain for preview and approval before final deployment.
Any additional page will be charged at Rs.1,500 per page.`);

  // --- CALCULATIONS ---
  const calculateTotal = () => {
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
    setItems([...items, { description: '', hsn: '', price: 0, qty: 1 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // ==========================================
  // 💾 SAVE TO DB FUNCTION
  // ==========================================
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

      const response = await fetch('https://skite-crm.onrender.com/api/quote/create', {
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



  // ==========================================
  // 🖨️ PDF GENERATION
  // ==========================================
  const generatePDF = async () => {
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
    const lightOrange = [255, 239, 234];

    const formatCurrency = (num) => {
      return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 1. LOGO
    try {
        doc.addImage(skitelogo, 'JPG', 14, 10, 40, 29); 
    } catch (e) { console.error("Logo Error:", e); }

    // 2. COMPANY DETAILS
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

    // 3. QUOTE TITLE
    doc.setFontSize(24);
    doc.setTextColor(255, 69, 0);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTE", 196, 20, { align: 'right' });

    // 5. CLIENT DETAILS (Position Reference)
    const clientY = 72;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0); 
    doc.text("QUOTE TO:", 14, clientY);
    doc.setFont("helvetica", "normal");
    doc.text(clientDetails.businessName || clientDetails.name || 'N/A', 14, clientY + 5);

    // 4. QUOTE NO & DATE (Fixed: Down & Aligned)
    doc.setFontSize(10);
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

    // 6. ITEMS TABLE
    const tableBody = items.map(item => [
      item.description,
      item.hsn,
      formatCurrency(item.price)
    ]);

// ... existing code inside generatePDF function ...

    doc.autoTable({
      startY: clientY + 15,
      head: [['DESCRIPTION', 'DETAILS', 'PRICE']],
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
        cellPadding: 3 // ✅ Reduced from default to 3
      },
      bodyStyles: {
        textColor: 0,
        cellPadding: 3, // ✅ மாற்றப்பட்டது: 6ல் இருந்து 3க்கு குறைக்கப்பட்டுள்ளது
        lineColor: orangeColor,
        lineWidth: 0.1,
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 75 },
        2: { halign: 'right', cellWidth: 37 }
      }
    });

// ... existing code ...

    let finalY = doc.lastAutoTable.finalY + 12;

    // 7. TERMS & TOTALS
    // Check page break for Terms/Totals block
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

    // Calculate new finalY
    finalY = Math.max(termY, totalsStartY + (rowHeight + 1) * 3) + 15;

    // 9. BANK DETAILS & SIGNATURE (Smart Page Break Logic)
    // Increased buffer to 90 to ensure footer doesn't overlap
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
    
    // ✅ SIGNATURE IMAGE
    try {
        doc.addImage(skitesign, 'JPG', 140, signY + 5, 55, 25); 
    } catch (e) { console.error("Sign Error:", e); }

    // ✅ SEAL IMAGE 
    try {
doc.addImage(skiteseal, 'PNG', 75, finalY - 20, 60, 75);
    } catch (e) { console.error("Seal Error:", e); }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Authorised Signatory", 150, signY + 40);

    // ✅ FOOTER TEXT (Always at the absolute bottom of the LAST page)
    const pageHeight = doc.internal.pageSize.height || 297;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("This is a Computer Generated Quote", 105, pageHeight - 10, { align: "center" });

    doc.save(`Quote_${quoteMeta.quoteNo}.pdf`);
  };
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            {/* ✅ BACK TO DASHBOARD BUTTON */}
            <button className="back-btn" onClick={() => navigate('/admin-dashboard')} style={{border:'none', background:'transparent', cursor:'pointer'}}>
                <ArrowLeft size={24} color="#333" />
            </button>
            <h2 style={{ margin: 0, color: '#333' }}>Create Quote</h2>
        </div>
        
        {/* HEADER ACTIONS */}
        <div className="header-actions" style={{display:'flex', gap:'10px'}}>
            <button 
                className="action-btn" 
                onClick={() => navigate('/admin-dashboard/quote-history')}
                style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }} 
            >
                <History size={18} /> History
            </button>

            <button 
                className="action-btn" 
                onClick={saveQuoteToDB}
                style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }} 
            >
                <Save size={18} /> Save
            </button>

            <button 
                className="action-btn" 
                onClick={generatePDF}
                style={{ backgroundColor: '#FF4500', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }} 
            >
                <Download size={18} /> PDF
            </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* LEFT: FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, color: '#FF4500' }}>Quote Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Quote No</label>
                <input 
                  type="text" 
                  value={quoteMeta.quoteNo} 
                  onChange={(e) => setQuoteMeta({...quoteMeta, quoteNo: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date</label>
                <input 
                  type="date" 
                  value={quoteMeta.date} 
                  onChange={(e) => setQuoteMeta({...quoteMeta, date: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, color: '#FF4500' }}>Client Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Client Name</label>
                <input 
                  type="text" 
                  value={clientDetails.name} 
                  onChange={(e) => setClientDetails({...clientDetails, name: e.target.value})}
                  placeholder="Client Name"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Business Name</label>
                <input 
                  type="text" 
                  value={clientDetails.businessName} 
                  onChange={(e) => setClientDetails({...clientDetails, businessName: e.target.value})}
                  placeholder="Business Name"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>

{/* ... existing code inside the Form section ... */}

<div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
  <h3 style={{ marginTop: 0, color: '#FF4500' }}>Items</h3>

  {/* ✅ புதிதாக சேர்க்கப்பட்ட Headings Section */}
  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', color: '#555', fontSize: '14px', fontWeight: 'bold' }}>
    <div style={{ flex: 2 }}>Description</div>
    <div style={{ flex: 2 }}>Details</div>
    <div style={{ flex: 1 }}>Price</div>
    <div style={{ width: '40px' }}></div> {/* Delete பட்டனுக்கான காலி இடம் */}
  </div>

  {items.map((item, index) => (
    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
      <input 
        type="text" 
        // placeholder="Description"  <-- Heading இருப்பதால் இது தேவையில்லை, ஆனால் இருக்கலாம்
        value={item.description} 
        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
        style={{ flex: 2, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input 
        type="text" 
        // placeholder="Details" 
        value={item.hsn} 
        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
        style={{ flex: 2, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input 
        type="number" 
        // placeholder="Price" 
        value={item.price} 
        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
        style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <button 
        onClick={() => removeItem(index)}
        style={{ padding: '8px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '40px' }}
      >
        <Trash2 size={16}/>
      </button>
    </div>
  ))}

{/* ... existing Add Item button code ... */}
            <button 
              onClick={addItem}
              style={{ 
                padding: '8px 16px', 
                background: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Plus size={16}/> Add Item
            </button>
          </div>

          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Tax Rate (%)</label>
                <input 
                  type="number" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  style={{ width: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                />
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ color: '#FF4500', fontSize: '24px', margin: 0 }}>
                  Total: ₹{grandTotal.toLocaleString('en-IN')}
                </h3>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, color: '#FF4500' }}>Terms & Conditions</h3>
            <textarea 
              value={terms} 
              onChange={(e) => setTerms(e.target.value)}
              style={{ 
                width: '100%', 
                minHeight: '100px', 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                fontFamily: 'inherit',
                fontSize: '14px'
              }} 
            />
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
            <div>
              <div style={{ width: '80px', height: '60px', background: '#FF4500', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', marginBottom: '10px' }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>SKITE</span>
              </div>
              <h2 style={{ margin: '5px 0', fontSize: '16px' }}>SKITE</h2>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>{senderDetails.email}</p>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>{senderDetails.phone}</p>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>GST: {senderDetails.gst}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ color: '#FF4500', fontSize: '28px', margin: '0 0 10px 0' }}>QUOTE</h2>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>NO:</strong> {quoteMeta.quoteNo}</p>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>DATE:</strong> {new Date(quoteMeta.date).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#FF4500', margin: '0 0 5px 0' }}>QUOTE TO:</h4>
            <p style={{ margin: 0, fontWeight: '600' }}>{clientDetails.businessName || clientDetails.name || 'N/A'}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#FF4500', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #FF4500', textAlign: 'center' }}>DESCRIPTION</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #FF4500', textAlign: 'center' }}>DETAILS</th>
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500', textAlign: 'center' }}>PRICE</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px', border: '1px solid #FF4500', fontWeight: '600' }}>{item.description}</td>
                  <td style={{ padding: '10px', border: '1px solid #FF4500' }}>{item.hsn}</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500' }}>₹ {item.price.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '20px', marginTop: '25px' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#FF4500', margin: '0 0 8px 0' }}>TERMS & CONDITION</h4>
              <pre style={{ fontFamily: 'inherit', fontSize: '11px', color: '#555', whiteSpace: 'pre-wrap', margin: 0 }}>{terms}</pre>
            </div>

            <div style={{ width: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff7e6', marginBottom: '2px' }}>
                <span style={{ color: '#FF4500' }}>Subtotal</span>
                <span>₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff7e6', marginBottom: '2px' }}>
                <span style={{ color: '#FF4500' }}>Tax {taxRate}%</span>
                <span>₹ {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#FF4500', color: '#fff', fontWeight: 'bold' }}>
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
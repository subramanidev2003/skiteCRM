import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Download, Save, History } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify'; 
import './Invoice.css';

// ✅ IMAGES IMPORT
import skitelogo from '../assets/skite-logo.jpg'; 
import skitesign from '../assets/sign.jpg';
import skiteseal from '../assets/seal.png'; 

const Invoice = () => {
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
  const [invoiceMeta, setInvoiceMeta] = useState({
    invoiceNo: 'SKT/25-26/025',
    date: new Date().toISOString().split('T')[0]
  });

  const [clientDetails, setClientDetails] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    location: ''
  });

  const [items, setItems] = useState([
    { description: 'META ADS', hsn: '998365', price: 1500, qty: 15 }
  ]);

  const [taxRate, setTaxRate] = useState(9); 

  // --- CALCULATIONS ---
  const calculateTotal = () => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const cgst = (subtotal * taxRate) / 100;
    const sgst = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + cgst + sgst;
    return { subtotal, cgst, sgst, grandTotal };
  };

  const { subtotal, cgst, sgst, grandTotal } = calculateTotal();

  const numberToWords = (num) => {
    return `Indian Rupees ${Math.floor(num).toString()} Only`; 
  };

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
  // 💾 SAVE TO DB
  // ==========================================
  const saveInvoiceToDB = async () => {
    if (!clientDetails.name) {
        toast.error("Please enter Client Name!");
        return;
    }

    try {
      const invoiceData = {
        invoiceNo: invoiceMeta.invoiceNo,
        date: invoiceMeta.date,
        clientDetails: clientDetails,
        items: items.map(item => ({
          ...item,
          total: item.price * item.qty
        })),
        subtotal,
        taxRate,
        cgst,
        sgst,
        grandTotal
      };

      const response = await fetch('https://skitecrm.onrender.com/api/invoice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Invoice Saved Successfully!");
      } else {
        toast.error(data.message || "Failed to save invoice");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Server Error: Check Backend Connection");
    }
  };

  // ==========================================
  // 🖨️ PDF GENERATION
  // ==========================================
  const generatePDF = async () => {
    
    // ✅ 1. Ask for File Name (Popup)
    let fileName = prompt("Enter PDF File Name:", `Invoice_${invoiceMeta.invoiceNo.replace(/\//g, '-')}`);
    
    if (fileName === null) return; // If cancel is clicked, stop
    if (!fileName.trim()) fileName = `Invoice_${invoiceMeta.invoiceNo.replace(/\//g, '-')}`; // Default name
    if (!fileName.endsWith('.pdf')) fileName += '.pdf'; // Add extension if missing

    const doc = new jsPDF();
    const orangeColor = [255, 69, 0]; 

    // Helper function to convert image to base64
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
          resolve(canvas.toDataURL('image/jpg'));
        };
        img.onerror = reject;
        img.src = imgSrc;
      });
    };

    // 1. ADD LOGO with proper base64 conversion
    try {
        const logoBase64 = await getImageBase64(skitelogo);
        doc.addImage(logoBase64, 'JPG', 14, 10, 40, 29); 
    } catch (e) { 
        console.error("Logo Error:", e);
        doc.setFillColor(255, 69, 0);
        doc.rect(14, 10, 40, 29, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("SKITE", 34, 28, { align: 'center' });
    }

    // 2. HEADER DETAILS
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0); 
    doc.text("SKITE", 14, 40); 
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text(senderDetails.addressLine1, 14, 46);
    doc.text(senderDetails.addressLine2, 14, 51);
    doc.text(senderDetails.addressLine3, 14, 56);
    doc.text(`GST NO: ${senderDetails.gst}`, 14, 62);

    // INVOICE Label 
    doc.setFontSize(22);
    doc.setTextColor(255, 69, 0);
    doc.text("INVOICE", 195, 25, { align: 'right' });

    // 3. CLIENT DETAILS & INVOICE META
    const infoStartY = 75;

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("ISSUED TO:", 14, infoStartY);
    doc.setFont("helvetica", "normal");
    doc.text(clientDetails.name, 14, infoStartY + 6);
    doc.text(clientDetails.addressLine1, 14, infoStartY + 11);
    doc.text(clientDetails.addressLine2, 14, infoStartY + 16);
    doc.text(clientDetails.location, 14, infoStartY + 21);

    doc.setFont("helvetica", "bold");
    doc.text("INVOICE NO:", 120, infoStartY);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceMeta.invoiceNo, 155, infoStartY);

    doc.setFont("helvetica", "bold");
    doc.text("DATE:", 120, infoStartY + 6);
    doc.setFont("helvetica", "normal");
    
    const dateObj = new Date(invoiceMeta.date);
    const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    doc.text(formattedDate, 155, infoStartY + 6);

    // 4. TABLE
    const tableBody = items.map(item => [
      item.description,
      item.hsn,
      `${item.price}`,
      `${item.qty}`,
      (item.price * item.qty).toFixed(2)
    ]);

    tableBody.push(
      ['', '', '', 'Subtotal', subtotal.toFixed(2)],
      ['', '', '', `CGST ${taxRate}%`, cgst.toFixed(2)],
      ['', '', '', `SGST ${taxRate}%`, sgst.toFixed(2)],
      ['', '', '', 'TOTAL', grandTotal.toFixed(2)]
    );

    autoTable(doc, {
      startY: infoStartY + 30,
      head: [['DESCRIPTION', 'HSN', 'UNIT PRICE', 'QTY', 'TOTAL']],
      body: tableBody,
      theme: 'grid',
      headStyles: { 
          fillColor: orangeColor, 
          textColor: 255, 
          lineColor: orangeColor,
          lineWidth: 0.1
      },
      bodyStyles: {
          lineColor: orangeColor,
          lineWidth: 0.1,
          textColor: 0
      },
      footStyles: {
          lineColor: orangeColor,
          lineWidth: 0.1
      },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 }, 
        4: { halign: 'right' } 
      }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // 5. Amount in Words
    doc.setFontSize(10);
    doc.text("Amount in Words:", 14, finalY);
    doc.setFont("helvetica", "italic");
    doc.text(numberToWords(grandTotal), 45, finalY);

    // 6. Bank Details 
    doc.setFont("helvetica", "normal");
    doc.text("PAY TO:", 14, finalY + 15);
    doc.setFont("helvetica", "bold");
    doc.text(bankDetails.bankName, 14, finalY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(`Account Name: ${bankDetails.accountName}`, 14, finalY + 25);
    doc.text(`Account No: ${bankDetails.accountNo}`, 14, finalY + 30);
    doc.text(`IFSC: ${bankDetails.ifsc}`, 14, finalY + 35);
    doc.text(`Branch: ${bankDetails.branch}`, 14, finalY + 40);

    // Contact Info
    doc.setFontSize(9);
    doc.text(senderDetails.email, 14, finalY + 55);
    doc.text(senderDetails.website, 14, finalY + 60);
    doc.text(senderDetails.phone, 14, finalY + 65);

    // 7. SIGNATORY & SEAL with base64 conversion
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text("for SKITE", 150, finalY + 35); 

    try {
        const signBase64 = await getImageBase64(skitesign);
        doc.addImage(signBase64, 'JPG', 140, finalY + 40, 55, 25); 
    } catch (e) { console.error("Sign Error:", e); }

    try {
        const sealBase64 = await getImageBase64(skiteseal);
        doc.addImage(sealBase64, 'PNG', 75, finalY + 20, 60, 75); 
    } catch (e) { console.error("Seal Error:", e); }

    doc.setFont("helvetica", "bold");
    doc.text("Authorised Signatory", 150, finalY + 70);

    // ✅ Save with User Name
    doc.save(fileName);
  };

  return (
    <div className="invoice-container">
      
      {/* HEADER SECTION */}
      <div className="invoice-header-nav">
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
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
            <h2 style={{ margin: 0, color: '#333' }}>Create Invoice</h2>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="header-actions">
            <button 
                className="action-btn" 
                onClick={() => navigate('/admin-dashboard/invoice-history')}
                style={{ backgroundColor: '#6c757d' }} 
            >
                <History size={18} /> History
            </button>

            <button 
                className="action-btn" 
                onClick={saveInvoiceToDB}
                style={{ backgroundColor: '#28a745' }} 
            >
                <Save size={18} /> Save
            </button>

            <button 
                className="action-btn" 
                onClick={generatePDF}
                style={{ backgroundColor: '#FF4500' }} 
            >
                <Download size={18} /> PDF
            </button>
        </div>
      </div>

      {/* MAIN SPLIT LAYOUT (2 TABS VIEW) */}
      <div className="invoice-workspace">
        
        {/* LEFT COLUMN: FORM INPUTS */}
        <div className="invoice-form">
          
          {/* Card 1: Invoice Details */}
          <div className="form-section">
            <h3 className="section-title">Invoice Details</h3>
            <div className="row-inputs">
              <div className="input-group">
                <label>Invoice No</label>
                <input 
                  type="text" 
                  value={invoiceMeta.invoiceNo} 
                  onChange={(e) => setInvoiceMeta({...invoiceMeta, invoiceNo: e.target.value})} 
                />
              </div>
              <div className="input-group">
                <label>Date</label>
                <input 
                  type="date" 
                  value={invoiceMeta.date} 
                  onChange={(e) => setInvoiceMeta({...invoiceMeta, date: e.target.value})} 
                />
              </div>
            </div>
          </div>

          {/* Card 2: Client Details */}
          <div className="form-section">
            <h3 className="section-title">Issued To</h3>
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
              <label>Address</label>
              <input 
                type="text" 
                value={clientDetails.addressLine1} 
                onChange={(e) => setClientDetails({...clientDetails, addressLine1: e.target.value})}
                placeholder="Line 1"
              />
              <input 
                type="text" 
                value={clientDetails.addressLine2} 
                onChange={(e) => setClientDetails({...clientDetails, addressLine2: e.target.value})}
                placeholder="Line 2"
                style={{marginTop:'5px'}}
              />
              <input 
                type="text" 
                value={clientDetails.location} 
                onChange={(e) => setClientDetails({...clientDetails, location: e.target.value})}
                placeholder="City / State"
                style={{marginTop:'5px'}}
              />
            </div>
          </div>

          {/* Card 3: Items */}
        {/* Card 3: Items - UPDATED LAYOUT */}
          <div className="form-section">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'2px solid #f0f0f0', paddingBottom:'10px'}}>
               <h3 className="section-title" style={{color: '#FF4500', margin:0}}>Items</h3>
               <button onClick={addItem} className="add-item-btn" style={{width:'auto', padding:'5px 15px', fontSize:'13px'}}>
                  <Plus size={14}/> Add New
               </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="item-card" style={{
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
              }}>
                
                {/* ROW 1: Description & HSN */}
                <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                    <div style={{flex: 2}}>
                        <label style={{display: 'block', fontSize: '11px', fontWeight:'600', color: '#888', marginBottom: '5px', textTransform:'uppercase'}}>Description</label>
                        <input 
                        type="text" 
                        placeholder="Item Description" 
                        value={item.description} 
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        style={{width: '100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', outline:'none', fontSize:'14px'}}
                        />
                    </div>
                    <div style={{flex: 1}}>
                        <label style={{display: 'block', fontSize: '11px', fontWeight:'600', color: '#888', marginBottom: '5px', textTransform:'uppercase'}}>HSN Code</label>
                        <input 
                        type="text" 
                        placeholder="HSN" 
                        value={item.hsn} 
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                        style={{width: '100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', outline:'none', fontSize:'14px'}}
                        />
                    </div>
                </div>

                {/* ROW 2: Price, Qty, Total & Delete */}
                <div style={{display: 'flex', gap: '15px', alignItems: 'flex-end'}}>
                    <div style={{flex: 1}}>
                        <label style={{display: 'block', fontSize: '11px', fontWeight:'600', color: '#888', marginBottom: '5px', textTransform:'uppercase'}}>Unit Price</label>
                        <input 
                        type="number" 
                        placeholder="0.00" 
                        value={item.price} 
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        style={{width: '100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', outline:'none', fontSize:'14px'}}
                        />
                    </div>
                    
                    <div style={{flex: 0.8}}>
                        <label style={{display: 'block', fontSize: '11px', fontWeight:'600', color: '#888', marginBottom: '5px', textTransform:'uppercase'}}>Qty</label>
                        <input 
                        type="number" 
                        placeholder="1" 
                        value={item.qty} 
                        onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)}
                        style={{width: '100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', outline:'none', fontSize:'14px', textAlign:'center'}}
                        />
                    </div>

                    <div style={{flex: 1}}>
                        <label style={{display: 'block', fontSize: '11px', fontWeight:'600', color: '#888', marginBottom: '5px', textTransform:'uppercase'}}>Total</label>
                        <div style={{
                            padding: '10px', 
                            background: '#f9f9f9', 
                            border: '1px solid #eee', 
                            borderRadius: '6px', 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            color: '#333',
                            textAlign: 'right'
                        }}>
                            ₹ {(item.price * item.qty).toLocaleString()}
                        </div>
                    </div>

                    <button 
                        onClick={() => removeItem(index)}
                        style={{
                            height: '40px', 
                            width: '40px',
                            background: '#fee2e2', 
                            color: '#ef4444', 
                            border: '1px solid #fecaca', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        title="Remove Item"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>

              </div>
            ))}

            {items.length === 0 && (
                <div style={{textAlign:'center', padding:'20px', color:'#999', border:'1px dashed #ddd', borderRadius:'8px', marginBottom:'15px'}}>
                    No items added yet.
                </div>
            )}
            
            <button onClick={addItem} className="add-item-btn" style={{width:'100%', padding:'12px', fontSize:'14px', fontWeight:'bold', border:'1px dashed #FF4500', background:'#fff5f0', color:'#FF4500'}}>
              <Plus size={16}/> Add New Item
            </button>
          </div>
          {/* Card 4: Tax Rate & Total */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Tax Rate (CGST + SGST %)</label>
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

        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div className="invoice-preview paper-shadow">
          
          <div className="preview-header">
            <div>
              <div style={{ width: '80px', height: '60px', background: '#FF4500', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', marginBottom: '10px' }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>SKITE</span>
              </div>
              <h2 style={{ margin: '5px 0', fontSize: '16px' }}>SKITE</h2>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>{senderDetails.addressLine1}</p>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>{senderDetails.addressLine2}</p>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>GST: {senderDetails.gst}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ color: '#FF4500', fontSize: '28px', margin: '0 0 10px 0' }}>INVOICE</h2>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>NO:</strong> {invoiceMeta.invoiceNo}</p>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>DATE:</strong> {new Date(invoiceMeta.date).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#FF4500', margin: '0 0 5px 0' }}>ISSUED TO:</h4>
            <p style={{ margin: 0, fontWeight: '600' }}>{clientDetails.name || 'Client Name'}</p>
            <p style={{ margin: '2px 0', fontSize: '13px', color: '#666' }}>{clientDetails.addressLine1}</p>
            <p style={{ margin: '2px 0', fontSize: '13px', color: '#666' }}>{clientDetails.addressLine2}</p>
            <p style={{ margin: '2px 0', fontSize: '13px', color: '#666' }}>{clientDetails.location}</p>
          </div>

          <table className="preview-table">
            <thead>
              <tr style={{ background: '#FF4500', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #FF4500' }}>DESCRIPTION</th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #FF4500' }}>HSN</th>
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500' }}>PRICE</th>
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500' }}>QTY</th>
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px', border: '1px solid #FF4500', fontWeight: '600' }}>{item.description}</td>
                  <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #FF4500' }}>{item.hsn}</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500' }}>₹ {item.price.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500' }}>{item.qty}</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500' }}>₹ {(item.price * item.qty).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff7e6', marginBottom: '2px' }}>
              <span style={{ color: '#FF4500' }}>Subtotal</span>
              <span>₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff7e6', marginBottom: '2px' }}>
              <span style={{ color: '#FF4500' }}>CGST {taxRate}%</span>
              <span>₹ {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff7e6', marginBottom: '2px' }}>
              <span style={{ color: '#FF4500' }}>SGST {taxRate}%</span>
              <span>₹ {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#FF4500', color: '#fff', fontWeight: 'bold' }}>
              <span>TOTAL</span>
              <span>₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Invoice;
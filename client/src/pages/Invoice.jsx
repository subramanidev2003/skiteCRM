import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Download, Save, History } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify'; 
import './Invoice.css';

// ✅ IMAGES IMPORT
import skitelogo from '../assets/skitelogo.png'; 
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

  const [taxRate, setTaxRate] = useState(9); // CGST 9% + SGST 9% logic handled in calc

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

      const response = await fetch('http://localhost:4000/api/invoice/create', {
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
  const generatePDF = () => {
    const doc = new jsPDF();
    const orangeColor = [255, 69, 0]; 

    // 1. ADD LOGO 
    try {
        doc.addImage(skitelogo, 'PNG', 14, 10, 40, 29); 
    } catch (e) { console.error("Logo Error:", e); }

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

    // 7. SIGNATORY & SEAL
    const signStartY = finalY + 39; 
    doc.text("for SKITE", 150, signStartY); 

    try {
        doc.addImage(skitesign, 'JPG', 140, finalY + 40, 55, 25); 
    } catch (e) { console.error("Sign Error:", e); }

    try {
        doc.addImage(skiteseal, 'PNG', 75, finalY + 20, 60, 75); 
    } catch (e) { console.error("Seal Error:", e); }

    doc.setFont("helvetica", "bold");
    doc.text("Authorised Signatory", 150, finalY + 70);

    doc.save(`Invoice_${invoiceMeta.invoiceNo}.pdf`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <button className="back-btn" onClick={() => navigate(-1)} style={{border:'none', background:'transparent', cursor:'pointer'}}>
                <ArrowLeft size={24} color="#333" />
            </button>
            <h2 style={{ margin: 0, color: '#333' }}>Create Invoice</h2>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="header-actions" style={{display:'flex', gap:'10px'}}>
            <button 
                className="action-btn" 
                onClick={() => navigate('/admin-dashboard/invoice-history')}
                style={{ backgroundColor: '#6c757d', color:'white', border:'none', padding:'10px 15px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }} 
            >
                <History size={18} /> History
            </button>

            <button 
                className="action-btn" 
                onClick={saveInvoiceToDB}
                style={{ backgroundColor: '#28a745', color:'white', border:'none', padding:'10px 15px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }} 
            >
                <Save size={18} /> Save
            </button>

            <button 
                className="action-btn" 
                onClick={generatePDF}
                style={{ backgroundColor: '#FF4500', color:'white', border:'none', padding:'10px 15px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }} 
            >
                <Download size={18} /> PDF
            </button>
        </div>
      </div>

      {/* MAIN SPLIT LAYOUT (2 TABS VIEW) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: FORM INPUTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Invoice Details */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#FF4500', fontSize:'18px', borderBottom:'1px solid #eee', paddingBottom:'10px' }}>Invoice Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop:'15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'14px', color:'#555' }}>Invoice No</label>
                <input type="text" value={invoiceMeta.invoiceNo} onChange={(e) => setInvoiceMeta({...invoiceMeta, invoiceNo: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'14px', color:'#555' }}>Date</label>
                <input type="date" value={invoiceMeta.date} onChange={(e) => setInvoiceMeta({...invoiceMeta, date: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
            </div>
          </div>

          {/* Card 2: Client Details */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#FF4500', fontSize:'18px', borderBottom:'1px solid #eee', paddingBottom:'10px' }}>Issued To</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop:'15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'14px', color:'#555' }}>Client Name</label>
                <input type="text" value={clientDetails.name} onChange={(e) => setClientDetails({...clientDetails, name: e.target.value})} placeholder="Client Name" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'14px', color:'#555' }}>Address</label>
                <input type="text" value={clientDetails.addressLine1} onChange={(e) => setClientDetails({...clientDetails, addressLine1: e.target.value})} placeholder="Line 1" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom:'8px' }} />
                <input type="text" value={clientDetails.addressLine2} onChange={(e) => setClientDetails({...clientDetails, addressLine2: e.target.value})} placeholder="Line 2" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom:'8px' }} />
                <input type="text" value={clientDetails.location} onChange={(e) => setClientDetails({...clientDetails, location: e.target.value})} placeholder="City / State" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
            </div>
          </div>

          {/* Card 3: Items */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#FF4500', fontSize:'18px', borderBottom:'1px solid #eee', paddingBottom:'10px' }}>Items</h3>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems:'center' }}>
                <input type="text" placeholder="Desc" style={{ flex: 2, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                <input type="text" placeholder="HSN" style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} />
                <input type="number" placeholder="Price" style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} value={item.price} onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))} />
                <input type="number" placeholder="Qty" style={{ flex: 0.5, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} value={item.qty} onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value))} />
                <button onClick={() => removeItem(index)} style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={18}/></button>
              </div>
            ))}
            <button onClick={addItem} style={{ marginTop:'10px', padding: '10px 20px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight:'600' }}>
              <Plus size={18}/> Add Item
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', height:'fit-content' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom:'2px solid #f3f4f6', paddingBottom:'20px' }}>
            <div style={{ display:'flex', gap:'15px', alignItems:'center'}}>
                <img src={skitelogo} alt="Logo" style={{ width: '60px', height:'auto' }} />
                <div>
                    <h2 style={{ margin: '0', fontSize: '20px', color:'#333' }}>SKITE</h2>
                    <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>{senderDetails.addressLine1}</p>
                    <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>GST: {senderDetails.gst}</p>
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ color: '#FF4500', fontSize: '28px', margin: '0 0 5px 0' }}>INVOICE</h2>
              <p style={{ margin: '3px 0', fontSize: '13px', fontWeight:'600' }}>#{invoiceMeta.invoiceNo}</p>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', marginBottom: '30px' }}>
            <div>
              <h4 style={{ color: '#9ca3af', fontSize:'12px', textTransform:'uppercase', margin: '0 0 5px 0' }}>ISSUED TO:</h4>
              <p style={{ margin: 0, fontWeight: '700', fontSize:'16px', color:'#111' }}>{clientDetails.name || "Client Name"}</p>
              <p style={{ margin: '5px 0 0 0', fontSize:'13px', color:'#555' }}>{clientDetails.addressLine1}</p>
              <p style={{ margin: '2px 0 0 0', fontSize:'13px', color:'#555' }}>{clientDetails.location}</p>
            </div>
            <div style={{textAlign:'right'}}>
               <h4 style={{ color: '#9ca3af', fontSize:'12px', textTransform:'uppercase', margin: '0 0 5px 0' }}>DATE:</h4>
               <p style={{ margin: 0, fontWeight: '600', fontSize:'14px' }}>{new Date(invoiceMeta.date).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize:'12px', fontWeight:'600' }}>DESCRIPTION</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize:'12px', fontWeight:'600' }}>HSN</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize:'12px', fontWeight:'600' }}>PRICE</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize:'12px', fontWeight:'600' }}>QTY</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize:'12px', fontWeight:'600' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>
                  <td style={{ padding: '12px', fontSize:'13px', fontWeight:'500' }}>{item.description}</td>
                  <td style={{ padding: '12px', fontSize:'13px', color:'#666' }}>{item.hsn}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize:'13px' }}>{item.price}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize:'13px' }}>{item.qty}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize:'13px', fontWeight:'600' }}>{(item.price * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom:'1px dashed #eee' }}>
                <span style={{ color: '#666', fontSize:'13px' }}>Subtotal</span>
                <span style={{ fontWeight:'600' }}>{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom:'1px dashed #eee' }}>
                <span style={{ color: '#666', fontSize:'13px' }}>CGST (9%)</span>
                <span style={{ fontWeight:'600' }}>{cgst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom:'1px dashed #eee' }}>
                <span style={{ color: '#666', fontSize:'13px' }}>SGST (9%)</span>
                <span style={{ fontWeight:'600' }}>{sgst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', marginTop:'5px' }}>
                <span style={{ color: '#FF4500', fontWeight: 'bold', fontSize:'16px' }}>TOTAL</span>
                <span style={{ color: '#FF4500', fontWeight: 'bold', fontSize:'18px' }}>₹ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Invoice;
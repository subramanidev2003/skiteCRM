import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Download, Save, History, ChevronDown } from 'lucide-react'; 
import { useNavigate, useParams } from 'react-router-dom'; // ✅ useParams சேர்த்துள்ளேன்
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify'; 
import './Invoice.css';

// IMAGES IMPORT
import skitelogo from '../assets/skite-logo.jpg'; 
import skitesign from '../assets/sign.jpg';
import skiteseal from '../assets/seal.png'; 

// DATA LIST
const SERVICES_LIST = [
  { name: 'UX/UI DESIGN', hsn: '998314' },
  { name: 'WEB DEVELOPMENT', hsn: '998314' },
  { name: 'META ADS', hsn: '998365' },
  { name: 'VIDEO SHOOT', hsn: '998382' },
  { name: 'VIDEO EDITING', hsn: '998386' },
  { name: 'CONTENT WRITING', hsn: '999612' },
  { name: 'SOCIAL MEDIA MANAGEMENT', hsn: '998313' },
  { name: 'LINKEDIN CONTENT CREATION', hsn: '998361' },
  { name: 'SEO', hsn: '998319' },
  { name: 'GRAPHIC DESIGN', hsn: '998392' },
  { name: 'APP DEVELOPMENT', hsn: '998314' }
];

const Invoice = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ✅ URL-ல் ID இருந்தால் அதை எடுக்கிறோம்

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
    location: '',
    gstNo: ''
  });

  const [items, setItems] = useState([
    { description: '', hsn: '', price: '', qty: 1 }
  ]);

  const [taxRate, setTaxRate] = useState(9); // Fixed 9%
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const dropdownRef = useRef(null); 

  // --- ✅ NEW: FETCH INVOICE DATA IF ID EXISTS ---
  useEffect(() => {
    if (id) {
        const fetchInvoiceDetails = async () => {
            try {
                const response = await fetch(`https://skitecrm.onrender.com/api/invoice/${id}`);
                const data = await response.json();

                if (response.ok) {
                    // Backend Data-வை State-ல் செட் செய்கிறோம்
                    setInvoiceMeta({
                        invoiceNo: data.invoiceNo,
                        date: data.date.split('T')[0] // Date format fix
                    });
                    setClientDetails(data.clientDetails);
                    setItems(data.items);
                    setTaxRate(data.taxRate || 9);
                } else {
                    toast.error("Failed to load invoice details");
                }
            } catch (error) {
                console.error("Error fetching invoice:", error);
                toast.error("Error loading invoice");
            }
        };
        fetchInvoiceDetails();
    }
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownIndex(null); 
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- CALCULATIONS ---
  const calculateTotal = () => {
    const subtotal = items.reduce((acc, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQty = parseFloat(item.qty) || 0;
        return acc + (itemPrice * itemQty);
    }, 0);

    const cgst = (subtotal * taxRate) / 100;
    const sgst = (subtotal * taxRate) / 100;
    const grandTotal = Math.round(subtotal + cgst + sgst); 
    
    return { subtotal, cgst, sgst, grandTotal };
  };

  const { subtotal, cgst, sgst, grandTotal } = calculateTotal();

  // Number to Words
  const numberToWords = (price) => {
    const sglDigit = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const dblDigit = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tensPlace = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convert = (num) => {
      let str = "";
      if (num < 10) return sglDigit[num];
      if (num < 20) return dblDigit[num - 10];
      if (num < 100) {
        str = tensPlace[Math.floor(num / 10)];
        if (num % 10 !== 0) str += " " + sglDigit[num % 10];
        return str;
      }
      if (num < 1000) {
        str = sglDigit[Math.floor(num / 100)] + " Hundred";
        if (num % 100 !== 0) str += " and " + convert(num % 100);
        return str;
      }
      if (num < 100000) {
        str = convert(Math.floor(num / 1000)) + " Thousand";
        if (num % 1000 !== 0) str += " " + convert(num % 1000);
        return str;
      }
      if (num < 10000000) {
        str = convert(Math.floor(num / 100000)) + " Lakh";
        if (num % 100000 !== 0) str += " " + convert(num % 100000);
        return str;
      }
      return "Number too large";
    };

    const num = Math.floor(price);
    if (num === 0) return "Zero Rupees Only";
    return "Indian Rupees " + convert(num) + " Only";
  };

  // --- HANDLERS ---
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleServiceSelect = (index, service) => {
      const newItems = [...items];
      newItems[index].description = service.name;
      newItems[index].hsn = service.hsn; 
      setItems(newItems);
      setActiveDropdownIndex(null); 
  };

  const addItem = () => {
    setItems([...items, { description: '', hsn: '', price: '', qty: 1 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // SAVE TO DB (Create)
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
          price: parseFloat(item.price) || 0,
          qty: parseFloat(item.qty) || 0,
          total: (parseFloat(item.price) || 0) * (parseFloat(item.qty) || 0)
        })),
        subtotal,
        taxRate,
        cgst,
        sgst,
        grandTotal
      };

      // ✅ EDIT MODE: If ID exists, we could use PUT (but backend only has create for now)
      // For now, we will create NEW even if editing, unless you add UPDATE route.
      // If you want to just View and Generate PDF, this is fine.
      
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
      toast.error("Server Error");
    }
  };

  // PDF GENERATION
  const generatePDF = async () => {
    let fileName = prompt("Enter PDF File Name:", `Invoice_${invoiceMeta.invoiceNo.replace(/\//g, '-')}`);
    
    if (fileName === null) return; 
    if (!fileName.trim()) fileName = `Invoice_${invoiceMeta.invoiceNo.replace(/\//g, '-')}`; 
    if (!fileName.endsWith('.pdf')) fileName += '.pdf'; 

    const doc = new jsPDF();
    const orangeColor = [255, 69, 0]; 

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

    try {
        const logoBase64 = await getImageBase64(skitelogo);
        doc.addImage(logoBase64, 'JPG', 14, 10, 40, 29); 
    } catch (e) { 
        console.error("Logo Error:", e);
    }

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

    doc.setFontSize(22);
    doc.setTextColor(255, 69, 0);
    doc.text("INVOICE", 195, 25, { align: 'right' });

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
    
    if(clientDetails.gstNo) {
        doc.setFont("helvetica", "bold");
        doc.text(`GST: ${clientDetails.gstNo}`, 14, infoStartY + 26);
    }

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

    const tableBody = items.map(item => {
        const price = parseFloat(item.price) || 0;
        const qty = parseFloat(item.qty) || 0;
        return [
            item.description,
            item.hsn,
            price.toFixed(2),
            qty,
            (price * qty).toFixed(2)
        ];
    });

    tableBody.push(
      ['', '', '', 'Subtotal', subtotal.toFixed(2)],
      ['', '', '', `CGST ${taxRate}%`, cgst.toFixed(2)],
      ['', '', '', `SGST ${taxRate}%`, sgst.toFixed(2)],
      ['', '', '', 'TOTAL', grandTotal] 
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

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold"); 
    doc.text("Amount in Words:", 14, finalY);
    doc.setFont("helvetica", "italic");
    doc.text(numberToWords(grandTotal), 45, finalY);

    doc.setFont("helvetica", "normal");
    doc.text("PAY TO:", 14, finalY + 15);
    doc.setFont("helvetica", "bold");
    doc.text(bankDetails.bankName, 14, finalY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(`Account Name: ${bankDetails.accountName}`, 14, finalY + 25);
    doc.text(`Account No: ${bankDetails.accountNo}`, 14, finalY + 30);
    doc.text(`IFSC: ${bankDetails.ifsc}`, 14, finalY + 35);
    doc.text(`Branch: ${bankDetails.branch}`, 14, finalY + 40);

    doc.setFontSize(9);
    doc.text(senderDetails.email, 14, finalY + 55);
    doc.text(senderDetails.website, 14, finalY + 60);
    doc.text(senderDetails.phone, 14, finalY + 65);

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

    doc.save(fileName);
  };

  return (
    <div className="invoice-container">
      
      {/* HEADER SECTION */}
      <div className="invoice-header-nav">
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
           <button 
                onClick={() => navigate('/admin-dashboard')}
                className="modern-back-btn" 
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', background: 'white',
                    border: '1px solid #e0e0e0', padding: '8px 16px', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#4b5563',
                    transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
            >
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>
            <h2 style={{ margin: 0, color: '#333' }}>{id ? 'View / Edit Invoice' : 'Create Invoice'}</h2>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="header-actions">
            <button className="action-btn" onClick={() => navigate('/admin-dashboard/invoice-history')} style={{ backgroundColor: '#6c757d' }}>
                <History size={18} /> History
            </button>
            
            {/* Show Save button only if needed, usually we don't update invoices once created, but you can leave it */}
            <button className="action-btn" onClick={saveInvoiceToDB} style={{ backgroundColor: '#28a745' }}>
                <Save size={18} /> Save New
            </button>
            
            <button className="action-btn" onClick={generatePDF} style={{ backgroundColor: '#FF4500' }}>
                <Download size={18} /> PDF
            </button>
        </div>
      </div>

      {/* MAIN SPLIT LAYOUT */}
      <div className="invoice-workspace">
        
        {/* LEFT COLUMN: FORM INPUTS */}
        <div className="invoice-form">
          
          {/* Card 1: Invoice Details */}
          <div className="form-section">
            <h3 className="section-title">Invoice Details</h3>
            <div className="row-inputs">
              <div className="input-group">
                <label>Invoice No</label>
                <input type="text" value={invoiceMeta.invoiceNo} onChange={(e) => setInvoiceMeta({...invoiceMeta, invoiceNo: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Date</label>
                <input type="date" value={invoiceMeta.date} onChange={(e) => setInvoiceMeta({...invoiceMeta, date: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Card 2: Client Details */}
          <div className="form-section">
            <h3 className="section-title">Issued To</h3>
            <div className="input-group">
              <label>Client Name</label>
              <input type="text" value={clientDetails.name} onChange={(e) => setClientDetails({...clientDetails, name: e.target.value})} placeholder="Client Name"/>
            </div>
            
            <div className="input-group">
              <label>Client GST No</label>
              <input type="text" value={clientDetails.gstNo} onChange={(e) => setClientDetails({...clientDetails, gstNo: e.target.value})} placeholder="Ex: 33AAAAA0000A1Z5"/>
            </div>

            <div className="input-group">
              <label>Address</label>
              <input type="text" value={clientDetails.addressLine1} onChange={(e) => setClientDetails({...clientDetails, addressLine1: e.target.value})} placeholder="Line 1"/>
              <input type="text" value={clientDetails.addressLine2} onChange={(e) => setClientDetails({...clientDetails, addressLine2: e.target.value})} placeholder="Line 2" style={{marginTop:'5px'}}/>
              <input type="text" value={clientDetails.location} onChange={(e) => setClientDetails({...clientDetails, location: e.target.value})} placeholder="City / State" style={{marginTop:'5px'}}/>
            </div>
          </div>

          {/* Card 3: Items - CUSTOM DROPDOWN INPUT */}
          <div className="form-section">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'2px solid #f0f0f0', paddingBottom:'10px'}}>
               <h3 className="section-title" style={{color: '#FF4500', margin:0}}>Items</h3>
               <button onClick={addItem} className="add-item-btn" style={{width:'auto', padding:'5px 15px', fontSize:'13px'}}>
                  <Plus size={14}/> Add New
               </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="item-card" style={{
                  background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px',
                  padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
              }}>
                
                {/* ROW 1: Description & HSN */}
                <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                    
                    {/* CUSTOM SEARCHABLE DROPDOWN */}
                    <div style={{flex: 2, position: 'relative'}} ref={dropdownRef}>
                        <label style={{display: 'block', fontSize: '11px', fontWeight:'600', color: '#888', marginBottom: '5px', textTransform:'uppercase'}}>Description</label>
                        
                        <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                            <input 
                                type="text" 
                                placeholder="Type or Select Service..."
                                value={item.description}
                                onChange={(e) => {
                                    handleItemChange(index, 'description', e.target.value);
                                    setActiveDropdownIndex(index); 
                                }}
                                onFocus={() => setActiveDropdownIndex(index)} 
                                style={{width: '100%', padding:'10px', paddingRight: '35px', border:'1px solid #ddd', borderRadius:'6px', outline:'none', fontSize:'14px'}}
                            />
                            {/* Chevron Icon */}
                            <ChevronDown 
                                size={16} 
                                style={{position: 'absolute', right: '10px', color: '#999', pointerEvents: 'none'}} 
                            />
                        </div>

                        {/* Dropdown List */}
                        {activeDropdownIndex === index && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                background: 'white', border: '1px solid #ddd', borderRadius: '6px',
                                marginTop: '5px', maxHeight: '150px', overflowY: 'auto',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                {SERVICES_LIST.filter(s => s.name.toLowerCase().includes(item.description.toLowerCase())).map((service, i) => (
                                    <div 
                                        key={i}
                                        onMouseDown={() => handleServiceSelect(index, service)} 
                                        style={{
                                            padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                                            fontSize: '13px', display: 'flex', justifyContent: 'space-between'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        <span>{service.name}</span>
                                        <span style={{color: '#888', fontSize: '11px'}}>{service.hsn}</span>
                                    </div>
                                ))}
                                {SERVICES_LIST.filter(s => s.name.toLowerCase().includes(item.description.toLowerCase())).length === 0 && (
                                    <div style={{padding: '10px', color: '#999', fontSize: '13px', fontStyle: 'italic'}}>
                                        No matching service found. Keep typing...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{flex: 1}}>
                        <label style={{display:'block', fontSize: '11px', fontWeight:'600', color: '#888', marginBottom: '5px', textTransform:'uppercase'}}>HSN Code</label>
                        <input 
                        type="text" 
                        placeholder="HSN" 
                        value={item.hsn} 
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                        style={{width: '100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', outline:'none', fontSize:'14px', background:'#f9f9f9'}}
                        />
                    </div>
                </div>

                {/* ROW 2: Price, Qty, Total & Delete */}
                <div style={{display: 'flex', gap: '15px', alignItems: 'flex-end'}}>
                    <div style={{flex: 1}}>
                        <label style={{display:'block', fontSize: '11px', fontWeight:'600', color: '#888', marginBottom: '5px', textTransform:'uppercase'}}>Unit Price</label>
                        <input 
                        type="number" 
                        placeholder="0.00" 
                        value={item.price} 
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)} 
                        style={{width: '100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', outline:'none', fontSize:'14px'}}
                        />
                    </div>
                    
                    <div style={{flex: 0.8}}>
                        <label style={{display:'block', fontSize: '11px', fontWeight:'600', color: '#888', marginBottom: '5px', textTransform:'uppercase'}}>Qty</label>
                        <input 
                        type="number" 
                        placeholder="1" 
                        value={item.qty} 
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        style={{width: '100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', outline:'none', fontSize:'14px', textAlign:'center'}}
                        />
                    </div>

                    <div style={{flex: 1}}>
                        <label style={{display:'block', fontSize: '11px', fontWeight:'600', color: '#888', marginBottom: '5px', textTransform:'uppercase'}}>Total</label>
                        <div style={{
                            padding: '10px', background: '#f9f9f9', border: '1px solid #eee', 
                            borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', 
                            color: '#333', textAlign: 'right'
                        }}>
                            ₹ {((parseFloat(item.price)||0) * (parseFloat(item.qty)||0)).toLocaleString()}
                        </div>
                    </div>

                    <button onClick={() => removeItem(index)}
                        style={{
                            height: '40px', width: '40px', background: '#fee2e2', color: '#ef4444', 
                            border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }} title="Remove Item">
                        <Trash2 size={18}/>
                    </button>
                </div>

              </div>
            ))}
            
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
  placeholder="0"
  onWheel={(e) => e.target.blur()}
  style={{ 
      width: '100px', 
      padding: '8px', 
      border: '1px solid #ddd', 
      borderRadius: '4px', 
      fontSize: '16px',
      background: 'white' 
  }}
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
          {/* ... Preview Code same as before ... */}
          
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
            {clientDetails.gstNo && <p style={{ margin: '2px 0', fontSize: '13px', fontWeight:'bold' }}>GST: {clientDetails.gstNo}</p>}
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
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500' }}>₹ {(parseFloat(item.price)||0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500' }}>{item.qty}</td>
                  <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #FF4500' }}>₹ {((parseFloat(item.price)||0) * (parseFloat(item.qty)||0)).toLocaleString('en-IN')}</td>
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
              <span>₹ {grandTotal.toLocaleString('en-IN')}</span>
            </div>
            
             <div style={{ marginTop:'10px', fontSize:'12px', fontStyle:'italic', color:'#555' }}>
               <strong>Amount in Words:</strong> {numberToWords(grandTotal)}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Invoice;
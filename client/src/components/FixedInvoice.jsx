import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileCheck } from 'lucide-react';

const FixedInvoice = () => {
    const navigate = useNavigate();

    // ✅ FIXED CLIENTS DATA FULLY UPDATED
    const fixedClients = [
        {
            id: 'sr-automation',
            name: 'SR AUTOMATION',
            clientDetails: {
                name: 'SR AUTOMATION',
                addressLine1: 'No 197-B, Sivasakthi Colony, Sidco',
                addressLine2: 'industrial post',
                location: 'Coimbatore - 641021',
                gstNo: '33BWDPS2896E2ZA'
            },
            items: [
                { description: 'SEO SERVICE', hsn: '998319', price: '12000', qty: 1 }
            ],
            taxRate: 9 // 18% GST (9% CGST + 9% SGST)
        },
        {
            id: 'sathyan',
            name: 'SATHYAN',
            clientDetails: { 
                name: 'Pranavaditya Structures', 
                addressLine1: '28 C R Sundaram Bros Layout Opp A I R', 
                addressLine2: 'Trichy Road, Ramanathapuram', 
                location: 'Coimbatore 641045 , TamilNadu, India.', 
                gstNo: '33AAQFP2766G1ZZ' 
            },
            items: [
                { description: 'ONLINE CONTENT VIDEOS', hsn: '998433', price: '1000', qty: 12 }
            ],
            taxRate: 9 // 18% GST (9% CGST + 9% SGST)
        },
        {
            id: 'corporate-concepts',
            name: 'CORPORATE CONCEPTS',
            clientDetails: { 
                name: 'CORPORATE CONCEPTS', 
                addressLine1: 'No 864 Raja Street', 
                addressLine2: '', 
                location: 'Coimbatore - 641001', 
                gstNo: '33AHAPA6508L1ZO' 
            },
            items: [
                { description: 'WEBSITE SEO', hsn: '998319', price: '12300', qty: 1 },
                { description: 'LINKEDIN (PERSONAL BRANDING)', hsn: '998397', price: '7000', qty: 1 }
            ],
            taxRate: 9 // 18% GST (9% CGST + 9% SGST)
        },
        {
            id: 'season-6',
            name: 'SEASON 6',
            clientDetails: { 
                name: 'Season6 Holidays', 
                addressLine1: '14, Jaya gardern, Ambal nagar', 
                addressLine2: 'Poosaripalayam', 
                location: 'Ganapathy Coimbatore', 
                gstNo: '' 
            },
            items: [
                { description: 'ONLINE CONTENT VIDEOS', hsn: '998433', price: '1750', qty: 4 }
            ],
            taxRate: 0 // NO GST
        },
        {
            id: 'bala',
            name: 'BALA',
            // BALA details baaki irukku, kidaichathum inga update pannikonga
            clientDetails: { name: 'BALAMURUGAN', addressLine1: '', addressLine2: '', location: '', gstNo: '' },
            items: [{ description: 'ONLINE CONTENT VIDEOS', hsn: '998433', price: '1000', qty: 20 }],
            taxRate: 0 
        },
        {
            id: 'antony',
            name: 'ANTONY',
            clientDetails: { 
                name: 'ANTONY K C', 
                addressLine1: '', 
                addressLine2: '', 
                location: '', 
                gstNo: '' 
            },
            items: [
                { description: 'ONLINE CONTENT VIDEOS', hsn: '998433', price: '1000', qty: 25 }
            ],
            taxRate: 0 // NO GST
        }
    ];

    const handleClientClick = (client) => {
        // State-il data-vai pass seigirom
        navigate('/admin-dashboard/invoice', { state: { predefinedData: client } });
    };

    return (
        <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button
                    onClick={() => navigate('/admin-dashboard')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 15px', border: 'none', borderRadius: '6px',
                        backgroundColor: '#e5e7eb', color: '#374151', cursor: 'pointer', fontWeight: '500'
                    }}
                >
                    <ArrowLeft size={18} /> Dashboard
                </button>
                <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>Fixed Invoices</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {fixedClients.map((client) => (
                    <div
                        key={client.id}
                        onClick={() => handleClientClick(client)}
                        style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            borderTop: '4px solid #FF4500'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                        }}
                    >
                        <FileCheck size={40} color="#FF4500" style={{ marginBottom: '15px' }} />
                        <h3 style={{ margin: 0, color: '#111827', fontSize: '18px', textAlign: 'center' }}>{client.name}</h3>
                        <p style={{ margin: '10px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Click to generate invoice</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FixedInvoice;
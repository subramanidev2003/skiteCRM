import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, User, Calendar, MapPin } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import skitelogo from '../assets/skitelogo.png'; 
import skitesign from '../assets/sign.jpg'; // Sasiprakash Signature
import skiteseal from '../assets/seal.png'; // Skite Seal

const OfferLetter = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        candidateName: '',
        address: '',
        email: '',
        joiningDate: '',
        relievingDate: '',
        duration: '3 Month',
        designation: 'Web Development Intern'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Helper to convert Image to Base64
    const getImageBase64 = (imgSrc) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width; canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(null);
            img.src = imgSrc;
        });
    };

    const generatePDF = async () => {
        if (!formData.candidateName || !formData.joiningDate) {
            return toast.warning("Please fill candidate name and joining date");
        }

        setLoading(true);
        const doc = new jsPDF();
        
        // Assets
        const logo = await getImageBase64(skitelogo);
        const sign = await getImageBase64(skitesign);
        const seal = await getImageBase64(skiteseal);

        // --- Header Section ---
        if (logo) doc.addImage(logo, 'PNG', 15, 10, 35, 25);
        
        doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0);
        doc.text("SKITE", 160, 15); // [cite: 2]
        doc.setFont("helvetica", "normal").setFontSize(8);
        doc.text("NO5, lords avenue, Ganapathy polyclinic, Gandhinagar,", 115, 20); // [cite: 3]
        doc.text("Sundarapuram, Coimbatore - 641024", 143, 24); // [cite: 4]
        doc.text("8754281434 | skitedigital.in@gmail.com", 142, 28); // [cite: 5, 6]
        doc.text("skitedigital.in", 175, 32); // [cite: 7]

        doc.setLineWidth(0.5).line(15, 38, 195, 38);

        // --- Date & Address ---
        const today = new Date().toLocaleDateString('en-GB');
        doc.setFontSize(10).setFont("helvetica", "bold").text(`Date: ${today}`, 15, 48); // [cite: 8]
        
        doc.text("To:", 15, 58); // [cite: 9]
        doc.setFont("helvetica", "normal").text(formData.candidateName.toUpperCase(), 15, 63); // [cite: 9]
        doc.text(formData.address || "Address Not Provided", 15, 68, { maxWidth: 80 }); // [cite: 10]
        doc.text(formData.email, 15, 78); // [cite: 11]

        // --- Subject ---
        doc.setFont("helvetica", "bold").text(`Subject: Offer Letter for the Position of ${formData.designation}`, 15, 90); // [cite: 12]

        // --- Salutation & Body ---
        doc.setFont("helvetica", "normal").text(`Dear, ${formData.candidateName}`, 15, 100); // [cite: 13]
        const introText = `We are pleased to offer you the position of ${formData.designation} at Skite, based on the successful evaluation of your profile and interview.`; // [cite: 13]
        doc.text(introText, 15, 106, { maxWidth: 180 });

        doc.text(`Your joining date will be [${formData.joiningDate}] and relieving Date [${formData.relievingDate || 'TBD'}].`, 15, 116); // [cite: 14]

        // --- Terms of Employment ---
        doc.setFont("helvetica", "bold").text("Terms of Employment:", 15, 126); // [cite: 15]
        doc.setFont("helvetica", "normal");
        doc.text(`Designation: ${formData.designation}`, 20, 132); // 
        doc.text(`Duration: ${formData.duration}`, 120, 132); // 
        doc.text("Reporting to: Sasiprakash (CEO)", 20, 138); // [cite: 17]
        doc.text("Work Location: Sundarapuram", 120, 138); // [cite: 18]

        // --- Role & Responsibilities ---
        doc.setFont("helvetica", "bold").text("Role & Responsibilities:", 15, 150); // [cite: 20]
        doc.setFont("helvetica", "normal").setFontSize(9);
        const responsibilities = [
            "• Assist in developing and maintaining websites and web applications.", // [cite: 21]
            "• Work with the team to design, code, and test new features.", // [cite: 22]
            "• Help improve website layout, functionality, and performance.", // [cite: 23]
            "• Fix bugs and support troubleshooting activities.", // [cite: 24]
            "• Support documentation and daily project updates." // [cite: 25]
        ];
        responsibilities.forEach((item, index) => {
            doc.text(item, 20, 156 + (index * 6));
        });

        // --- Document Submission ---
        doc.setFont("helvetica", "bold").setFontSize(10).text("Document Submission:", 15, 192); // [cite: 26]
        doc.setFont("helvetica", "normal").setFontSize(9);
        const docText = "Submit your 10th or 12th original certificate. We will issue an official acknowledgement receipt for your document submission, and it will be safely returned to you at the time of exit."; // [cite: 27, 28]
        doc.text(docText, 15, 198, { maxWidth: 180 });

        // --- Signature Section ---
        const footerY = 230;
        doc.setFontSize(10).setFont("helvetica", "normal").text("Warm Regards,", 15, footerY); // [cite: 38]
        doc.setFont("helvetica", "bold").text("SASIPRAKASH A", 15, footerY + 6); // [cite: 38]
        doc.setFont("helvetica", "normal").text("Chief Executive Officer", 15, footerY + 11); // [cite: 39]
        doc.text("SKITE", 15, footerY + 16); // [cite: 39]

        if (sign) doc.addImage(sign, 'JPG', 12, footerY + 18, 40, 15); // 
        if (seal) doc.addImage(seal, 'PNG', 140, footerY - 10, 45, 45); //

        doc.save(`Offer_Letter_${formData.candidateName.replace(/\s+/g, '_')}.pdf`);
        setLoading(false);
        toast.success("Offer Letter Generated!");
    };

    return (
        <div className="offer-letter-container" style={{ padding: '30px', maxWidth: '800px', margin: 'auto' }}>
            <button onClick={() => navigate('/admin-dashboard')} className="modern-back-btn" style={{ marginBottom: '20px' }}>
                <ArrowLeft size={18} /> Back
            </button>

            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FF4500', marginBottom: '25px' }}>
                    <FileText size={28} /> Generate Intern Offer Letter
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-field">
                        <label><User size={14} /> Candidate Name</label>
                        <input type="text" name="candidateName" value={formData.candidateName} onChange={handleChange} placeholder="Full Name" />
                    </div>
                    <div className="input-field">
                        <label><Calendar size={14} /> Joining Date</label>
                        <input type="text" name="joiningDate" value={formData.joiningDate} onChange={handleChange} placeholder="e.g. 06/10/2025" />
                    </div>
                    <div className="input-field">
                        <label><Calendar size={14} /> Relieving Date</label>
                        <input type="text" name="relievingDate" value={formData.relievingDate} onChange={handleChange} placeholder="e.g. 06/01/2026" />
                    </div>
                    <div className="input-field">
                        <label><MapPin size={14} /> Full Address</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Candidate Address" rows="2" />
                    </div>
                    <div className="input-field" style={{ gridColumn: 'span 2' }}>
                        <label>Candidate Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@gmail.com" />
                    </div>
                </div>

                <button 
                    onClick={generatePDF} 
                    disabled={loading}
                    style={{ 
                        marginTop: '30px', width: '100%', padding: '15px', background: '#FF4500', 
                        color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}
                >
                    {loading ? "Processing..." : <><Download size={20} /> Download Offer Letter PDF</>}
                </button>
            </div>
        </div>
    );
};

export default OfferLetter;
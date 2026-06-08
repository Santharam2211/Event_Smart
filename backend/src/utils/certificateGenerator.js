const { jsPDF } = require('jspdf');

const generateCertificate = async (data) => {
    // data contains: { participantName, eventName, date, role }
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 600]
    });

    // Background color
    doc.setFillColor(252, 252, 252);
    doc.rect(0, 0, 800, 600, 'F');

    // Border
    doc.setDrawColor(2, 132, 199); // primary-600
    doc.setLineWidth(10);
    doc.rect(20, 20, 760, 560);

    // Inner Border
    doc.setDrawColor(224, 242, 254); // primary-100
    doc.setLineWidth(2);
    doc.rect(35, 35, 730, 530);

    // Title
    doc.setTextColor(12, 74, 110); // primary-900
    doc.setFontSize(48);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE', 400, 150, { align: 'center' });
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'normal');
    doc.text('OF PARTICIPATION', 400, 185, { align: 'center' });

    // Body
    doc.setFontSize(20);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('This is to certify that', 400, 260, { align: 'center' });

    doc.setFontSize(36);
    doc.setTextColor(2, 132, 199); // primary-600
    doc.setFont('helvetica', 'bolditalic');
    doc.text(data.participantName.toUpperCase(), 400, 310, { align: 'center' });

    doc.setFontSize(20);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`has successfully participated in the ${data.eventName}`, 400, 360, { align: 'center' });
    doc.text(`conducted on ${data.date}`, 400, 390, { align: 'center' });

    // Placeholder for Signature
    doc.setDrawColor(203, 213, 225);
    doc.line(150, 500, 300, 500);
    doc.line(500, 500, 650, 500);

    doc.setFontSize(14);
    doc.text('Event Coordinator', 225, 520, { align: 'center' });
    doc.text('Institution Head', 575, 520, { align: 'center' });

    return doc.output('arraybuffer');
};

module.exports = generateCertificate;

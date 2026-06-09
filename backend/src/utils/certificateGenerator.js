const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const generateCertificate = async (registration, config) => {
    // registration contains participant and event info
    // config contains template filename and fields array

    const { participant, event } = registration;
    
    // Determine Prefix
    const prefix = participant.gender === 'Female' ? 'Selvi' : 'Selvan';
    const year = participant.yearAndDept?.split(' ')[0] || '';
    const dept = participant.yearAndDept?.split(' ').slice(1).join(' ') || '';
    const yearAndDept = participant.yearAndDept || '';

    const variables = {
        'Prefix': prefix,
        'Name': participant.username,
        'Year': year,
        'Department': dept,
        'Year&Department': yearAndDept,
        'EventName': event?.title || '',
        'RegistrationID': registration.registrationId
    };

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 565]
    });

    // Load template image
    if (config.template) {
        const templatePath = path.join(__dirname, '../../uploads', config.template);
        if (fs.existsSync(templatePath)) {
            const imgData = fs.readFileSync(templatePath).toString('base64');
            const format = config.template.split('.').pop().toUpperCase();
            doc.addImage(imgData, format === 'JPG' ? 'JPEG' : format, 0, 0, 800, 565);
        }
    }

    // Process fields
    config.fields.forEach(field => {
        let text = '';
        if (field.type === 'Text') {
            text = field.text || '';
            // Interpolate variables: {Name} -> John Doe
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`{${key}}`, 'g');
                text = text.replace(regex, variables[key]);
            });
        } else {
            // Legacy/Direct field types
            switch (field.type) {
                case 'Prefix': text = prefix; break;
                case 'Name': text = participant.username; break;
                case 'Year': text = year; break;
                case 'Department': text = dept; break;
                default: text = '';
            }
        }

        if (text) {
            doc.setFontSize(field.fontSize || 20);
            doc.setTextColor(field.color || '#000000');
            
            let style = field.fontStyle || 'normal';
            doc.setFont('helvetica', style);

            const align = field.alignment || 'left';
            
            // If text contains newlines, jsPDF handles it in text() but check width
            doc.text(text, field.x, field.y, { 
                align: align,
                maxWidth: field.width || 700 // default max width to prevent overflow
            });
        }
    });

    return doc.output('arraybuffer');
};

module.exports = generateCertificate;

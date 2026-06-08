const ExcelJS = require('exceljs');

const generateExcelReport = async (registrations, eventTitle) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');

    worksheet.columns = [
        { header: 'No', key: 'no', width: 10 },
        { header: 'Registration ID', key: 'regId', width: 25 },
        { header: 'Participant Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Student ID', key: 'studentId', width: 20 },
        { header: 'Attendance', key: 'attendance', width: 15 },
        { header: 'Check-in Time', key: 'time', width: 25 },
    ];

    registrations.forEach((reg, index) => {
        worksheet.addRow({
            no: index + 1,
            regId: reg.registrationId,
            name: reg.participant?.username || 'N/A',
            email: reg.participant?.email || 'N/A',
            studentId: reg.participant?.registrationNumber || '-',
            attendance: reg.attendanceStatus ? 'Yes' : 'No',
            time: reg.attendanceTime ? new Date(reg.attendanceTime).toLocaleString() : '-'
        });
    });

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F2FE' }
    };

    return await workbook.xlsx.writeBuffer();
};

module.exports = { generateExcelReport };

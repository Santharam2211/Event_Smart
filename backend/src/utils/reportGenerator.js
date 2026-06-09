const ExcelJS = require('exceljs');

const generateExcelReport = async (registrations, eventTitle) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');

    // 1. Determine all unique static and dynamic keys
    const dynamicKeys = new Set();
    registrations.forEach(reg => {
        if (reg.formData) {
            // formData is a Map or Object
            const data = (reg.formData instanceof Map) ? Object.fromEntries(reg.formData) : reg.formData;
            Object.keys(data).forEach(key => dynamicKeys.add(key));
        }
    });

    const columns = [
        { header: 'No', key: 'no', width: 10 },
        { header: 'Registration ID', key: 'regId', width: 25 },
        { header: 'Participant Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Student ID', key: 'studentId', width: 20 },
    ];

    // Add dynamic keys as columns
    const dynamicArray = Array.from(dynamicKeys);
    dynamicArray.forEach(key => {
        columns.push({ header: key, key: `dyn_${key}`, width: 25 });
    });

    columns.push(
        { header: 'Attendance', key: 'attendance', width: 15 },
        { header: 'Check-in Time', key: 'time', width: 25 },
    );

    worksheet.columns = columns;

    // 2. Add Rows
    registrations.forEach((reg, index) => {
        const rowData = {
            no: index + 1,
            regId: reg.registrationId,
            name: reg.participant?.username || 'N/A',
            email: reg.participant?.email || 'N/A',
            studentId: reg.participant?.registrationNumber || '-',
            attendance: reg.attendanceStatus ? 'Yes' : 'No',
            time: reg.attendanceTime ? new Date(reg.attendanceTime).toLocaleString() : '-'
        };

        if (reg.formData) {
            const data = (reg.formData instanceof Map) ? Object.fromEntries(reg.formData) : reg.formData;
            dynamicArray.forEach(key => {
                rowData[`dyn_${key}`] = data[key] || '-';
            });
        }

        worksheet.addRow(rowData);
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F2FE' }
    };

    return await workbook.xlsx.writeBuffer();
};

module.exports = { generateExcelReport };

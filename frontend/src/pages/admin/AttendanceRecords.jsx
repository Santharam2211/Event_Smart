import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Download, Users, CheckCircle, XCircle,
    Calendar, Search, Loader2, FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const AttendanceRecords = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [records, setRecords] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/events');
                setEvents(res.data);
            } catch {
                toast.error('Failed to load events');
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (!selectedEvent) {
            setRecords(null);
            return;
        }

        const fetchRecords = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/attendance/records/${selectedEvent}`);
                setRecords(res.data);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to load attendance records');
                setRecords(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecords();
    }, [selectedEvent]);

    const handleExport = async () => {
        if (!selectedEvent) return;
        setIsExporting(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/attendance/export/${selectedEvent}`, {
                responseType: 'blob'
            });
            const eventTitle = records?.event?.title || 'Event';
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Attendance_${eventTitle.replace(/\s/g, '_')}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Attendance report downloaded!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const filteredRecords = records?.records?.filter((reg) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            reg.registrationId?.toLowerCase().includes(term) ||
            reg.participant?.username?.toLowerCase().includes(term) ||
            reg.participant?.email?.toLowerCase().includes(term)
        );
    }) || [];

    const handleDownloadPDF = async () => {
        if (!records) return;
        setIsLoading(true);
        
        try {
            const doc = new jsPDF();
            const event = records.event;
            const isTeamEvent = records.records?.[0]?.team != null;
            
            // Helper to load image as Base64 for reliable PDF adding
            const getBase64Image = async (url) => {
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    return null;
                }
            };

            // Pre-load all signatures
            const signatures = await Promise.all(
                filteredRecords.map(async (reg) => {
                    if (!reg.signature) return null;
                    const sigUrl = reg.signature.startsWith('data:') 
                        ? reg.signature 
                        : `http://localhost:5000/uploads/${reg.signature}`;
                    return await getBase64Image(sigUrl);
                })
            );
            
            // 1. Institutional Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("EVENT MANAGEMENT SYSTEM", 105, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text("OFFICIAL ATTENDANCE RECORD", 105, 22, { align: 'center' });
            
            // Event Details Box
            doc.setDrawColor(40, 40, 40);
            doc.rect(15, 28, 180, 25);
            doc.setFontSize(10);
            doc.text(`Event: ${event.title}`, 20, 35);
            doc.setFont("helvetica", "normal");
            doc.text(`Venue: ${event.venue}`, 20, 42);
            doc.text(`Date: ${new Date(event.eventDate).toLocaleDateString()}`, 20, 49);
            
            doc.setFont("helvetica", "bold");
            doc.text(`Type: ${isTeamEvent ? 'Team-Based' : 'Individual'}`, 140, 35);
            doc.text(`Status: Completed`, 140, 42);

            // 2. Attendance Table
            const head = isTeamEvent 
                ? [['#', 'Team Name', 'Participant Name', 'Reg ID', 'Signature']]
                : [['#', 'Participant Name', 'Reg ID', 'Email', 'Signature']];

            const body = filteredRecords.map((reg, index) => {
                if (isTeamEvent) {
                    return [index + 1, reg.team?.name || 'N/A', reg.participant?.username || 'N/A', reg.registrationId, ''];
                } else {
                    return [index + 1, reg.participant?.username || 'N/A', reg.registrationId, reg.participant?.email || 'N/A', ''];
                }
            });

            doc.autoTable({
                startY: 60,
                head: head,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
                styles: { fontSize: 8, cellPadding: 4, verticalAlign: 'middle' },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    4: { cellWidth: 45, minCellHeight: 18 }
                },
                didDrawCell: (data) => {
                    if (data.section === 'body' && data.column.index === 4) {
                        const sigData = signatures[data.row.index];
                        if (sigData) {
                            const imgSize = 12;
                            const x = data.cell.x + (data.cell.width - imgSize * 2) / 2;
                            const y = data.cell.y + 2;
                            doc.addImage(sigData, 'PNG', x, y, imgSize * 2, imgSize);
                        }
                    }
                }
            });

            // 3. Footer with Signatures
            let finalY = doc.lastAutoTable.finalY + 35;
            if (finalY > 260) { doc.addPage(); finalY = 40; }

            doc.setFont("helvetica", "bold");
            doc.text("__________________________", 50, finalY, { align: 'center' });
            doc.text("Association Coordinator", 50, finalY + 7, { align: 'center' });

            doc.text("__________________________", 160, finalY, { align: 'center' });
            doc.text("Head of Department", 160, finalY + 7, { align: 'center' });

            doc.save(`Attendance_${event.title.replace(/\s/g, '_')}.pdf`);
            toast.success('Professional Report Downloaded!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate PDF. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-10 pb-40">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                        Attendance <span className="text-indigo-600">Records</span>
                    </h1>
                    <p className="text-slate-500 font-medium">View and download attendance reports for any event.</p>
                </div>
                {selectedEvent && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={!records}
                            className="bg-white text-slate-700 font-bold px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Download className="w-5 h-5 text-indigo-600" />
                            To PDF
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || !records}
                            className="btn-premium flex items-center gap-3 disabled:opacity-50"
                        >
                            {isExporting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="w-5 h-5" />
                            )}
                            To Excel
                        </button>
                    </div>
                )}
            </header>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Select Event</label>
                        <div className="relative">
                            <Calendar className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                            <select
                                className="input-premium pl-14 appearance-none w-full"
                                value={selectedEvent}
                                onChange={(e) => setSelectedEvent(e.target.value)}
                            >
                                <option value="">Choose an event...</option>
                                {events.map((event) => (
                                    <option key={event._id} value={event._id}>{event.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {records && (
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Search</label>
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    className="input-premium pl-14 w-full"
                                    placeholder="Search by name, email, or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {records && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                        {[
                            { label: 'Total Registered', val: records.summary.total, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
                            { label: 'Attended', val: records.summary.attended, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Absent', val: records.summary.absent, icon: XCircle, color: 'text-red-600 bg-red-50' },
                            { label: 'Attendance Rate', val: `${records.summary.percentage}%`, icon: Download, color: 'text-amber-600 bg-amber-50' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-6 rounded-2xl border border-slate-100 flex items-center gap-4"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-900">{stat.val}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                </div>
            ) : records ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">#</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Registration ID</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Participant</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Signature</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Check-in Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">
                                            No records match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((reg, index) => (
                                        <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-400">{index + 1}</td>
                                            <td className="px-8 py-5 font-mono text-sm font-bold text-indigo-600">{reg.registrationId}</td>
                                            <td className="px-8 py-5 font-bold text-slate-900">{reg.participant?.username}</td>
                                            <td className="px-8 py-5 text-slate-500">{reg.participant?.email}</td>
                                            <td className="px-8 py-5">
                                                {reg.attendanceStatus ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Present
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-500">
                                                        <XCircle className="w-3.5 h-3.5" /> Absent
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                {reg.signature ? (
                                                    <div className="h-10 w-24 bg-white border border-slate-100 rounded-lg overflow-hidden group relative">
                                                        <img 
                                                            src={reg.signature.startsWith('data:') ? reg.signature : `http://localhost:5000/uploads/${reg.signature}`} 
                                                            className="h-full w-full object-contain" 
                                                            alt="Signature" 
                                                        />
                                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-slate-500 text-sm">
                                                {reg.attendanceTime
                                                    ? new Date(reg.attendanceTime).toLocaleString()
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : selectedEvent ? null : (
                <div className="text-center py-20 text-slate-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Select an event to view attendance records.</p>
                </div>
            )}
        </div>
    );
};

export default AttendanceRecords;

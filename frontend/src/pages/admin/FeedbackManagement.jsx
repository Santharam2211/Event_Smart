import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronDown, ChevronUp, Mail, BarChart2, FileText, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const FeedbackManagement = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [feedbackData, setFeedbackData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [expandedResponses, setExpandedResponses] = useState({});

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/events');
                // Show only events that have a feedback form
                setEvents(res.data.filter(e => e.feedbackForm && e.feedbackForm.length > 0));
            } catch (error) {
                toast.error('Failed to load events');
            }
        };
        fetchEvents();
    }, []);

    const loadFeedback = async (event) => {
        setSelectedEvent(event);
        setIsLoading(true);
        setFeedbackData([]);
        try {
            const res = await axios.get(`http://localhost:5000/api/feedback/event/${event._id}`);
            setFeedbackData(res.data);
        } catch (error) {
            toast.error('Failed to load feedback');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendEmails = async () => {
        if (!selectedEvent) return;
        if (!window.confirm(`Send feedback form emails to all attendees of "${selectedEvent.title}"?`)) return;
        setIsSending(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/feedback/send/${selectedEvent._id}`);
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send emails');
        } finally {
            setIsSending(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedResponses(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Build summary analytics for the selected event
    const buildSummary = () => {
        if (!selectedEvent || feedbackData.length === 0) return null;
        const summary = {};
        selectedEvent.feedbackForm.forEach(field => {
            const answers = feedbackData
                .map(fb => {
                    const val = fb.responses?.[field.label];
                    return val !== undefined ? val : null;
                })
                .filter(v => v !== null);

            if (['dropdown', 'radio'].includes(field.type)) {
                const counts = {};
                answers.forEach(a => { counts[a] = (counts[a] || 0) + 1; });
                summary[field.label] = { type: 'counts', data: counts };
            } else if (field.type === 'number') {
                const nums = answers.map(Number).filter(n => !isNaN(n));
                const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : null;
                summary[field.label] = { type: 'number', avg, count: nums.length };
            } else {
                summary[field.label] = { type: 'text', answers };
            }
        });
        return summary;
    };

    const summary = buildSummary();

    const downloadAnalyticalReport = () => {
        if (!selectedEvent || !feedbackData.length) return;

        try {
            const doc = new jsPDF();
            const eventTitle = selectedEvent.title;

            // Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.setTextColor(30, 41, 59);
            doc.text("Feedback Analytical Report", 105, 20, { align: 'center' });

            doc.setFontSize(14);
            doc.text(eventTitle, 105, 30, { align: 'center' });

            doc.setDrawColor(203, 213, 225);
            doc.line(20, 35, 190, 35);

            // Stats Section
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 42);
            doc.text(`Total Responses: ${feedbackData.length}`, 20, 48);
            doc.text(`Questions: ${selectedEvent.feedbackForm.length}`, 20, 54);

            let currentY = 65;

            // Summary Analytics
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text("Summary Analytics", 20, currentY);
            currentY += 10;

            Object.entries(summary).forEach(([label, info]) => {
                if (currentY > 250) { doc.addPage(); currentY = 20; }

                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text(label, 20, currentY);
                currentY += 6;

                if (info.type === 'counts') {
                    Object.entries(info.data).forEach(([opt, count]) => {
                        const percentage = ((count / feedbackData.length) * 100).toFixed(1);
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(9);
                        doc.text(`${opt}: ${count} (${percentage}%)`, 25, currentY);

                        // Simple bar
                        const barWidth = (count / feedbackData.length) * 100;
                        doc.setFillColor(224, 242, 254);
                        doc.rect(80, currentY - 3, 100, 3, 'F');
                        doc.setFillColor(59, 130, 246);
                        doc.rect(80, currentY - 3, Math.max(barWidth, 1), 3, 'F');

                        currentY += 6;
                        if (currentY > 275) { doc.addPage(); currentY = 20; }
                    });
                } else if (info.type === 'number') {
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10);
                    doc.text(`Average Rating: ${info.avg} / 5.0 (from ${info.count} responses)`, 25, currentY);
                    currentY += 8;
                } else {
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(9);
                    doc.text(`Text Responses: ${info.answers.length} provided.`, 25, currentY);
                    currentY += 6;
                }
                currentY += 5;
            });

            // Individual Responses Table
            doc.addPage();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text("Detailed Responses", 20, 20);

            const tableColumns = ["Participant", "Email", "Date"];
            selectedEvent.feedbackForm.forEach(f => tableColumns.push(f.label));

            const tableRows = feedbackData.map(fb => {
                const row = [
                    fb.user?.username || 'N/A',
                    fb.user?.email || 'N/A',
                    new Date(fb.createdAt).toLocaleDateString()
                ];
                selectedEvent.feedbackForm.forEach(f => {
                    const ans = fb.responses?.[f.label];
                    row.push(Array.isArray(ans) ? ans.join(', ') : (ans || '-'));
                });
                return row;
            });

            autoTable(doc, {
                head: [tableColumns],
                body: tableRows,
                startY: 25,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [30, 41, 59], textColor: 255 }
            });

            doc.save(`Feedback_Report_${(eventTitle || 'Report').replace(/[^a-z0-9]/gi, '_')}.pdf`);
            toast.success("Analytical Report Downloaded!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate PDF report");
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700">
                        <MessageSquare className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Feedback Management</h1>
                        <p className="text-gray-500 font-medium">Review responses and send feedback invitations</p>
                    </div>
                </div>
                {selectedEvent && (
                    <div className="flex gap-3">
                        <button
                            onClick={downloadAnalyticalReport}
                            disabled={isLoading || !feedbackData.length}
                            className="bg-white text-gray-700 font-bold px-6 py-3 rounded-2xl border border-gray-200 flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <Download className="w-5 h-5 text-primary-600" />
                            Download Report
                        </button>
                        <button
                            onClick={handleSendEmails}
                            disabled={isSending}
                            className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-primary-100"
                        >
                            {isSending ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <Mail className="w-5 h-5" />
                            )}
                            {isSending ? 'Sending...' : 'Send to Attendees'}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Event List */}
                <div className="lg:col-span-1 space-y-3">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">Events with Feedback Form</h2>
                    {events.length === 0 ? (
                        <div className="bg-white p-6 rounded-2xl border border-dashed text-center text-gray-400 text-sm">
                            No events with feedback forms yet. Create an event and add a feedback form.
                        </div>
                    ) : (
                        events.map(event => (
                            <motion.button
                                key={event._id}
                                whileHover={{ x: 4 }}
                                onClick={() => loadFeedback(event)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedEvent?._id === event._id
                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-100'
                                        : 'bg-white border-gray-100 hover:border-primary-200 text-gray-900'
                                    }`}
                            >
                                <p className="font-bold text-sm truncate">{event.title}</p>
                                <p className={`text-xs mt-1 ${selectedEvent?._id === event._id ? 'text-primary-100' : 'text-gray-400'}`}>
                                    {event.feedbackForm.length} question{event.feedbackForm.length !== 1 ? 's' : ''}
                                </p>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Feedback Panel */}
                <div className="lg:col-span-3 space-y-6">
                    {!selectedEvent ? (
                        <div className="bg-white rounded-3xl border-2 border-dashed p-16 text-center space-y-4">
                            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto" />
                            <p className="text-gray-400 font-medium">Select an event to see feedback responses</p>
                        </div>
                    ) : isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : (
                        <>
                            {/* Stats Banner */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                                    <p className="text-3xl font-black text-primary-700">{feedbackData.length}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Responses</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                                    <p className="text-3xl font-black text-emerald-600">{selectedEvent.feedbackForm.length}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Questions</p>
                                </div>
                                <div className="bg-primary-700 p-6 rounded-2xl text-center col-span-2 sm:col-span-1">
                                    <p className="text-3xl font-black text-white">{selectedEvent.status}</p>
                                    <p className="text-xs text-primary-200 font-bold uppercase tracking-widest mt-1">Event Status</p>
                                </div>
                            </div>

                            {/* Summary Analytics */}
                            {summary && feedbackData.length > 0 && (
                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <BarChart2 className="w-5 h-5 text-primary-600" />
                                        <h3 className="text-xl font-black">Summary Analytics</h3>
                                    </div>
                                    {Object.entries(summary).map(([label, info]) => (
                                        <div key={label} className="space-y-2">
                                            <p className="text-sm font-bold text-gray-700">{label}</p>
                                            {info.type === 'counts' && (
                                                <div className="space-y-2">
                                                    {Object.entries(info.data).map(([opt, count]) => (
                                                        <div key={opt} className="flex items-center gap-3">
                                                            <span className="text-xs text-gray-500 w-28 truncate">{opt}</span>
                                                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(count / feedbackData.length) * 100}%` }}
                                                                    className="h-full bg-primary-500 rounded-full"
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-700 w-8 text-right">{count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {info.type === 'number' && (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl font-black text-primary-700">{info.avg}</span>
                                                    <span className="text-xs text-gray-400 font-bold">avg. from {info.count} responses</span>
                                                </div>
                                            )}
                                            {info.type === 'text' && (
                                                <div className="flex flex-wrap gap-2">
                                                    {info.answers.slice(0, 3).map((a, i) => (
                                                        <span key={i} className="px-3 py-1 bg-gray-100 rounded-lg text-xs text-gray-600 font-medium truncate max-w-xs">
                                                            "{a}"
                                                        </span>
                                                    ))}
                                                    {info.answers.length > 3 && (
                                                        <span className="text-xs text-gray-400 self-center">+{info.answers.length - 3} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Individual Responses */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-900">
                                    <FileText className="w-5 h-5 text-primary-600" />
                                    <h3 className="text-xl font-black">Individual Responses</h3>
                                </div>
                                {feedbackData.length === 0 ? (
                                    <div className="bg-white p-12 rounded-2xl border-2 border-dashed text-center">
                                        <p className="text-gray-400 font-medium">No responses yet. Send emails to attendees to collect feedback.</p>
                                    </div>
                                ) : (
                                    feedbackData.map((fb) => (
                                        <motion.div
                                            key={fb._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                                        >
                                            <button
                                                className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                                onClick={() => toggleExpand(fb._id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center font-black text-primary-700">
                                                        {fb.user?.username?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{fb.user?.username}</p>
                                                        <p className="text-xs text-gray-400">{fb.user?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-400">{new Date(fb.createdAt).toLocaleDateString()}</span>
                                                    {expandedResponses[fb._id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                </div>
                                            </button>
                                            <AnimatePresence>
                                                {expandedResponses[fb._id] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
                                                            {selectedEvent.feedbackForm.map((field) => {
                                                                const answer = fb.responses?.[field.label];
                                                                return (
                                                                    <div key={field.label} className="flex gap-4">
                                                                        <span className="text-xs font-bold text-gray-500 w-40 shrink-0 pt-1">{field.label}</span>
                                                                        <span className="text-sm text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg flex-1">
                                                                            {Array.isArray(answer) ? answer.join(', ') : (answer ?? <span className="text-gray-300 italic">—</span>)}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackManagement;

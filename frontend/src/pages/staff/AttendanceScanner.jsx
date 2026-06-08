import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
    QrCode, CheckCircle2, XCircle, 
    Search, Loader2, Calendar, ShieldCheck, 
    Zap, ArrowLeft, Trash2, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const AttendanceScanner = () => {
    const { user } = useAuth();
    const [scanResult, setScanResult] = useState(null);
    const [manualId, setManualId] = useState('');
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef(null);
    const lastScanRef = useRef('');
    const cooldownRef = useRef(false);
    const selectedEventRef = useRef('');
    const isProcessingRef = useRef(false);

    useEffect(() => {
        selectedEventRef.current = selectedEvent;
    }, [selectedEvent]);

    useEffect(() => {
        isProcessingRef.current = isProcessing;
    }, [isProcessing]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/events');
                setEvents(res.data.filter(e => e.status !== 'Completed' && e.status !== 'Cancelled'));
            } catch {
                toast.error('Failed to load events');
            }
        };
        fetchEvents();
    }, []);

    const stopScanner = useCallback(() => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => {});
            scannerRef.current = null;
        }
    }, []);

    const startScanner = useCallback(() => {
        if (scannerRef.current) return;

        const scanner = new Html5QrcodeScanner('reader', {
            qrbox: { width: 280, height: 280 },
            fps: 10,
            rememberLastUsedCamera: true,
        }, false);

        scanner.render(onScanSuccess, () => {});
        scannerRef.current = scanner;
    }, [selectedEvent]);

    useEffect(() => {
        stopScanner();
        const timer = setTimeout(startScanner, 300);
        return () => {
            clearTimeout(timer);
            stopScanner();
        };
    }, [selectedEvent, startScanner, stopScanner]);

    useEffect(() => () => stopScanner(), [stopScanner]);

    const handleMarkAttendance = async (regId, eventIdFromQr = null) => {
        const eventId = eventIdFromQr || selectedEvent;

        if (!eventId) {
            toast.error('Please select an event first');
            return;
        }

        if (!regId || !regId.trim()) {
            toast.error('Invalid registration ID');
            return;
        }

        setIsProcessing(true);

        try {
            const res = await axios.post('http://localhost:5000/api/attendance/mark', {
                registrationId: regId.trim(),
                eventId
            });
            setScanResult({ success: true, ...res.data });
            toast.success('Attendance recorded!');
            setManualId('');
        } catch (error) {
            const message = error.response?.data?.message || 'Verification failed';
            setScanResult({ success: false, message });
            toast.error(message);
        } finally {
            setIsProcessing(false);
            setTimeout(() => {
                setScanResult(null);
            }, 4000);
        }
    };

    const onScanSuccess = (decodedText) => {
        if (isProcessingRef.current) return;

        try {
            let regId = decodedText;
            let eventIdFromQr = null;

            try {
                const data = JSON.parse(decodedText);
                regId = data.registrationId;
                eventIdFromQr = data.eventId;

                if (eventIdFromQr && !selectedEventRef.current) {
                    setSelectedEvent(eventIdFromQr);
                }
            } catch {
                // Plain registration ID string
            }

            const effectiveEventId = eventIdFromQr || selectedEventRef.current;
            if (!effectiveEventId) {
                toast.error('Select an event or scan a valid event QR code');
                return;
            }

            handleMarkAttendance(regId, eventIdFromQr);
        } catch {
            toast.error('Invalid scan data');
        }
    };

    return (
        <div className="space-y-12 pb-40">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-4">
                    <Link to={user?.role === 'Admin' ? '/admin/dashboard' : '/dashboard'} className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                        QR <span className="text-reveal">Scanner.</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-md">
                        Scan participant QR codes to mark attendance. Event is auto-detected from the QR code.
                    </p>
                </div>
                <div className="px-6 py-3 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Scanner Ready</span>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-12">
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Event (optional if QR has event)</label>
                            <div className="relative">
                                <Calendar className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <select 
                                    className="input-premium pl-14 appearance-none w-full"
                                    value={selectedEvent}
                                    onChange={(e) => setSelectedEvent(e.target.value)}
                                >
                                    <option value="">Auto-detect from QR...</option>
                                    {events.map(event => (
                                        <option key={event._id} value={event._id}>{event.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50 space-y-2">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Manual Entry</label>
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input 
                                        type="text" 
                                        className="input-premium pl-14 w-full"
                                        placeholder="Registration ID..."
                                        value={manualId}
                                        onChange={(e) => setManualId(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleMarkAttendance(manualId)}
                                    />
                                </div>
                                <button 
                                    onClick={() => handleMarkAttendance(manualId)}
                                    disabled={isProcessing || !manualId}
                                    className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    <Zap className="w-6 h-6 fill-current" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {scanResult && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`p-10 rounded-[2.5rem] border-2 shadow-2xl ${
                                    scanResult.success 
                                    ? 'bg-emerald-600 border-emerald-400 text-white' 
                                    : 'bg-red-600 border-red-400 text-white'
                                }`}
                            >
                                <div className="flex flex-col items-center text-center gap-6">
                                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                                        {scanResult.success ? (
                                            <ShieldCheck className="w-12 h-12" />
                                        ) : (
                                            <XCircle className="w-12 h-12" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight mb-2">
                                            {scanResult.success ? scanResult.participant : 'Access Denied'}
                                        </h3>
                                        <p className="text-white/80 font-medium">
                                            {scanResult.success ? 'Attendance recorded successfully' : scanResult.message}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-slate-900 rounded-[3rem] overflow-hidden min-h-[400px] relative shadow-2xl border-[8px] border-white">
                        <div id="reader" className="w-full"></div>
                        
                        {isProcessing && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-20">
                                <Loader2 className="w-16 h-16 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AttendanceScanner;

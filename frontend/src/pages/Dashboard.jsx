import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, QrCode, Download, MapPin, CheckCircle, Clock, AlertCircle, Cake, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../utils/imageUrl';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReg, setSelectedReg] = useState(null);
    const [isBirthday, setIsBirthday] = useState(false);

    if (!user) return null;

    // Check if today is the user's birthday
    useEffect(() => {
        if (user?.dateOfBirth) {
            const today = new Date();
            const dob = new Date(user.dateOfBirth);
            const isTodayBirthday =
                today.getDate() === dob.getDate() &&
                today.getMonth() === dob.getMonth();
            setIsBirthday(isTodayBirthday);
        }
    }, [user]);

    useEffect(() => {
        const fetchMyRegs = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/registrations/my');
                setRegistrations(res.data);
            } catch (error) {
                console.error('Failed to fetch registrations');
            } finally {
                setIsLoading(false);
            }
        };
        fetchMyRegs();
    }, []);

    const handleDownloadCertificate = async (regId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/certificates/download/${regId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificate_${regId}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Certificate downloaded!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Certificate download failed');
        }
    };

    const downloadQRWithTemplate = (reg) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 1200;

        // Background Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 1200);
        gradient.addColorStop(0, '#4f46e5'); // indigo-600
        gradient.addColorStop(1, '#7c3aed'); // violet-600
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 1200);

        // Card Overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(50, 50, 700, 1100, 60);
        ctx.fill();

        // Welcome Message
        ctx.fillStyle = '#1e293b'; // slate-800
        ctx.font = '900 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WELCOME TO', 400, 150);
        
        // Event Title (Wrapped)
        ctx.fillStyle = '#4f46e5';
        ctx.font = 'bold 56px Inter, sans-serif';
        const title = reg.event.title.toUpperCase();
        if (title.length > 20) {
            ctx.fillText(title.substring(0, 20), 400, 230);
            ctx.fillText(title.substring(20), 400, 300);
        } else {
            ctx.fillText(title, 400, 250);
        }

        // Details Box
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(100, 350, 600, 200, 30);
        ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText('VENUE', 250, 420);
        ctx.fillText('DATE & TIME', 550, 420);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillText(reg.event.venue, 250, 470);
        ctx.fillText(new Date(reg.event.eventDate).toLocaleDateString(), 550, 470);

        // QR Code
        const qrImage = new Image();
        qrImage.onload = () => {
            // Draw a frame for the QR
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 4;
            ctx.strokeRect(198, 623, 404, 404);
            
            ctx.drawImage(qrImage, 200, 625, 400, 400);

            // Registration ID and Bottom Message
            ctx.fillStyle = '#94a3b8';
            ctx.font = '800 24px Inter, sans-serif';
            ctx.fillText(`ID: ${reg.registrationId}`, 400, 1080);
            
            ctx.fillStyle = '#1e293b';
            ctx.font = 'italic 28px Inter, sans-serif';
            ctx.fillText('Show this at the entrance • Get ready to innovate!', 400, 1130);

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `EventPass-${reg.event.title}.png`;
            link.click();
        };
        qrImage.src = reg.qrCode;
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Birthday Banner */}
            <AnimatePresence>
                {isBirthday && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                            <Cake className="w-32 h-32" />
                        </div>
                        <div className="absolute bottom-0 left-0 p-8 opacity-20">
                            <Sparkles className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <Cake className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black mb-2">Happy Birthday, {user.username}! 🎉</h2>
                                <p className="text-white/90 font-medium">Wishing you a fantastic day filled with joy and celebration!</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Hello, {user?.username}!</h1>
                        <p className="text-gray-500 mt-1">You have {registrations.filter(r => !r.attendanceStatus).length} upcoming events</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-2 bg-gray-50 rounded-xl text-center border">
                        <p className="text-xs font-bold text-gray-400 uppercase">Role</p>
                        <p className="font-bold text-primary-700">{user?.role}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Registrations List */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">My Registrations</h2>
                    
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>)}
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border-2 border-dashed text-center space-y-4">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
                            <p className="text-gray-500 font-medium">No registrations yet. Go find some events!</p>
                            <a href="/events" className="inline-block text-primary-600 font-bold hover:underline">Browse Events</a>
                        </div>
                    ) : (
                        registrations.map((reg) => (
                            <motion.div 
                                key={reg._id}
                                whileHover={{ scale: 1.01 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-6"
                            >
                                <div className="flex gap-6">
                                    <div className="w-24 h-24 rounded-xl overflow-hidden hidden sm:block">
                                        <img src={getImageUrl(reg.event?.bannerImage, 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80')} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-gray-900">{reg.event?.title || 'Unknown Event'}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Calendar className="w-4 h-4 text-primary-500" />
                                                {reg.event?.eventDate ? new Date(reg.event.eventDate).toLocaleDateString() : 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <MapPin className="w-4 h-4 text-primary-500" />
                                                {reg.event?.venue || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            {reg.attendanceStatus ? (
                                                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Attended
                                                </span>
                                            ) : (
                                                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Upcoming
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={() => setSelectedReg(reg)}
                                        className="flex-1 sm:flex-none p-3 bg-gray-50 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 border hover:bg-gray-100 transition-all font-bold"
                                    >
                                        <QrCode className="w-5 h-5" />
                                        QR Code
                                    </button>
                                    {reg.attendanceStatus && (
                                        <button
                                            onClick={() => handleDownloadCertificate(reg._id)}
                                            className="flex-1 sm:flex-none p-3 bg-primary-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-700 transition-all"
                                        >
                                            <Download className="w-5 h-5" />
                                            Certificate
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* QR Modal Overlay */}
                {selectedReg && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReg(null)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-10 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setSelectedReg(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600">×</button>
                            <h3 className="text-2xl font-bold text-gray-900 leading-tight">{selectedReg.event?.title || 'Unknown Event'}</h3>
                            <div className="bg-white p-4 rounded-2xl border-4 border-gray-50 inline-block shadow-sm">
                                <img src={selectedReg.qrCode} alt="Registration QR" className="w-64 h-64" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Registration ID</p>
                                <p className="text-xl font-mono font-bold text-primary-700">{selectedReg.registrationId}</p>
                            </div>
                            <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm flex gap-3 text-left">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>Show this QR code at the event venue to mark your attendance.</p>
                            </div>
                            <button
                                onClick={() => downloadQRWithTemplate(selectedReg)}
                                className="w-full p-4 bg-primary-600 text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                            >
                                <Download className="w-5 h-5" />
                                Download Event Pass
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

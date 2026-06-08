import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Calendar, MapPin, Clock, Users, ArrowRight, Share2, Shield, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../utils/imageUrl';

const EventDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({});
    const [fileFields, setFileFields] = useState({});
    const [showRegForm, setShowRegForm] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/events/${id}`);
                setEvent(res.data);
            } catch (error) {
                toast.error('Event not found');
                navigate('/events');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const handleRegistration = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to register');
            navigate('/login');
            return;
        }

        setIsRegistering(true);
        try {
            const hasFiles = Object.keys(fileFields).length > 0;
            if (hasFiles) {
                const payload = new FormData();
                payload.append('eventId', id);
                payload.append('formData', JSON.stringify(formData));
                Object.entries(fileFields).forEach(([label, file]) => {
                    payload.append(label, file);
                });
                await axios.post('http://localhost:5000/api/registrations', payload);
            } else {
                await axios.post('http://localhost:5000/api/registrations', {
                    eventId: id,
                    formData
                });
            }
            toast.success('Successfully registered!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsRegistering(false);
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    if (!event) return null;

    const registrationDeadlinePassed = new Date() > new Date(event.registrationDeadline);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
                    >
                        <div className="h-80 relative">
                            <img 
                                src={getImageUrl(event.bannerImage, 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80')} 
                                className="w-full h-full object-cover"
                                alt={event.title}
                            />
                            <div className="absolute top-6 left-6 flex gap-2">
                                <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold text-primary-700 shadow-lg">
                                    {event.category}
                                </span>
                                <span className={`bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                                    event.status === 'Open' ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                    {event.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-8">
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-6">{event.title}</h1>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-6 bg-gray-50 rounded-2xl">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
                                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                                        <Calendar className="w-4 h-4 text-primary-600" />
                                        {new Date(event.eventDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Time</p>
                                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                                        <Clock className="w-4 h-4 text-primary-600" />
                                        {event.startTime} - {event.endTime}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Venue</p>
                                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                                        <MapPin className="w-4 h-4 text-primary-600" />
                                        {event.venue}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Type</p>
                                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                                        <Users className="w-4 h-4 text-primary-600" />
                                        {event.participationType}
                                    </div>
                                </div>
                            </div>

                            <div className="prose max-w-none text-gray-600 leading-relaxed mb-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">About the Event</h3>
                                {event.description}
                            </div>
                        </div>
                    </motion.div>

                    {/* Registration Section */}
                    {showRegForm && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-8 rounded-3xl shadow-xl border border-primary-100"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Registration</h2>
                            <form onSubmit={handleRegistration} className="space-y-6">
                                {event.registrationForm.map((field, i) => (
                                    <div key={i}>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                required={field.required}
                                                className="input-field h-24"
                                                placeholder={field.placeholder}
                                                onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                            />
                                        ) : field.type === 'dropdown' ? (
                                            <select
                                                required={field.required}
                                                className="input-field"
                                                onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                            >
                                                <option value="">Select option</option>
                                                {field.options && field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : field.type === 'radio' ? (
                                            <div className="space-y-2">
                                                {field.options && field.options.map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={field.label}
                                                            value={opt}
                                                            required={field.required}
                                                            onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                                            className="w-4 h-4 text-primary-600"
                                                        />
                                                        <span>{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : field.type === 'checkbox' ? (
                                            <div className="space-y-2">
                                                {field.options && field.options.map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            name={field.label}
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const currentValues = formData[field.label] || [];
                                                                if (e.target.checked) {
                                                                    setFormData({...formData, [field.label]: [...currentValues, opt]});
                                                                } else {
                                                                    setFormData({...formData, [field.label]: currentValues.filter(v => v !== opt)});
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-primary-600 rounded"
                                                        />
                                                        <span>{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : field.type === 'file' ? (
                                            <input
                                                type="file"
                                                required={field.required}
                                                className="input-field"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setFileFields({ ...fileFields, [field.label]: file });
                                                        setFormData({ ...formData, [field.label]: file.name });
                                                    }
                                                }}
                                            />
                                        ) : field.type === 'number' ? (
                                            <input
                                                type="number"
                                                required={field.required}
                                                className="input-field"
                                                placeholder={field.placeholder}
                                                onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                            />
                                        ) : field.type === 'date' ? (
                                            <input
                                                type="date"
                                                required={field.required}
                                                className="input-field"
                                                onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                required={field.required}
                                                className="input-field"
                                                placeholder={field.placeholder}
                                                onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                            />
                                        )}
                                    </div>
                                ))}
                                <div className="flex gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowRegForm(false)}
                                        className="flex-1 py-3 border rounded-xl hover:bg-gray-50 font-bold"
                                    >
                                        Go Back
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isRegistering}
                                        className="flex-[2] btn-primary py-3 flex items-center justify-center gap-2 font-bold text-lg"
                                    >
                                        {isRegistering ? 'Processing...' : 'Confirm Registration'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-sm font-bold text-gray-400 uppercase">Registration</p>
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold">
                                <Info className="w-3 h-3" /> Still Open
                            </div>
                        </div>

                        {!showRegForm && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Fee</span>
                                        <span className="text-emerald-600 font-bold">FREE</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Deadline</span>
                                        <span className="text-red-500 font-bold">{new Date(event.registrationDeadline).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {registrationDeadlinePassed ? (
                                    <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-center text-sm font-bold">
                                        Registration Closed: Deadline Exceeded
                                    </div>
                                ) : event.status !== 'Open' ? (
                                    <div className="p-4 bg-gray-100 text-gray-600 rounded-2xl text-center text-sm font-bold">
                                        Registration is not currently live
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setShowRegForm(true)}
                                        className="w-full btn-primary py-4 flex items-center justify-center gap-2 font-bold text-lg rounded-2xl"
                                    >
                                        Register Now <ArrowRight className="w-5 h-5" />
                                    </button>
                                )}

                                <div className="pt-6 border-t space-y-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Trust & Security</p>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Shield className="w-5 h-5 text-primary-500" />
                                            <span>Secure QR Verification</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Shield className="w-5 h-5 text-primary-500" />
                                            <span>Institutional Certification</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;

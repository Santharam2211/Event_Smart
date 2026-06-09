import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Users, Calendar, Award, TrendingUp,
    Plus, Download, CheckCircle, Clock,
    MoreVertical, Search, Filter, ArrowUpRight,
    Activity, Globe, Shield, ChevronRight, Trophy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 });
    const [recentEvents, setRecentEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [eventsRes, statsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/events'),
                    axios.get('http://localhost:5000/api/events/stats')
                ]);
                setRecentEvents(eventsRes.data.slice(0, 5));
                setStats(statsRes.data);
            } catch (error) {
                console.error('Dashboard data error');
                setStats({ totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 });
                setRecentEvents([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/api/events/${eventId}`);
            toast.success('Event deleted successfully');
            setRecentEvents(recentEvents.filter(e => e._id !== eventId));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete event');
        }
    };

    const cards = [
        { title: 'Global Impact', val: stats.totalEvents, icon: <Globe className="w-6 h-6" />, color: 'bg-indigo-600', trend: 'Total', label: 'Total Events' },
        { title: 'Network Growth', val: stats.totalRegistrations, icon: <Users className="w-6 h-6" />, color: 'bg-emerald-600', trend: 'Total', label: 'Active Users' },
        { title: 'System Pulse', val: stats.totalAttendees, icon: <Activity className="w-6 h-6" />, color: 'bg-indigo-600', trend: 'Total', label: 'Check-in Rate' },
    ];

    return (
        <div className="space-y-16 pb-40">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest">
                        <Shield className="w-4 h-4 fill-indigo-100" />
                        Admin Secured
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">Control <span className="text-reveal">Center.</span></h1>
                    <p className="text-lg text-slate-500 font-medium max-w-md">Real-time intelligence for your global event infrastructure.</p>
                </div>
                <div className="flex gap-4">
                    <Link to="/admin/events/create" className="btn-premium flex items-center gap-3">
                        <Plus className="w-6 h-6" />
                        Create New Event
                    </Link>
                    <Link to="/admin/winners" className="px-8 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black hover:bg-slate-900 hover:text-white transition-all duration-300 flex items-center gap-3">
                        <Trophy className="w-6 h-6" />
                        Manage Winners
                    </Link>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {cards.map((card, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="group bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] transition-all duration-500"
                    >
                        <div className="flex justify-between items-start mb-10">
                            <div className={`w-14 h-14 rounded-2xl ${card.color} text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform`}>
                                {card.icon}
                            </div>
                            <span className="text-slate-400 text-sm font-black tracking-widest uppercase">{card.trend}</span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{card.val}</h3>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Event Management Table */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex justify-between items-center px-4">
                        <h2 className="text-2xl font-black text-slate-900">Event Infrastructure</h2>
                        <Link to="/admin" className="text-indigo-600 font-black text-sm flex items-center gap-2 hover:gap-3 transition-all">
                            View All Assets <ArrowUpRight className="w-5 h-5" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Asset Name</th>
                                        <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Growth</th>
                                        <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentEvents.map((event) => (
                                        <tr key={event._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        <Calendar className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{event.title}</p>
                                                        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">{new Date(event.eventDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-3 bg-slate-100 rounded-full min-w-[120px] overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: '74%' }}
                                                            transition={{ duration: 1.5 }}
                                                            className="h-full bg-indigo-500" 
                                                        />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900">{event.registrations || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                                                    event.status === 'Open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${event.status === 'Open' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <Link
                                                        to={`/admin/events/edit/${event._id}`}
                                                        className="p-3 hover:bg-indigo-50 rounded-2xl transition-all border-2 border-transparent hover:border-indigo-100 text-indigo-600"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event._id)}
                                                        className="p-3 hover:bg-red-50 rounded-2xl transition-all border-2 border-transparent hover:border-red-100 text-red-600"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Intelligent Insights */}
                <div className="space-y-12">
                    <h2 className="text-2xl font-black text-slate-900 px-4">Instant Actions</h2>
                    <div className="grid gap-6">
                        {[
                            { title: 'Attendance Records', icon: <Download />, color: 'bg-emerald-100 text-emerald-600', link: '/admin/attendance' },
                            { title: 'Association Members', icon: <Users />, color: 'bg-indigo-100 text-indigo-600', link: '/admin/association-members' },
                            { title: 'Scanner Mode', icon: <Search />, color: 'bg-amber-100 text-amber-600', link: '/scanner' },
                            { title: 'Feedback Management', icon: <Activity />, color: 'bg-pink-100 text-pink-600', link: '/admin/feedback' },
                            { title: 'Certificate Studio', icon: <Award />, color: 'bg-amber-100 text-amber-600', link: '/admin/certificates' },
                        ].map((action, i) => (
                            <Link key={i} to={action.link} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center shadow-sm`}>
                                        {action.icon}
                                    </div>
                                    <span className="text-lg font-black text-slate-900">{action.title}</span>
                                </div>
                                <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                            </Link>
                        ))}
                    </div>

                    <div className="bg-indigo-600 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <Shield className="w-40 h-40" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <h3 className="text-2xl font-black leading-tight">System Health <br/> is 100% Core.</h3>
                            <p className="text-indigo-100 font-medium text-sm leading-relaxed">
                                All database nodes and email delivery segments are functioning at optimal latency.
                            </p>
                            <button className="px-8 py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                                Diagnostics
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

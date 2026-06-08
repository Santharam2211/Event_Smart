import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Users, Award, ShieldCheck, 
    ArrowRight, Sparkles, Zap, Globe, 
    ChevronRight, Play, Star, Plus
} from 'lucide-react';

const Home = () => {
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [eventsRes, statsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/events?status=Open'),
                    axios.get('http://localhost:5000/api/events/public-stats')
                ]);
                setEvents(eventsRes.data.slice(0, 3));
                setStats(statsRes.data);
            } catch (error) {
                console.error('Failed to fetch home data');
                setStats({ totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 });
                setEvents([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHomeData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="space-y-40 pb-40 overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center pt-20">
                {/* Background Decorations */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 blur-[100px] rounded-full"></div>

                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-10 text-center lg:text-left z-10"
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white border border-slate-100 shadow-xl shadow-slate-200/50 text-indigo-600 font-black text-sm uppercase tracking-widest">
                            <Sparkles className="w-5 h-5 fill-indigo-100" />
                            Next-Gen Event OS
                        </motion.div>
                        
                        <motion.h1 variants={itemVariants} className="text-6xl lg:text-8xl font-black text-slate-900 leading-[0.95] tracking-tighter">
                            Organize <br/>
                            <span className="text-reveal">Extraordinary</span> <br/>
                            Events.
                        </motion.h1>
                        
                        <motion.p variants={itemVariants} className="text-xl text-slate-500 max-w-xl leading-relaxed font-medium">
                            The all-in-one platform for high-impact gatherings. Dynamic registrations, instant QR check-ins, and automated certification.
                        </motion.p>
                        
                        <motion.div variants={itemVariants} className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
                            <Link to="/events" className="btn-premium flex items-center gap-3 group">
                                Start Exploring
                                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                            </Link>
                            <Link to="/register" className="px-10 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black hover:bg-slate-900 hover:text-white transition-all duration-300 active:scale-95">
                                Join Now
                            </Link>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex items-center justify-center lg:justify-start gap-4 pt-8">
                            <div className="text-sm font-bold text-slate-400">
                                <span className="text-slate-900 font-black text-lg block leading-tight">{stats.totalRegistrations}+ Participants</span>
                                Trusting EventSmart
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 100, rotate: 10 }}
                        animate={{ opacity: 1, x: 0, rotate: -5 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-[16px] border-white glass bg-gradient-to-br from-indigo-500 to-purple-600">
                            <div className="w-full aspect-[4/5] flex items-center justify-center p-12">
                                <div className="text-center text-white space-y-6">
                                    <Calendar className="w-24 h-24 mx-auto opacity-90" />
                                    <div className="space-y-2">
                                        <p className="text-6xl font-black">{stats.totalEvents}</p>
                                        <p className="text-xl font-bold opacity-90">Active Events</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Feature Bento Grid */}
            <section className="container mx-auto px-6 space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight">Built for <span className="text-reveal">Speed and Scale</span></h2>
                    <p className="text-slate-500 text-lg font-medium">Enterprise-grade tools for community-driven events.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Large Feature */}
                    <div className="md:col-span-2 group relative overflow-hidden bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 transition-transform group-hover:scale-[1.8]">
                            <Zap className="w-64 h-64 text-indigo-600" />
                        </div>
                        <div className="relative z-10 space-y-6 max-w-md">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Zap className="w-8 h-8 font-black" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">Dynamic Registration Flow</h3>
                            <p className="text-slate-500 text-lg leading-relaxed font-medium">
                                Create custom forms in seconds. Add input fields, file uploads, and conditional logic without writing a single line of code.
                            </p>
                            <div className="pt-4">
                                <button className="flex items-center gap-2 font-black text-indigo-600 group-hover:gap-4 transition-all">
                                    Learn More <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Small Feature */}
                    <div className="group bg-indigo-600 rounded-[3rem] p-12 text-white shadow-xl shadow-indigo-200 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black">QR Secure Entry</h3>
                            <p className="text-indigo-100 font-medium">Dynamic codes that cycle every session to prevent tampering.</p>
                        </div>
                    </div>

                    {/* More Bento Items... */}
                    <div className="group bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur">
                            <Award className="w-8 h-8" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black">Auto Certs</h3>
                            <p className="text-slate-400 font-medium">Automated high-quality PDF delivery right after check-out.</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 group bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex items-center gap-12 overflow-hidden">
                        <div className="space-y-6 max-w-sm shrink-0">
                            <h3 className="text-3xl font-black text-slate-900">Real-time Analytics</h3>
                            <p className="text-slate-500 text-lg leading-relaxed font-medium">
                                Watch your event grow live. Monitor check-ins, tickets, and user engagement metrics in real-time.
                            </p>
                        </div>
                        <div className="flex-1 space-y-4">
                            {[1,2,3].map(i => (
                                <div key={i} className="h-4 bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${80 - i*15}%` }}
                                        transition={{ duration: 1.5, delay: i*0.2 }}
                                        className="h-full bg-indigo-500" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Events */}
            <section className="container mx-auto px-6 space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight">Featured <span className="text-reveal">Events</span></h2>
                    <p className="text-slate-500 text-lg font-medium">Discover and join exciting upcoming events.</p>
                </div>

                {isLoading ? (
                    <div className="text-center py-20">
                        <p className="text-slate-500 font-medium">Loading events...</p>
                    </div>
                ) : events.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <Link key={event._id} to={`/events/${event._id}`} className="group">
                                <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                                    <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <Calendar className="w-16 h-16 text-white/50" />
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest">
                                                {event.category}
                                            </span>
                                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest">
                                                {event.status}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 line-clamp-2">{event.title}</h3>
                                        <p className="text-slate-500 text-sm font-medium line-clamp-2">{event.description}</p>
                                        <div className="flex items-center justify-between pt-4">
                                            <span className="text-sm font-bold text-slate-400">
                                                {new Date(event.eventDate).toLocaleDateString()}
                                            </span>
                                            <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-500 font-medium">No events available at the moment.</p>
                    </div>
                )}
            </section>

            {/* Final CTA */}
            <section className="container mx-auto px-6">
                <div className="bg-indigo-600 rounded-[4rem] p-24 text-center text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(79,70,229,0.4)]">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:40px_40px]"></div>
                    <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                        <h2 className="text-6xl font-black leading-tight tracking-tighter">Ready to Build Something <span className="text-indigo-200">Massive?</span></h2>
                        <p className="text-xl text-indigo-100 font-medium">Join {stats.totalEvents}+ events and {stats.totalRegistrations}+ participants already using the platform.</p>
                        <div className="flex justify-center flex-wrap gap-6">
                            <Link to="/register" className="px-12 py-5 bg-white text-indigo-600 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all active:scale-95 shadow-2xl">
                                Create Your First Event
                            </Link>
                            <Link to="/login" className="px-12 py-5 bg-transparent border-2 border-white/30 text-white rounded-2xl font-black text-lg hover:bg-white/10 transition-all">
                                Platform Overview
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;

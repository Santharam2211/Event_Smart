import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Search, Filter, Calendar, MapPin, 
    Users, ArrowRight, Sparkles, Zap, 
    ChevronRight, LayoutGrid 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../utils/imageUrl';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/events');
                setEvents(res.data);
            } catch (error) {
                console.error('Failed to fetch events');
                // Mock data fallback
                setEvents([
                    { _id: '1', title: 'Silicon Valley AI Summit', category: 'Hackathon', venue: 'Convention Center', eventDate: '2024-12-10', participationType: 'Team', bannerImage: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&w=800&q=80' },
                    { _id: '2', title: 'Future Tech 2025', category: 'Conference', venue: 'Nexus Hub', eventDate: '2025-01-15', participationType: 'Individual', bannerImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80' }
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || event.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-16 pb-40">
            {/* Elegant Header */}
            <header className="relative py-12 px-8 bg-slate-900 rounded-[3rem] text-white overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                <div className="relative z-10 space-y-6 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-300">
                        <Sparkles className="w-4 h-4" />
                        Global Intelligence Network
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-tight">
                        Discover <span className="text-reveal">Elite</span> Events.
                    </h1>
                    <p className="text-xl text-slate-400 font-medium leading-relaxed">
                        Curated experiences for high-impact developers, designers, and innovators.
                    </p>
                </div>
            </header>

            {/* Filter Hub */}
            <div className="flex flex-col lg:flex-row gap-6 p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                        type="text" 
                        placeholder="Search event infrastructure..." 
                        className="input-premium pl-16 bg-slate-50/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                    {['All', 'Workshop', 'Hackathon', 'Conference', 'Competition'].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-8 py-4 rounded-2xl text-sm font-black transition-all duration-300 ${
                                categoryFilter === cat 
                                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid State */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white p-6 rounded-[3rem] border border-slate-50 space-y-6">
                                <div className="h-64 bg-slate-100 rounded-[2rem] animate-pulse"></div>
                                <div className="h-8 bg-slate-50 rounded-full w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-slate-50 rounded-full w-1/2 animate-pulse"></div>
                            </div>
                        ))
                    ) : filteredEvents.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-40 text-center space-y-6"
                        >
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                <LayoutGrid className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">No events found.</h3>
                            <p className="text-slate-400 font-medium">Try adjusting your filters or search keywords.</p>
                            <button 
                                onClick={() => { setSearchTerm(''); setCategoryFilter('All'); }}
                                className="text-indigo-600 font-black hover:underline"
                            >
                                Reset Infrastructure Filters
                            </button>
                        </motion.div>
                    ) : (
                        filteredEvents.map((event, i) => (
                            <motion.div 
                                key={event._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group bg-white rounded-[3rem] p-6 border border-slate-100 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col"
                            >
                                <div className="relative h-72 rounded-[2rem] overflow-hidden mb-8">
                                    <img 
                                        src={getImageUrl(event.bannerImage, 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&w=800&q=80')} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt={event.title}
                                    />
                                    <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl">
                                        {event.category}
                                    </div>
                                    <div className="absolute bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        <Zap className="w-6 h-6 fill-current" />
                                    </div>
                                </div>
                                <div className="space-y-6 flex-1 px-4">
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                        {event.title}
                                    </h3>
                                    
                                    <div className="space-y-3 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-indigo-400" />
                                            <span>{new Date(event.eventDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-5 h-5 text-indigo-400" />
                                            <span className="truncate">{event.venue}</span>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Live Entries</span>
                                        </div>
                                        <Link 
                                            to={`/events/${event._id}`}
                                            className="inline-flex items-center gap-2 font-black text-slate-900 hover:gap-4 transition-all"
                                        >
                                            Details <ChevronRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Events;

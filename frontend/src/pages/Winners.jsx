import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Calendar, MapPin, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const Winners = () => {
    const [winnersByEvent, setWinnersByEvent] = useState({});
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchWinners = async () => {
            try {
                const [winnersRes, eventsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/winners'),
                    axios.get('http://localhost:5000/api/events?status=Completed')
                ]);

                // Group winners by event
                const grouped = winnersRes.data.reduce((acc, winner) => {
                    const eventId = winner.event?._id || winner.event;
                    if (!acc[eventId]) acc[eventId] = [];
                    acc[eventId].push(winner);
                    return acc;
                }, {});

                setWinnersByEvent(grouped);
                setEvents(eventsRes.data);
            } catch (error) {
                console.error('Failed to fetch winners data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchWinners();
    }, []);

    const filteredEvents = events.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        winnersByEvent[event._id]
    );

    return (
        <div className="max-w-6xl mx-auto space-y-16 pb-40">
            {/* Header Section */}
            <div className="text-center space-y-6 pt-10">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-700 font-black text-sm uppercase tracking-widest shadow-sm"
                >
                    <Trophy className="w-5 h-5 fill-yellow-100" />
                    Celebrating Excellence
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">
                    Wall of <span className="text-indigo-600">Winners.</span>
                </h1>
                <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    Honoring the outstanding achievements and extraordinary performances from our community events.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
                <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                    type="text" 
                    placeholder="Search events or winners..." 
                    className="w-full pl-16 pr-8 py-5 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Winners Grid */}
            <div className="space-y-20">
                {isLoading ? (
                    <div className="grid md:grid-cols-2 gap-10">
                        {[1, 2].map(i => <div key={i} className="h-80 bg-slate-100 rounded-[3rem] animate-pulse"></div>)}
                    </div>
                ) : filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <motion.section 
                            key={event._id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden"
                        >
                            <div className="grid lg:grid-cols-5 h-full">
                                {/* Event Banner Area */}
                                <div className="lg:col-span-2 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-12 opacity-10">
                                        <Trophy className="w-40 h-40" />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-black uppercase tracking-widest text-indigo-300 border border-white/10">
                                            {event.category}
                                        </span>
                                        <h2 className="text-4xl font-black tracking-tight leading-tight">{event.title}</h2>
                                        <div className="space-y-3 font-medium opacity-80">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5" />
                                                {new Date(event.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-5 h-5" />
                                                {event.venue}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Winners List Area */}
                                <div className="lg:col-span-3 p-12 space-y-8">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                                        <h3 className="text-2xl font-black text-slate-900">Hall of Fame</h3>
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{winnersByEvent[event._id].length} Winners</span>
                                    </div>
                                    <div className="space-y-4">
                                        {winnersByEvent[event._id].map((winner, idx) => (
                                            <div 
                                                key={winner._id}
                                                className="group p-6 rounded-3xl bg-slate-50 border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg transition-transform group-hover:scale-110 ${
                                                        winner.position === '1st' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                        winner.position === '2nd' ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                                                        winner.position === '3rd' ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                                                        'bg-gradient-to-br from-indigo-400 to-indigo-600'
                                                    }`}>
                                                        {winner.position[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-black text-slate-900 tracking-tight">{winner.participant?.username || 'Redacted'}</p>
                                                        <p className="text-indigo-600 font-bold text-sm tracking-wide uppercase">{winner.prize}</p>
                                                    </div>
                                                </div>
                                                {idx === 0 && (
                                                    <div className="hidden sm:flex w-10 h-10 bg-yellow-50 text-yellow-600 items-center justify-center rounded-full animate-bounce">
                                                        <Trophy className="w-5 h-5 fill-yellow-100" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100">
                        <Trophy className="w-20 h-20 mx-auto text-slate-200 mb-6 opacity-50" />
                        <h3 className="text-2xl font-black text-slate-900">No results found.</h3>
                        <p className="text-slate-500 font-medium mt-2">Try adjusting your search filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Winners;

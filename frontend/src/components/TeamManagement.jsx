import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Users, UserPlus, Check, X, Search, Mail, Loader2, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeamManagement = ({ eventId, teamId, isLeader }) => {
    const [team, setTeam] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (teamId) {
            fetchTeamDetails();
        }
    }, [teamId]);

    const fetchTeamDetails = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/teams/${teamId}`);
            setTeam(res.data);
        } catch (error) {
            toast.error('Failed to load team details');
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            // Need a dedicated search endpoint or user list
            const res = await axios.get(`http://localhost:5000/api/users/search?q=${searchQuery}`);
            setSearchResults(res.data);
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const inviteUser = async (userId) => {
        try {
            await axios.post(`http://localhost:5000/api/teams/${teamId}/invite`, { userId });
            toast.success('Invitation sent');
            fetchTeamDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to invite');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary-600" />
                        Team Management
                    </h2>
                    {team && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            team.isRegistrationComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                            {team.isRegistrationComplete ? 'Ready' : 'Incomplete'}
                        </span>
                    )}
                </div>

                {/* Team Members List */}
                <div className="space-y-4">
                    {team?.members.map((member, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                                    {member.user.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{member.user.username}</p>
                                    <p className="text-xs text-gray-500">{member.user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {member.status === 'Accepted' ? (
                                    <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold">
                                        <Check className="w-4 h-4" /> Joined
                                    </span>
                                ) : (
                                    <span className="text-amber-600 flex items-center gap-1 text-xs font-bold">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Invite Section (Only for Leader) */}
                {isLeader && (
                    <div className="mt-8 pt-8 border-t space-y-4">
                        <h3 className="font-bold text-gray-900">Invite Members</h3>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    className="input-field pl-9" 
                                    placeholder="Username or Email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button onClick={handleSearch} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all">
                                Search
                            </button>
                        </div>

                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-2 border rounded-xl bg-gray-50 max-h-60 overflow-y-auto"
                                >
                                    {searchResults.map(user => (
                                        <div key={user._id} className="flex items-center justify-between p-3 hover:bg-white rounded-lg transition-all">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-200" />
                                                <span className="text-sm font-medium">{user.username}</span>
                                            </div>
                                            <button 
                                                onClick={() => inviteUser(user._id)}
                                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamManagement;

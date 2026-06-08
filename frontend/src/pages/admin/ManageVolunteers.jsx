import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
    UserPlus, Users, Mail, Lock, 
    Loader2, Trash2, ShieldCheck,
    ArrowLeft, User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ManageVolunteers = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [showForm, setShowForm] = useState(false);

    const fetchVolunteers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/auth/users');
            setVolunteers(res.data.filter(u => u.role === 'Volunteer'));
        } catch (error) {
            toast.error('Failed to load volunteers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchVolunteers(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await axios.post('http://localhost:5000/api/auth/create-volunteer', form);
            toast.success(`Volunteer account created for ${form.username}!`);
            setForm({ username: '', email: '', password: '' });
            setShowForm(false);
            fetchVolunteers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create volunteer');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-12 pb-40">
            {/* Page Header */}
            <div className="flex flex-wrap justify-between items-end gap-6">
                <div className="space-y-4">
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                        Volunteer <span className="text-reveal">Network.</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-md">
                        Manage volunteer accounts. Only admins can create or revoke volunteer access.
                    </p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="btn-premium flex items-center gap-3"
                >
                    <UserPlus className="w-6 h-6" />
                    {showForm ? 'Cancel' : 'Add Volunteer'}
                </button>
            </div>

            {/* Create Volunteer Form */}
            {showForm && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm"
                >
                    <h2 className="text-2xl font-black text-slate-900 mb-8">New Volunteer Account</h2>
                    <form onSubmit={handleCreate} className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                            <div className="relative">
                                <User className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="text" className="input-premium pl-14"
                                    placeholder="Volunteer Name" required
                                    value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="email" className="input-premium pl-14"
                                    placeholder="volunteer@domain.com" required
                                    value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Temp Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="text" className="input-premium pl-14"
                                    placeholder="Min. 6 chars" required minLength={6}
                                    value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3 flex justify-end">
                            <button type="submit" disabled={isCreating} className="btn-premium flex items-center gap-3 py-3 px-10">
                                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Create Volunteer</>}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Volunteers Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900">Active Volunteers</h2>
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest rounded-full">{volunteers.length} members</span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-16 text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-slate-200 mx-auto" />
                        </div>
                    ) : volunteers.length === 0 ? (
                        <div className="p-20 text-center space-y-6">
                            <Users className="w-16 h-16 text-slate-100 mx-auto" />
                            <h3 className="text-2xl font-black text-slate-300">No volunteers yet</h3>
                            <p className="text-slate-400 font-medium">Create your first volunteer account to get started.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Name</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {volunteers.map(vol => (
                                    <tr key={vol._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 font-black flex items-center justify-center text-sm">
                                                    {vol.username[0].toUpperCase()}
                                                </div>
                                                <span className="font-bold text-slate-900">{vol.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-slate-500 font-medium">{vol.email}</td>
                                        <td className="px-10 py-6">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest">
                                                <ShieldCheck className="w-3 h-3" /> Volunteer
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-slate-400 font-medium">
                                            {new Date(vol.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageVolunteers;

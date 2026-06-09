import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
    UserPlus, Users, Mail, Lock, 
    Loader2, ShieldCheck,
    ArrowLeft, User, Phone, Hash, Calendar, GraduationCap, School, MapPin, 
    CheckCircle, History, RefreshCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ManageAssociationMembers = () => {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState('Present'); // 'Present' or 'Past'
    const [form, setForm] = useState({ 
        username: '', 
        email: '', 
        password: '',
        registrationNumber: '',
        phone: '',
        gender: 'Male',
        yearAndDept: 'I B.E. CSE',
        section: 'A',
        membershipStatus: 'Present'
    });
    const [showForm, setShowForm] = useState(false);

    const fetchMembers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/auth/users');
            setMembers(res.data.filter(u => u.role === 'Association Member'));
        } catch (error) {
            toast.error('Failed to load association members');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchMembers(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await axios.post('http://localhost:5000/api/auth/create-association-member', form);
            toast.success(`Member account created for ${form.username}!`);
            setForm({ 
                username: '', email: '', password: '', 
                registrationNumber: '', phone: '', gender: 'Male', 
                yearAndDept: 'I B.E. CSE', section: 'A', membershipStatus: 'Present' 
            });
            setShowForm(false);
            fetchMembers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create member');
        } finally {
            setIsCreating(false);
        }
    };

    const toggleMemberStatus = async (memberId, currentStatus) => {
        const nextStatus = currentStatus === 'Present' ? 'Past' : 'Present';
        try {
            await axios.put(`http://localhost:5000/api/auth/member-status/${memberId}`, { membershipStatus: nextStatus });
            toast.success(`Status updated to ${nextStatus}`);
            fetchMembers();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredMembers = members.filter(m => m.membershipStatus === activeTab);

    return (
        <div className="space-y-12 pb-40">
            {/* Page Header */}
            <div className="flex flex-wrap justify-between items-end gap-6">
                <div className="space-y-4">
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                        Association <span className="text-reveal">Network.</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-md">
                        Manage association member accounts. Categorize between past and present members.
                    </p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="btn-premium flex items-center gap-3"
                >
                    <UserPlus className="w-6 h-6" />
                    {showForm ? 'Cancel' : 'Add Member'}
                </button>
            </div>

            {/* Create Member Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-2xl font-black text-slate-900 mb-8">New Association Member</h2>
                        <form onSubmit={handleCreate} className="space-y-8">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                    <div className="relative">
                                        <User className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input 
                                            type="text" className="input-premium pl-14"
                                            placeholder="Member Name" required
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
                                            placeholder="member@domain.com" required
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

                                {/* Academic Info */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Roll Number</label>
                                    <div className="relative">
                                        <Hash className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input 
                                            type="text" className="input-premium pl-14"
                                            placeholder="Roll No" required
                                            value={form.registrationNumber} onChange={e => setForm({...form, registrationNumber: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input 
                                            type="text" className="input-premium pl-14"
                                            placeholder="Phone Number" required
                                            value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Gender</label>
                                    <select 
                                        className="input-premium"
                                        value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Year and Dept</label>
                                    <select 
                                        className="input-premium"
                                        value={form.yearAndDept} onChange={e => setForm({...form, yearAndDept: e.target.value})}
                                    >
                                        <option value="I B.E. CSE">I B.E. CSE</option>
                                        <option value="II B.E. CSE">II B.E. CSE</option>
                                        <option value="III B.E. CSE">III B.E. CSE</option>
                                        <option value="IV B.E. CSE">IV B.E. CSE</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Section</label>
                                    <select 
                                        className="input-premium"
                                        value={form.section} onChange={e => setForm({...form, section: e.target.value})}
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Membership Status</label>
                                    <select 
                                        className="input-premium"
                                        value={form.membershipStatus} onChange={e => setForm({...form, membershipStatus: e.target.value})}
                                    >
                                        <option value="Present">Present</option>
                                        <option value="Past">Past</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isCreating} className="btn-premium flex items-center gap-3 py-3 px-10">
                                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Create Member</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Members Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900">Member Directory</h2>
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-2">
                            <button 
                                onClick={() => setActiveTab('Present')}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    activeTab === 'Present' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Present
                            </button>
                            <button 
                                onClick={() => setActiveTab('Past')}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    activeTab === 'Past' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Past
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-16 text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-slate-200 mx-auto" />
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="p-20 text-center space-y-6">
                            <Users className="w-16 h-16 text-slate-100 mx-auto" />
                            <h3 className="text-2xl font-black text-slate-300">No members found</h3>
                            <p className="text-slate-400 font-medium">No results for {activeTab.toLowerCase()} members.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Member Info</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Academic</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredMembers.map(member => (
                                    <tr key={member._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl font-black flex items-center justify-center text-lg ${
                                                    member.membershipStatus === 'Present' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                    {member.username[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900">{member.username}</span>
                                                    <span className="text-xs text-slate-400 font-bold">{member.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <GraduationCap className="w-3.5 h-3.5" /> {member.yearAndDept}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                                    <School className="w-3.5 h-3.5" /> Section {member.section}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                member.membershipStatus === 'Present' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>
                                                {member.membershipStatus === 'Present' ? <CheckCircle className="w-3 h-3" /> : <History className="w-3 h-3" />}
                                                {member.membershipStatus}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <button 
                                                onClick={() => toggleMemberStatus(member._id, member.membershipStatus)}
                                                className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:bg-white px-4 py-2 rounded-xl transition-all shadow-sm border border-slate-100"
                                            >
                                                <RefreshCcw className="w-4 h-4" />
                                                Move to {member.membershipStatus === 'Present' ? 'Past' : 'Present'}
                                            </button>
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

export default ManageAssociationMembers;

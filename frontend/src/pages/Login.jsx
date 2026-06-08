import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Loader2, ChevronRight, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const { login, getDashboardPath } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', formData);
            // response.data is {_id, username, email, role, token}
            login(response.data);
            toast.success(`Welcome back, ${response.data.username}!`);
            // Role-based redirect
            navigate(getDashboardPath(response.data.role));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative py-20 px-6">
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[480px]"
            >
                <div className="text-center space-y-4 mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-indigo-600 shadow-xl shadow-indigo-200 text-white mb-6">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
                    <p className="text-slate-500 font-medium text-lg">All roles sign in from this page.</p>
                    <div className="flex justify-center gap-2 flex-wrap">
                        {['Admin', 'Volunteer', 'Participant'].map(role => (
                            <span key={role} className="px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full bg-slate-50 border border-slate-100 text-slate-500">
                                {role}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="email" 
                                    className="input-premium pl-14" 
                                    placeholder="name@company.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="password" 
                                    className="input-premium pl-14" 
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="btn-premium w-full flex items-center justify-center gap-3 py-4 text-lg"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Sign In to Dashboard
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-50 text-center space-y-3">
                        <p className="text-slate-500 font-medium">
                            New participant?{' '}
                            <Link to="/register" className="text-indigo-600 font-black hover:underline inline-flex items-center gap-1 group">
                                Create Free Account <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </p>
                        <p className="text-xs text-slate-400 font-medium px-4">
                            Volunteers and Admins: your accounts are created by the system administrator.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

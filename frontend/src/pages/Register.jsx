import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Building2, ArrowRight, Loader2, ChevronRight, Sparkles, Phone, FileText, Tag, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        registrationNumber: '',
        phone: '',
        bio: '',
        skills: '',
        dateOfBirth: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Convert skills string to array
            const submitData = {
                ...formData,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== '')
            };
            const response = await axios.post('http://localhost:5000/api/auth/register', submitData);
            // Server returns flat user object with token
            login(response.data);
            toast.success('Account created! Welcome aboard 🎉');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative py-20 px-6">
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[520px]"
            >
                <div className="text-center space-y-4 mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-indigo-600 shadow-xl shadow-indigo-200 text-white mb-6">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create Account</h1>
                    <p className="text-slate-500 font-medium text-lg">Join as a Participant and explore events.</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest">
                        Participant Registration
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                <div className="relative">
                                    <User className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input 
                                        type="text" 
                                        name="username"
                                        className="input-premium pl-14" 
                                        placeholder="John Doe"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Student / Reg ID</label>
                                <div className="relative">
                                    <Building2 className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="text"
                                        name="registrationNumber"
                                        className="input-premium pl-14"
                                        placeholder="ST12345 (optional)"
                                        value={formData.registrationNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Date of Birth</label>
                            <div className="relative">
                                <Calendar className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    className="input-premium pl-14"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="email" 
                                    name="email"
                                    className="input-premium pl-14" 
                                    placeholder="name@example.com"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="password" 
                                    name="password"
                                    className="input-premium pl-14" 
                                    placeholder="Min. 6 characters"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="tel" 
                                    name="phone"
                                    className="input-premium pl-14" 
                                    placeholder="+1 234 567 8900"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Bio</label>
                            <div className="relative">
                                <FileText className="w-5 h-5 absolute left-5 top-4 text-slate-300" />
                                <textarea 
                                    name="bio"
                                    className="input-premium pl-14 h-24 resize-none" 
                                    placeholder="Tell us about yourself..."
                                    maxLength={500}
                                    value={formData.bio}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Skills</label>
                            <div className="relative">
                                <Tag className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                    type="text" 
                                    name="skills"
                                    className="input-premium pl-14" 
                                    placeholder="JavaScript, React, Python (comma separated)"
                                    value={formData.skills}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="btn-premium w-full flex items-center justify-center gap-3 py-4 text-lg mt-4"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Create Participant Account
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                        <p className="text-slate-500 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-600 font-black hover:underline inline-flex items-center gap-1 group">
                                Sign In <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </p>
                        <p className="text-xs text-slate-400 mt-4 font-medium">
                            Admin or Volunteer? Use your credentials on the Login page.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;

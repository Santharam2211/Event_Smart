import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, FileText, Tag, Building2, Camera, Save, Loader2, Sparkles, Calendar, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        bio: '',
        skills: '',
        registrationNumber: '',
        dateOfBirth: '',
        signature: '',
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [signatureFile, setSignatureFile] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || '',
                skills: user.skills ? user.skills.join(', ') : '',
                registrationNumber: user.registrationNumber || '',
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
                signature: user.signature || '',
            });

            // Set signature preview if exists
            if (user.signature) {
                // Check if signature is a URL or base64, otherwise assume it's a filename
                if (user.signature.startsWith('http') || user.signature.startsWith('data:')) {
                    setSignaturePreview(user.signature);
                } else {
                    setSignaturePreview(`http://localhost:5000/uploads/${user.signature}`);
                }
            }
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/upload-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            updateUser({ ...user, profileImage: response.data.profileImage });
            toast.success('Profile picture updated! 🎉');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSignatureFile(file);
        setSignaturePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('username', formData.username);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('bio', formData.bio);
            formDataToSend.append('skills', formData.skills);
            formDataToSend.append('registrationNumber', formData.registrationNumber);
            formDataToSend.append('dateOfBirth', formData.dateOfBirth);

            if (signatureFile) {
                formDataToSend.append('signature', signatureFile);
            } else if (formData.signature) {
                formDataToSend.append('signature', formData.signature);
            }

            const response = await axios.put('http://localhost:5000/api/auth/profile', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            updateUser(response.data);
            toast.success('Profile updated successfully! 🎉');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-100"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 overflow-hidden">
                            {user?.profileImage && user.profileImage !== 'default-profile.png' ? (
                                <img
                                    src={`http://localhost:5000/uploads/${user.profileImage}`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Sparkles className="w-10 h-10" />
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors shadow-lg">
                            <Camera className="w-4 h-4" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploadingImage}
                            />
                        </label>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">My Profile</h1>
                        <p className="text-slate-500 font-medium">Manage your personal information</p>
                    </div>
                </div>

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
                                    value={formData.username}
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
                                    className="input-premium pl-14 bg-slate-50"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
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
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Student / Reg ID</label>
                            <div className="relative">
                                <Building2 className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    name="registrationNumber"
                                    className="input-premium pl-14"
                                    placeholder="ST12345"
                                    value={formData.registrationNumber}
                                    onChange={handleChange}
                                />
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
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Bio</label>
                        <div className="relative">
                            <FileText className="w-5 h-5 absolute left-5 top-4 text-slate-300" />
                            <textarea 
                                name="bio"
                                className="input-premium pl-14 h-32 resize-none" 
                                placeholder="Tell us about yourself..."
                                maxLength={500}
                                value={formData.bio}
                                onChange={handleChange}
                            />
                        </div>
                        <p className="text-xs text-slate-400 pl-1">{formData.bio.length}/500 characters</p>
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
                        <p className="text-xs text-slate-400 pl-1">Separate multiple skills with commas</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Signature</label>
                        <div className="relative">
                            <PenTool className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleSignatureUpload}
                                className="input-premium pl-14"
                            />
                        </div>
                        {signaturePreview && (
                            <div className="mt-2">
                                <img
                                    src={signaturePreview}
                                    alt="Signature preview"
                                    className="h-24 object-contain border-2 border-slate-200 rounded-xl"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="btn-premium w-full flex items-center justify-center gap-3 py-4 text-lg"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-6 h-6" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Profile;

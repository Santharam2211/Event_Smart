import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
    Award, Upload, Save, Eye, Plus, Trash2, 
    ChevronLeft, Loader2, Maximize2, Settings2,
    Type, Hash, Palette, Move, AlignLeft, 
    AlignCenter, AlignRight, Bold, Italic
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ManageCertificates = () => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [config, setConfig] = useState({ fields: [] });
    const [templateFile, setTemplateFile] = useState(null);
    const [templatePreview, setTemplatePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isBulkSending, setIsBulkSending] = useState(false);
    
    const canvasRef = useRef(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/events');
                setEvents(res.data);
            } catch (error) {
                toast.error('Failed to load events');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            fetchConfig(selectedEventId);
        }
    }, [selectedEventId]);

    const fetchConfig = async (eventId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/certificates/config/${eventId}`);
            setConfig(res.data || { fields: [] });
            if (res.data?.template) {
                setTemplatePreview(`http://localhost:5000/uploads/${res.data.template}`);
            } else {
                setTemplatePreview(null);
            }
        } catch (error) {
            toast.error('Failed to load certificate configuration');
        }
    };

    const handleTemplateUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTemplateFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setTemplatePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const addField = () => {
        const newField = {
            type: 'Name',
            x: 400,
            y: 300,
            fontSize: 30,
            color: '#000000',
            fontStyle: 'bold',
            alignment: 'center',
            width: 400
        };
        setConfig({ ...config, fields: [...config.fields, newField] });
    };

    const updateField = (index, updates) => {
        const newFields = [...config.fields];
        newFields[index] = { ...newFields[index], ...updates };
        setConfig({ ...config, fields: newFields });
    };

    const removeField = (index) => {
        const newFields = config.fields.filter((_, i) => i !== index);
        setConfig({ ...config, fields: newFields });
    };

    const saveConfig = async () => {
        if (!selectedEventId) return;
        
        setIsSaving(true);
        const formData = new FormData();
        if (templateFile) {
            formData.append('template', templateFile);
        }
        formData.append('config', JSON.stringify(config));

        try {
            await axios.post(`http://localhost:5000/api/certificates/config/${selectedEventId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Certificate configuration saved!');
            fetchConfig(selectedEventId);
        } catch (error) {
            toast.error('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePreview = async () => {
        if (!selectedEventId) return;
        setIsPreviewing(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/certificates/preview/${selectedEventId}`, config, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            window.open(url);
        } catch (error) {
            toast.error('Failed to generate preview');
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleBulkSend = async () => {
        if (!selectedEventId) return;
        if (!window.confirm('This will email certificates to ALL eligible participants (attended + feedback submitted). Continue?')) return;
        
        setIsBulkSending(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/certificates/bulk-send/${selectedEventId}`);
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Bulk send failed');
        } finally {
            setIsBulkSending(false);
        }
    };

    // Render Canvas Preview
    useEffect(() => {
        if (canvasRef.current && templatePreview) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Draw fields
                config.fields.forEach(field => {
                    ctx.font = `${field.fontStyle === 'bold' ? 'bold ' : field.fontStyle === 'italic' ? 'italic ' : ''}${field.fontSize}px Helvetica`;
                    ctx.fillStyle = field.color;
                    ctx.textAlign = field.alignment;
                    
                    let sampleText = '';
                    if (field.type === 'Text') {
                        sampleText = field.text || '';
                        const vars = {
                            '{Prefix}': 'Selvan',
                            '{Name}': 'John Doe',
                            '{Year}': 'III',
                            '{Department}': 'B.E. CSE',
                            '{Year&Department}': 'III B.E. CSE',
                            '{EventName}': events.find(e => e._id === selectedEventId)?.title || 'Event Name'
                        };
                        Object.keys(vars).forEach(v => {
                            sampleText = sampleText.replace(new RegExp(v, 'g'), vars[v]);
                        });
                    } else {
                        switch (field.type) {
                            case 'Name': sampleText = 'John Doe'; break;
                            case 'Prefix': sampleText = 'Selvan'; break;
                            case 'Year': sampleText = 'III'; break;
                            case 'Department': sampleText = 'B.E. CSE'; break;
                        }
                    }

                    // Handle wrapping in canvas preview
                    const words = sampleText.split(' ');
                    let line = '';
                    let y = field.y;
                    const lineHeight = field.fontSize * 1.2;

                    for (let n = 0; n < words.length; n++) {
                        let testLine = line + words[n] + ' ';
                        let metrics = ctx.measureText(testLine);
                        let testWidth = metrics.width;
                        if (testWidth > (field.width || 600) && n > 0) {
                            ctx.fillText(line, field.x, y);
                            line = words[n] + ' ';
                            y += lineHeight;
                        }
                        else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line, field.x, y);
                    
                    // Draw a small indicator for the point
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
                    ctx.beginPath();
                    ctx.arc(field.x, field.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                });
            };
            img.src = templatePreview;
        }
    }, [templatePreview, config]);

    return (
        <div className="space-y-12 pb-40">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-6">
                <div className="space-y-4">
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors text-sm">
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                        Certificate <span className="text-reveal">Studio.</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-md">
                        Design and distribute dynamic certificates for your events.
                    </p>
                </div>
                {selectedEventId && (
                    <div className="flex gap-4">
                        <button 
                            onClick={handleBulkSend}
                            disabled={isBulkSending}
                            className="bg-white px-8 py-4 border-2 border-emerald-600 text-emerald-600 rounded-2xl font-black hover:bg-emerald-600 hover:text-white transition-all duration-300 flex items-center gap-3"
                        >
                            {isBulkSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Award className="w-6 h-6" />}
                            Bulk Send
                        </button>
                        <button 
                            onClick={handlePreview}
                            disabled={isPreviewing}
                            className="bg-white px-8 py-4 border-2 border-slate-900 text-slate-900 rounded-2xl font-black hover:bg-slate-900 hover:text-white transition-all duration-300 flex items-center gap-3"
                        >
                            {isPreviewing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Eye className="w-6 h-6" />}
                            Preview
                        </button>
                        <button 
                            onClick={saveConfig}
                            disabled={isSaving}
                            className="btn-premium flex items-center gap-3"
                        >
                            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                            Save Configuration
                        </button>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Sidebar - Event Selection & Template */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block pl-1">Select Event</label>
                            <select 
                                className="input-premium w-full"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                            >
                                <option value="">Choose an event...</option>
                                {events.map(event => (
                                    <option key={event._id} value={event._id}>{event.title}</option>
                                ))}
                            </select>
                        </div>

                        {selectedEventId && (
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block pl-1">Template Image</label>
                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 mb-3 transition-colors" />
                                        <p className="text-sm font-bold text-slate-500">Click to upload</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">JPG, PNG, WEBP</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleTemplateUpload} />
                                </label>
                            </div>
                        )}
                    </div>

                    {selectedEventId && (
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-white space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                                    <Settings2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black">Controls</h3>
                            </div>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Use the field editor to map participant data onto your certificate template. Coordinates are in pixels (800x565).
                            </p>
                            <button 
                                onClick={addField}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20"
                            >
                                <Plus className="w-5 h-5" /> Add New Field
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content - Preview & Editor */}
                <div className="lg:col-span-3 space-y-8">
                    {!selectedEventId ? (
                        <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center space-y-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto">
                                <Award className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-300">No Event Selected</h2>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto">Please select an event from the sidebar to begin designing the certificate.</p>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-5 gap-8">
                            {/* Canvas Preview */}
                            <div className="lg:col-span-3 space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-lg font-black text-slate-900">Live Workspace</h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">800 X 565 PX</span>
                                </div>
                                <div className="bg-slate-100 rounded-[2.5rem] p-4 border border-slate-200 shadow-inner overflow-hidden flex items-center justify-center min-h-[500px]">
                                    {templatePreview ? (
                                        <canvas 
                                            ref={canvasRef} 
                                            width={800} 
                                            height={565} 
                                            className="max-w-full h-auto rounded-xl shadow-2xl bg-white"
                                        />
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <Upload className="w-12 h-12 text-slate-300 mx-auto" />
                                            <p className="text-slate-400 font-bold">Upload a template to see preview</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Fields Editor */}
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-lg font-black text-slate-900 px-2">Dynamic Fields</h3>
                                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Available Variables</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['{Prefix}', '{Name}', '{Year}', '{Department}', '{Year&Department}', '{EventName}', '{RegistrationID}'].map(v => (
                                                <code key={v} className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-amber-700 border border-amber-100">{v}</code>
                                            ))}
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {config.fields.map((field, idx) => (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors space-y-6 relative group"
                                            >
                                                <button 
                                                    onClick={() => removeField(idx)}
                                                    className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-slate-100 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Data Map</label>
                                                        <select 
                                                            className="input-premium py-2 text-xs"
                                                            value={field.type}
                                                            onChange={e => updateField(idx, { type: e.target.value })}
                                                        >
                                                            <option value="Name">Participant Name</option>
                                                            <option value="Prefix">Prefix (Selvan/i)</option>
                                                            <option value="Year">Year</option>
                                                            <option value="Department">Department</option>
                                                            <option value="Text">Static Text</option>
                                                        </select>
                                                    </div>
                                                    {field.type === 'Text' && (
                                                        <div className="col-span-2 space-y-1.5">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dynamic Content</label>
                                                            <textarea 
                                                                className="input-premium py-3 text-xs min-h-[80px] leading-relaxed"
                                                                placeholder="e.g. This is to certify that {Prefix} {Name}..."
                                                                value={field.text || ''}
                                                                onChange={e => updateField(idx, { text: e.target.value })}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">X Position</label>
                                                        <div className="relative">
                                                            <Move className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                                            <input 
                                                                type="number" className="input-premium py-2 pl-8 text-xs"
                                                                value={field.x}
                                                                onChange={e => updateField(idx, { x: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Y Position</label>
                                                        <div className="relative">
                                                            <Move className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 rotate-90" />
                                                            <input 
                                                                type="number" className="input-premium py-2 pl-8 text-xs"
                                                                value={field.y}
                                                                onChange={e => updateField(idx, { y: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Font Size</label>
                                                        <div className="relative">
                                                            <Maximize2 className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                                            <input 
                                                                type="number" className="input-premium py-2 pl-8 text-xs"
                                                                value={field.fontSize}
                                                                onChange={e => updateField(idx, { fontSize: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Color</label>
                                                        <div className="relative overflow-hidden h-[42px] rounded-xl border-2 border-slate-100">
                                                            <input 
                                                                type="color" className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer"
                                                                value={field.color}
                                                                onChange={e => updateField(idx, { color: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <button 
                                                        onClick={() => updateField(idx, { alignment: 'left' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.alignment === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        <AlignLeft className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => updateField(idx, { alignment: 'center' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.alignment === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        <AlignCenter className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => updateField(idx, { alignment: 'right' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.alignment === 'right' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        <AlignRight className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-6 bg-slate-200 self-center"></div>
                                                    <button 
                                                        onClick={() => updateField(idx, { fontStyle: field.fontStyle === 'bold' ? 'normal' : 'bold' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.fontStyle === 'bold' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        <Bold className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => updateField(idx, { fontStyle: field.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.fontStyle === 'italic' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        <Italic className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {config.fields.length === 0 && (
                                        <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                            <Type className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                                            <p className="text-slate-300 font-bold">No dynamic fields added yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageCertificates;

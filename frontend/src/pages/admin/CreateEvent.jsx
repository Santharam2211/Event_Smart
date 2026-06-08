import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Calendar, Clock, MapPin, Image as ImageIcon, Briefcase, Users, Layout } from 'lucide-react';
import { motion } from 'framer-motion';

const CreateEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        venue: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        registrationDeadline: '',
        maxParticipants: 100,
        category: 'Workshop',
        participationType: 'Individual',
        minTeamSize: 1,
        maxTeamSize: 1,
        status: 'Open',
        registrationForm: [],
        bannerImage: ''
    });
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState('');

    useEffect(() => {
        if (id) {
            const fetchEvent = async () => {
                try {
                    const res = await axios.get(`http://localhost:5000/api/events/${id}`);
                    const data = res.data;
                    // Format dates for input fields
                    data.eventDate = data.eventDate.split('T')[0];
                    data.registrationDeadline = data.registrationDeadline.split('T')[0];
                    setEventData(data);
                    if (data.bannerImage) {
                        setBannerPreview(`http://localhost:5000/uploads/${data.bannerImage}`);
                    }
                } catch (error) {
                    toast.error('Failed to load event');
                }
            };
            fetchEvent();
        }
    }, [id]);

    const addFormField = () => {
        setEventData({
            ...eventData,
            registrationForm: [
                ...eventData.registrationForm,
                { label: '', type: 'text', required: false, options: [] }
            ]
        });
    };

    const removeFormField = (index) => {
        const newForm = [...eventData.registrationForm];
        newForm.splice(index, 1);
        setEventData({ ...eventData, registrationForm: newForm });
    };

    const updateField = (index, key, value) => {
        const newForm = [...eventData.registrationForm];
        newForm[index][key] = value;
        setEventData({ ...eventData, registrationForm: newForm });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formData = new FormData();
            Object.keys(eventData).forEach(key => {
                if (key !== 'bannerImage' && key !== 'registrationForm') {
                    formData.append(key, eventData[key]);
                }
            });
            formData.append('registrationForm', JSON.stringify(eventData.registrationForm));

            if (bannerFile) {
                formData.append('bannerImage', bannerFile);
            }

            if (id) {
                await axios.put(`http://localhost:5000/api/events/${id}`, formData);
                toast.success('Event updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/events', formData);
                toast.success('Event created successfully');
            }
            navigate('/admin');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{id ? 'Edit Event' : 'Create New Event'}</h1>
                    <p className="text-gray-500 mt-1">Fill in the details to publish your event</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/admin')} className="px-6 py-2 border rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={handleSubmit} disabled={isLoading} className="btn-primary px-8 flex items-center gap-2">
                        {isLoading ? 'Saving...' : id ? 'Update Event' : 'Create Event'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: General Info */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-2 text-primary-600 mb-2">
                            <Layout className="w-5 h-5" />
                            <h2 className="text-xl font-bold">General Information</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                                <input 
                                    type="text" 
                                    className="input-field text-lg font-medium" 
                                    placeholder="e.g. Annual Tech Symposium 2024"
                                    value={eventData.title}
                                    onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="input-field h-40"
                                    placeholder="Detailed description of the event..."
                                    value={eventData.description}
                                    onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="input-field"
                                    />
                                    {bannerPreview && (
                                        <div className="mt-2">
                                            <img
                                                src={bannerPreview}
                                                alt="Banner preview"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select 
                                        className="input-field"
                                        value={eventData.category}
                                        onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                                    >
                                        <option>Workshop</option>
                                        <option>Hackathon</option>
                                        <option>Conference</option>
                                        <option>Seminar</option>
                                        <option>Competition</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            className="input-field pl-9" 
                                            placeholder="Auditorium 1"
                                            value={eventData.venue}
                                            onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Registration Form Builder */}
                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-primary-600">
                                <Plus className="w-5 h-5" />
                                <h2 className="text-xl font-bold">Registration Form Builder</h2>
                            </div>
                            <button 
                                onClick={addFormField}
                                className="text-primary-600 text-sm font-bold flex items-center gap-1 hover:bg-primary-50 px-3 py-1 rounded-lg"
                            >
                                <Plus className="w-4 h-4" /> Add Field
                            </button>
                        </div>

                        <div className="space-y-4">
                            {eventData.registrationForm.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50 text-gray-500">
                                    No custom fields added yet.
                                </div>
                            ) : (
                                eventData.registrationForm.map((field, index) => (
                                    <motion.div 
                                        key={index} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 border rounded-xl flex gap-4 items-start bg-gray-50/50"
                                    >
                                        <div className="flex-1 space-y-4">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="Field Label" 
                                                    className="input-field bg-white"
                                                    value={field.label}
                                                    onChange={(e) => updateField(index, 'label', e.target.value)}
                                                />
                                                <select 
                                                    className="input-field bg-white"
                                                    value={field.type}
                                                    onChange={(e) => updateField(index, 'type', e.target.value)}
                                                >
                                                    <option value="text">Text Input</option>
                                                    <option value="textarea">Text Area</option>
                                                    <option value="dropdown">Dropdown</option>
                                                    <option value="radio">Radio Group</option>
                                                    <option value="checkbox">Checkbox</option>
                                                    <option value="file">File Upload</option>
                                                    <option value="date">Date Picker</option>
                                                </select>
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={field.required}
                                                            onChange={(e) => updateField(index, 'required', e.target.checked)}
                                                        />
                                                        Required
                                                    </label>
                                                    <button onClick={() => removeFormField(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg ml-auto">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
                                                <div className="flex gap-2 items-center bg-white p-2 rounded-lg border border-primary-100">
                                                    <span className="text-xs font-bold text-primary-600 px-2 uppercase">Options:</span>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Enter options separated by commas (e.g. Option 1, Option 2)" 
                                                        className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-1"
                                                        value={field.options ? field.options.join(', ') : ''}
                                                        onChange={(e) => updateField(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Side: Schedule & Logistics */}
                <div className="space-y-6">
                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-2 text-primary-600 mb-2">
                            <Calendar className="w-5 h-5" />
                            <h2 className="text-xl font-bold">Schedule</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                                <input 
                                    type="date" 
                                    className="input-field"
                                    value={eventData.eventDate}
                                    onChange={(e) => setEventData({ ...eventData, eventDate: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        className="input-field"
                                        value={eventData.startTime}
                                        onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input 
                                        type="time" 
                                        className="input-field"
                                        value={eventData.endTime}
                                        onChange={(e) => setEventData({ ...eventData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                                <input 
                                    type="date" 
                                    className="input-field border-amber-200 bg-amber-50"
                                    value={eventData.registrationDeadline}
                                    onChange={(e) => setEventData({ ...eventData, registrationDeadline: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-2 text-primary-600 mb-2">
                            <Users className="w-5 h-5" />
                            <h2 className="text-xl font-bold">Participation</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select 
                                    className="input-field"
                                    value={eventData.participationType}
                                    onChange={(e) => setEventData({ ...eventData, participationType: e.target.value })}
                                >
                                    <option value="Individual">Individual</option>
                                    <option value="Team">Team-based</option>
                                </select>
                            </div>

                            {eventData.participationType === 'Team' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Team Size</label>
                                        <input 
                                            type="number" 
                                            className="input-field"
                                            value={eventData.minTeamSize}
                                            onChange={(e) => setEventData({ ...eventData, minTeamSize: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Team Size</label>
                                        <input 
                                            type="number" 
                                            className="input-field"
                                            value={eventData.maxTeamSize}
                                            onChange={(e) => setEventData({ ...eventData, maxTeamSize: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants (Total)</label>
                                <input 
                                    type="number" 
                                    className="input-field"
                                    value={eventData.maxParticipants}
                                    onChange={(e) => setEventData({ ...eventData, maxParticipants: parseInt(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Publishing Status</label>
                                <select 
                                    className="input-field font-bold"
                                    value={eventData.status}
                                    onChange={(e) => setEventData({ ...eventData, status: e.target.value })}
                                >
                                    <option value="Draft">Draft (Hidden)</option>
                                    <option value="Open">Open (Live)</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;

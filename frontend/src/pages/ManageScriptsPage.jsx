import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';
import { 
    FileText, Plus, UserPlus, Save, Trash2, 
    CheckCircle, XCircle, Users, Layout, 
    ChevronRight, Sparkles, Loader2, Search,
    Edit3, Info, BarChart2, TrendingUp, Zap, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const ManageScriptsPage = () => {
    const [scripts, setScripts] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [telecallers, setTelecallers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [editingScript, setEditingScript] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        assignedTo: [],
        isActive: true
    });

    const fetchScripts = async () => {
        try {
            const [scriptsRes, analyticsRes] = await Promise.all([
                axios.get('/scripts'),
                axios.get('/scripts/analytics')
            ]);
            setScripts(Array.isArray(scriptsRes.data) ? scriptsRes.data : []);
            setAnalytics(Array.isArray(analyticsRes.data) ? analyticsRes.data : []);
        } catch (error) {
            console.error("Scripts/Analytics load error:", error);
            toast.error("Failed to load scripts or analytics");
            setScripts([]);
            setAnalytics([]);
        }
    };

    const fetchTelecallers = async () => {
        try {
            const res = await axios.get('/admin/telecallers');
            setTelecallers(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Telecallers load error:", error);
            toast.error("Failed to load telecallers");
            setTelecallers([]);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setFetching(true);
            await Promise.all([fetchScripts(), fetchTelecallers()]);
            setFetching(false);
        };
        loadData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const toggleAssignee = (userId) => {
        setFormData(prev => ({
            ...prev,
            assignedTo: prev.assignedTo.includes(userId)
                ? prev.assignedTo.filter(id => id !== userId)
                : [...prev.assignedTo, userId]
        }));
    };

    const insertVariable = (variable) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content + ` {{${variable}}}`
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            return toast.error("Title and Content are required");
        }

        setLoading(true);
        try {
            if (editingScript) {
                await axios.put(`/scripts/${editingScript._id}`, formData);
                toast.success("Script updated successfully!");
            } else {
                await axios.post('/scripts', formData);
                toast.success("Script created and assigned!");
            }
            
            setFormData({ title: '', content: '', assignedTo: [], isActive: true });
            setEditingScript(null);
            setShowForm(false);
            fetchScripts();
        } catch (error) {
            toast.error(error.response?.data?.msg || "Failed to save script");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (script) => {
        setEditingScript(script);
        setFormData({
            title: script.title,
            content: script.content,
            assignedTo: script.assignedTo.map(u => u._id || u),
            isActive: script.isActive
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this script?")) return;
        
        try {
            await axios.delete(`/scripts/${id}`);
            toast.success("Script deleted");
            fetchScripts();
        } catch (error) {
            toast.error("Failed to delete script");
        }
    };

    const cancelEdit = () => {
        setEditingScript(null);
        setFormData({ title: '', content: '', assignedTo: [], isActive: true });
        setShowForm(false);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-fuchsia-500 rounded-2xl text-white shadow-lg shadow-fuchsia-500/20">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Script Manager</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Assign pitches to telecallers</p>
                        </div>
                    </div>
                </div>

                {!showForm && (
                    <Button 
                        onClick={() => setShowForm(true)}
                        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 px-6 py-3 shadow-xl shadow-fuchsia-600/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Create New Script
                    </Button>
                )}
            </div>

            {showForm && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                    <Card className="p-6 border-none shadow-2xl relative overflow-hidden bg-white dark:bg-slate-900">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-fuchsia-500"></div>
                        
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                                <Plus size={16} className="text-fuchsia-500" />
                                {editingScript ? "Edit Script" : "Compose New Script"}
                            </h3>
                            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Editor Section */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Script Title</label>
                                    <input 
                                        type="text"
                                        name="title"
                                        placeholder="e.g., Summer Discount Pitch"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all shadow-inner"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Script Content</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['name', 'product', 'price', 'last_call', 'sender'].map(v => (
                                                <button 
                                                    key={v}
                                                    type="button"
                                                    onClick={() => insertVariable(v)}
                                                    className="px-2 py-1 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 text-[9px] font-black uppercase tracking-tighter rounded border border-fuchsia-100 dark:border-fuchsia-900/30 hover:bg-fuchsia-100 transition-colors"
                                                >
                                                    + {v.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea 
                                        name="content"
                                        placeholder="Write your pitch here. Use the buttons above to personalize..."
                                        className="w-full h-64 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all shadow-inner resize-none"
                                        value={formData.content}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Assignment Section */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <UserPlus size={14} /> Assign Telecallers
                                        </h4>
                                        <span className="text-[10px] font-black text-white bg-fuchsia-500 px-2 py-0.5 rounded-full">
                                            {formData.assignedTo.length} Selected
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto max-h-[300px] space-y-1.5 pr-2 custom-scrollbar">
                                        {telecallers.length > 0 ? telecallers.map(user => (
                                            <div 
                                                key={user._id}
                                                onClick={() => toggleAssignee(user._id)}
                                                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${formData.assignedTo.includes(user._id) ? 'bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-200 dark:border-fuchsia-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-fuchsia-200'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${formData.assignedTo.includes(user._id) ? 'bg-fuchsia-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                        {user.name ? user.name[0] : '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-white">{user.name || 'Unknown'}</p>
                                                        <p className="text-[9px] text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className={`transition-all ${formData.assignedTo.includes(user._id) ? 'text-fuchsia-500 opacity-100' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`}>
                                                    <CheckCircle size={18} />
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-10">
                                                <p className="text-xs text-slate-400 italic">No telecallers found.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                id="isActive"
                                                name="isActive"
                                                className="w-4 h-4 accent-fuchsia-500"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                            />
                                            <label htmlFor="isActive" className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">Set as Active</label>
                                        </div>
                                        <Button 
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black uppercase tracking-widest text-xs py-3 rounded-xl shadow-lg shadow-fuchsia-600/20"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            {editingScript ? "Update Script" : "Publish Script"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Scripts List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Layout size={14} /> Existing Scripts ({scripts.length})
                    </h3>
                </div>

                {fetching ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Loader2 className="animate-spin text-fuchsia-500 mb-4" size={32} />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Library...</p>
                    </div>
                ) : scripts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scripts.map(script => (
                            <Card key={script._id} className="group p-5 border-none shadow-xl hover:shadow-2xl transition-all bg-white dark:bg-slate-900 overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${script.isActive ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-black text-slate-800 dark:text-white text-sm line-clamp-1">{script.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${script.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`}></div>
                                            <span className={`text-[9px] font-black uppercase tracking-tighter ${script.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {script.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleEdit(script)}
                                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(script._id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl mb-4 h-24 overflow-hidden">
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4 italic">
                                        "{script.content}"
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {script.assignedTo?.slice(0, 3).map((user, idx) => (
                                                    <div 
                                                        key={idx}
                                                        title={user.name || "Unknown"}
                                                        className="w-5 h-5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[7px] font-black text-fuchsia-600"
                                                    >
                                                        {user.name ? user.name[0] : '?'}
                                                    </div>
                                            ))}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {script.assignedTo?.length || 0} Assigned
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-medium text-slate-400">
                                        {new Date(script.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <FileText size={32} />
                        </div>
                        <h4 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Library is empty</h4>
                        <p className="text-[11px] text-slate-400 mt-1">Create your first script to start assigning pitches.</p>
                        <Button 
                            onClick={() => setShowForm(true)}
                            className="mt-6 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm py-2 px-6"
                        >
                            <Plus size={14} className="text-fuchsia-500" />
                            Write Now
                        </Button>
                    </div>
                )}
            </div>

            {/* Analytics Table */}
            <Card className="p-0 overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-500" />
                        Script Performance Analytics
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Script Title</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Total Usage</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Interested</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Success Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {Array.isArray(analytics) && analytics.length > 0 ? analytics.map((stat, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 dark:text-white">{stat.title}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-slate-600 dark:text-slate-400">{stat.totalUsed}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-emerald-600">{stat.interested}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-xs font-black ${stat.successRate > 50 ? 'text-emerald-500' : stat.successRate > 20 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                {Math.round(stat.successRate)}%
                                            </span>
                                            <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${stat.successRate > 50 ? 'bg-emerald-500' : stat.successRate > 20 ? 'bg-amber-500' : 'bg-slate-400'}`}
                                                    style={{ width: `${stat.successRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400 italic text-xs">
                                        No performance data available yet. Start logging calls to see analytics.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Helper Card */}
            <Card className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 border-none shadow-xl text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150">
                    <Sparkles size={120} />
                </div>
                <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Info size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-1">Manager Tip</h4>
                        <p className="text-xs text-blue-50 leading-relaxed max-w-2xl opacity-90 font-medium">
                            Use variables like <code className="bg-white/20 px-1 rounded font-black text-[10px] tracking-normal">{"{{name}}"}</code> to automatically insert the customer's name. Telecallers will see the personalized version in real-time when they select a lead.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ManageScriptsPage;

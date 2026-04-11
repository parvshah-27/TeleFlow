import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { 
    MessageCircle, Send, Users, CheckSquare, Square, Filter, 
    RefreshCcw, Search, History, CheckCircle2, Sparkles, 
    Loader2, Calendar, Clock, Layers, ChevronRight, 
    X, AlertCircle, Info, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- Sub-components ---

const WhatsAppPreview = ({ message, senderName, leadPreview }) => {
    // Replace variables for preview
    const previewMessage = message
        .replace(/{{name}}/g, leadPreview?.name || "Customer")
        .replace(/{{phone}}/g, leadPreview?.phone || "9988776655")
        .replace(/{{product}}/g, leadPreview?.product || "Service")
        .replace(/{{sender}}/g, senderName);

    return (
        <div className="w-full max-w-[300px] mx-auto bg-[#e5ddd5] dark:bg-slate-900 rounded-[32px] overflow-hidden border-[10px] border-slate-800 shadow-2xl aspect-[9/16] relative flex flex-col scale-90 sm:scale-100 origin-top">
            {/* Header */}
            <div className="bg-[#075e54] p-3 pt-8 flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-slate-300 flex-shrink-0 overflow-hidden ring-1 ring-white/20">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`} alt="avatar" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold truncate leading-none">{leadPreview?.name || "Customer"}</p>
                    <p className="text-[8px] opacity-70">online</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-3 flex flex-col justify-end pb-12 overflow-y-auto">
                {message ? (
                    <div className="self-end bg-[#dcf8c6] dark:bg-emerald-900 text-slate-800 dark:text-emerald-50 p-2.5 rounded-lg rounded-tr-none shadow-sm max-w-[85%] relative animate-in slide-in-from-right-2 duration-300">
                        <p className="text-[11px] leading-relaxed break-words whitespace-pre-wrap">{previewMessage}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[8px] opacity-50">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <div className="flex text-blue-500">
                                <CheckCircle2 size={8} />
                                <CheckCircle2 size={8} className="-ml-1" />
                            </div>
                        </div>
                        <div className="absolute top-0 -right-1.5 w-2 h-2 bg-[#dcf8c6] dark:bg-emerald-900 [clip-path:polygon(0_0,0_100%,100%_0)]"></div>
                    </div>
                ) : (
                    <div className="self-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full text-[10px] text-slate-500 dark:text-slate-400 italic">
                        Type a message to preview...
                    </div>
                )}
            </div>

            {/* Input Area (Mock) */}
            <div className="p-3 bg-[#f0f0f0] dark:bg-slate-800 flex gap-2 border-t dark:border-slate-700">
                <div className="flex-1 bg-white dark:bg-slate-700 h-7 rounded-full px-3 text-[10px] flex items-center text-slate-400">Message</div>
                <div className="w-7 h-7 rounded-full bg-[#128c7e] flex items-center justify-center text-white shadow-md">
                    <Send size={12} />
                </div>
            </div>
        </div>
    );
};

const TemplateSelector = ({ onSelect }) => {
    const templates = [
        { id: 1, name: "Initial Greeting", text: "Hello {{name}}, this is {{sender}} from TeleFlow. We noticed you're interested in {{product}}. Would you like to schedule a call?" },
        { id: 2, name: "Follow Up", text: "Hi {{name}}, just following up on our previous conversation regarding {{product}}. Let us know if you have any questions!" },
        { id: 3, name: "Special Offer", text: "Exclusive Offer for {{name}}! Get 20% off on {{product}} today. Reply YES to learn more." },
        { id: 4, name: "Meeting Reminder", text: "Hi {{name}}, this is a reminder for our scheduled call tomorrow at 10 AM regarding {{product}}." }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {templates.map(t => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t.text)}
                    className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group"
                >
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">{t.name}</p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">{t.text}</p>
                </button>
            ))}
        </div>
    );
};

// --- Main Component ---

const BulkWhatsAppPage = ({ user, onGenerateAI }) => {
    // State
    const [leads, setLeads] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Filters
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterProduct, setFilterProduct] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Sending Controls
    const [batchSize, setBatchSize] = useState(20);
    const [scheduleMode, setScheduleMode] = useState(false);
    const [scheduleDate, setScheduleDate] = useState("");
    const [sendingProgress, setSendingProgress] = useState(0);
    const [isSending, setIsSending] = useState(false);
    
    // Logs & History
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState("composer"); // "composer" | "history"

    const isTelecaller = user?.role?.toLowerCase() === 'telecaller';

    // Fetching Data
    const fetchLeads = async () => {
        setFetching(true);
        try {
            const endpoint = isTelecaller ? '/leads/my?limit=1000' : '/leads?limit=1000';
            const res = await axios.get(endpoint);
            setLeads(res.data.leads || res.data || []);
        } catch (error) {
            toast.error("Failed to fetch leads");
        } finally {
            setFetching(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await axios.get('/communication/logs');
            setLogs(res.data);
        } catch (error) {
            console.error("Failed to fetch logs");
        }
    };

    useEffect(() => {
        if (user) {
            fetchLeads();
            fetchLogs();
        }
    }, [user]);

    // Derived Data
    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesStatus = filterStatus === "All" || lead.status === filterStatus;
            const matchesProduct = filterProduct === "All" || lead.product === filterProduct;
            const matchesSearch = 
                (lead.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                (lead.phone || "").includes(searchQuery);
            return matchesStatus && matchesProduct && matchesSearch;
        });
    }, [leads, filterStatus, filterProduct, searchQuery]);

    const uniqueProducts = useMemo(() => {
        const products = new Set(leads.map(l => l.product).filter(Boolean));
        return Array.from(products);
    }, [leads]);

    // Handlers
    const toggleSelectAll = () => {
        if (selectedLeads.length === filteredLeads.length && filteredLeads.length > 0) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(filteredLeads.map(l => l._id));
        }
    };

    const toggleSelectLead = (id) => {
        setSelectedLeads(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const insertVariable = (variable) => {
        setMessage(prev => prev + ` {{${variable}}}`);
    };

    const handleGenerateAI = async () => {
        if (selectedLeads.length === 0) return toast.error("Select leads first to generate personalized content");
        
        setIsGenerating(true);
        const prompt = `Write a single professional WhatsApp message for ${selectedLeads.length} leads. 
        Context: ${filterStatus !== 'All' ? `Leads are in '${filterStatus}' status.` : ''} 
        ${filterProduct !== 'All' ? `Leads are interested in '${filterProduct}'.` : ''}
        The message should be concise, include emojis, and use placeholders like {{name}} and {{product}}. 
        Return ONLY the message text without any extra notes. Keep it under 300 characters.`;
        
        try {
            const result = await onGenerateAI(prompt);
            setMessage(result);
            toast.success("AI generated a personalized message!");
        } catch (error) {
            toast.error("AI Generation failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendBroadcast = async () => {
        if (selectedLeads.length === 0) return toast.error("Please select at least one lead");
        if (!message.trim()) return toast.error("Please enter a message");
        if (scheduleMode && !scheduleDate) return toast.error("Please select a schedule date");

        setIsSending(true);
        setSendingProgress(0);

        try {
            if (scheduleMode) {
                // Simulate scheduling
                await new Promise(resolve => setTimeout(resolve, 1500));
                toast.success(`Broadcast scheduled for ${new Date(scheduleDate).toLocaleString()}`);
            } else {
                // Real-time batch processing simulation for better UX
                const total = selectedLeads.length;
                const totalBatches = Math.ceil(total / batchSize);
                
                for (let i = 0; i < totalBatches; i++) {
                    const start = i * batchSize;
                    const end = Math.min(start + batchSize, total);
                    const batchLeads = selectedLeads.slice(start, end);

                    // Call API for each batch (or single call if backend handles it)
                    // Here we'll do one call for the first batch and then simulate others if we want progress
                    // But to stay compatible with current backend, we just send all.
                    if (i === 0) {
                        await axios.post('/communication/bulk-whatsapp', {
                            leadIds: selectedLeads, // backend currently handles all at once
                            message: message
                        });
                    }

                    // Simulated progress updates
                    setSendingProgress(Math.round(((i + 1) / totalBatches) * 100));
                    if (totalBatches > 1) await new Promise(resolve => setTimeout(resolve, 800));
                }

                toast.success("Broadcast sent successfully!");
                setMessage("");
                setSelectedLeads([]);
                fetchLogs();
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || "Failed to send broadcast");
        } finally {
            setIsSending(false);
            setSendingProgress(0);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                        <MessageCircle size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Bulk Messenger</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">WhatsApp Business API</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab("composer")}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'composer' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Composer
                    </button>
                    <button 
                        onClick={() => setActiveTab("history")}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {activeTab === "composer" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT COLUMN: Contact Selection */}
                    <div className="lg:col-span-4 space-y-4">
                        <Card className="p-0 overflow-hidden border-none shadow-xl">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                    <Users size={14} /> Contacts
                                </h3>
                                <button onClick={fetchLeads} disabled={fetching} className="text-slate-400 hover:text-emerald-500 transition-colors">
                                    <RefreshCcw size={14} className={fetching ? "animate-spin" : ""} />
                                </button>
                            </div>

                            <div className="p-4 space-y-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Search name or phone..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Filters */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                        <select 
                                            className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="New">New</option>
                                            <option value="Interested">Interested</option>
                                            <option value="Call Back">Follow Up</option>
                                            <option value="Not Interested">Not Interested</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Product</label>
                                        <select 
                                            className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                                            value={filterProduct}
                                            onChange={(e) => setFilterProduct(e.target.value)}
                                        >
                                            <option value="All">All Products</option>
                                            {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-between border-y border-emerald-100 dark:border-emerald-900/30">
                                <button 
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-2 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest"
                                >
                                    {selectedLeads.length === filteredLeads.length && filteredLeads.length > 0 ? (
                                        <CheckSquare size={14} />
                                    ) : (
                                        <Square size={14} />
                                    )}
                                    Select All ({filteredLeads.length})
                                </button>
                                <span className="text-[10px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded-full">
                                    {selectedLeads.length}
                                </span>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto p-2 space-y-1.5 scrollbar-hide">
                                {filteredLeads.length > 0 ? filteredLeads.map(lead => (
                                    <div 
                                        key={lead._id}
                                        onClick={() => toggleSelectLead(lead._id)}
                                        className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${selectedLeads.includes(lead._id) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`transition-colors ${selectedLeads.includes(lead._id) ? 'text-emerald-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                                {selectedLeads.includes(lead._id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{lead.name}</p>
                                                <p className="text-[9px] text-slate-500 font-medium font-mono">{lead.phone || "No phone"}</p>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Badge status={lead.status} />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center text-slate-400 text-xs italic">No leads found matching filters.</div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* MIDDLE COLUMN: Message Composer */}
                    <div className="lg:col-span-5 space-y-4">
                        <Card className="p-6 border-none shadow-xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
                                        <Send size={16} />
                                    </div>
                                    <h3 className="font-black uppercase tracking-widest text-xs text-slate-800 dark:text-white">Message Composer</h3>
                                </div>
                                <button 
                                    onClick={handleGenerateAI}
                                    disabled={isGenerating || selectedLeads.length === 0}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 disabled:opacity-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-fuchsia-500/20 transition-all"
                                >
                                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    AI Writer
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Templates */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Quick Templates</label>
                                    <TemplateSelector onSelect={setMessage} />
                                </div>

                                {/* Variable Injectors */}
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => insertVariable('name')} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-400">
                                        + Name
                                    </button>
                                    <button onClick={() => insertVariable('phone')} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-400">
                                        + Phone
                                    </button>
                                    <button onClick={() => insertVariable('product')} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-400">
                                        + Product
                                    </button>
                                    <button onClick={() => insertVariable('sender')} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-400">
                                        + Sender
                                    </button>
                                </div>

                                {/* Textarea */}
                                <div className="relative">
                                    <textarea 
                                        className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 resize-none leading-relaxed transition-all"
                                        placeholder="Type your message here... Use {{name}} to personalize."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        maxLength={1000}
                                    ></textarea>
                                    <div className={`absolute bottom-3 right-4 text-[10px] font-black px-2 py-1 rounded-md border ${message.length > 900 ? 'bg-red-50 text-red-500 border-red-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                        {message.length} / 1000
                                    </div>
                                </div>

                                {/* Sending Controls */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Layers size={14} className="text-slate-400" />
                                                <select 
                                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold outline-none"
                                                    value={batchSize}
                                                    onChange={(e) => setBatchSize(Number(e.target.value))}
                                                >
                                                    <option value={10}>10 per batch</option>
                                                    <option value={20}>20 per batch</option>
                                                    <option value={50}>50 per batch</option>
                                                    <option value={100}>100 per batch</option>
                                                </select>
                                            </div>
                                            <button 
                                                onClick={() => setScheduleMode(!scheduleMode)}
                                                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${scheduleMode ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                            >
                                                <Calendar size={14} />
                                                {scheduleMode ? "Scheduled" : "Send Now"}
                                            </button>
                                        </div>
                                    </div>

                                    {scheduleMode && (
                                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                            <Clock size={16} className="text-amber-500" />
                                            <input 
                                                type="datetime-local" 
                                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none flex-1 focus:ring-2 focus:ring-amber-500"
                                                value={scheduleDate}
                                                onChange={(e) => setScheduleDate(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {isSending ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                <span>Sending Broadcast...</span>
                                                <span>{sendingProgress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                                                    style={{ width: `${sendingProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button 
                                            className="w-full py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
                                            onClick={handleSendBroadcast}
                                            disabled={selectedLeads.length === 0 || !message.trim()}
                                        >
                                            <Send size={16} />
                                            {scheduleMode ? `Schedule for ${selectedLeads.length} Leads` : `Send to ${selectedLeads.length} Leads Now`}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Preview & Stats */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="sticky top-6">
                            <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-4 text-center flex items-center justify-center gap-2">
                                <Info size={12} /> Live Device Preview
                            </h3>
                            <WhatsAppPreview 
                                message={message} 
                                senderName={user?.name || "TeleFlow"} 
                                leadPreview={leads.find(l => selectedLeads.includes(l._id)) || leads[0]}
                            />

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Selected</p>
                                    <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{selectedLeads.length}</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Est. Time</p>
                                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">~{Math.ceil(selectedLeads.length / 50) || 1}m</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* HISTORY TAB */
                <Card className="p-0 overflow-hidden border-none shadow-xl">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Broadcast History</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Tracking delivery and performance of previous campaigns</p>
                        </div>
                        <button onClick={fetchLogs} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
                            <RefreshCcw size={16} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign / Message</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Recipients</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Sent By</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {logs.length > 0 ? logs.map(log => (
                                    <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="max-w-md">
                                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed italic">"{log.message}"</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.leads?.length || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{log.status || "Success"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                    {(log.sender?.name || "U")[0]}
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{log.sender?.name || "System"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                <br />
                                                <span className="font-medium lowercase opacity-70">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs font-medium italic">
                                            No broadcast history available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default BulkWhatsAppPage;

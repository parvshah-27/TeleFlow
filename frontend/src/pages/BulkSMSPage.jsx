import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { 
    MessageSquare, Send, Users, CheckSquare, Square, Filter, 
    RefreshCcw, Search, History, CheckCircle2, Sparkles, 
    Loader2, Calendar, Clock, Layers, ChevronRight, 
    X, AlertCircle, Info, Copy, Check, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- Sub-components ---

const SMSPreview = ({ message, leadPreview }) => {
    // Replace variables for preview
    const previewMessage = message
        .replace(/{{name}}/g, leadPreview?.name || "Customer")
        .replace(/{{phone}}/g, leadPreview?.phone || "9988776655")
        .replace(/{{product}}/g, leadPreview?.product || "Service")
        .replace(/{{sender}}/g, "TeleFlow");

    return (
        <div className="w-full max-w-[300px] mx-auto bg-slate-200 dark:bg-slate-900 rounded-[32px] overflow-hidden border-[10px] border-slate-800 shadow-2xl aspect-[9/16] relative flex flex-col scale-90 sm:scale-100 origin-top">
            {/* Header */}
            <div className="bg-slate-100 dark:bg-slate-800 p-3 pt-8 flex flex-col items-center gap-1 border-b dark:border-slate-700">
                <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                    <Users size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{leadPreview?.name || "Customer"}</p>
                <p className="text-[8px] text-slate-500">Text Message</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-3 flex flex-col justify-end pb-12 overflow-y-auto bg-white dark:bg-slate-950">
                {message ? (
                    <div className="self-start bg-blue-500 text-white p-2.5 rounded-2xl rounded-bl-none shadow-sm max-w-[85%] relative animate-in slide-in-from-left-2 duration-300">
                        <p className="text-[11px] leading-relaxed break-words whitespace-pre-wrap">{previewMessage}</p>
                        <div className="absolute bottom-0 -left-1.5 w-2 h-2 bg-blue-500 [clip-path:polygon(100%_0,0_100%,100%_100%)]"></div>
                    </div>
                ) : (
                    <div className="self-center text-[10px] text-slate-400 italic">
                        Type a message to preview...
                    </div>
                )}
            </div>

            {/* Input Area (Mock) */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 flex gap-2 border-t dark:border-slate-700">
                <div className="flex-1 bg-white dark:bg-slate-700 h-7 rounded-full px-3 text-[10px] flex items-center text-slate-400 border dark:border-slate-600">iMessage</div>
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md">
                    <ArrowUp size={12} />
                </div>
            </div>
        </div>
    );
};

const ArrowUp = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
);

const TemplateSelector = ({ onSelect }) => {
    const templates = [
        { id: 1, name: "Quick Greeting", text: "Hello {{name}}, this is TeleFlow. We noticed your interest in {{product}}. Can we talk?" },
        { id: 2, name: "Follow Up", text: "Hi {{name}}, just following up on your request for {{product}}. Any questions for us?" },
        { id: 3, name: "Limited Offer", text: "Hi {{name}}! Get a special deal on {{product}} today only. Visit us now!" },
        { id: 4, name: "Remind Call", text: "Hi {{name}}, we'll call you shortly regarding {{product}}. Hope you're available!" }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {templates.map(t => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t.text)}
                    className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                >
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{t.name}</p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">{t.text}</p>
                </button>
            ))}
        </div>
    );
};

// --- Main Component ---

const BulkSMSPage = ({ user, onGenerateAI }) => {
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
            // Filter only SMS logs
            setLogs(res.data.filter(log => log.type === 'SMS'));
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
        const prompt = `Write a professional SMS for ${selectedLeads.length} leads. 
        Context: ${filterStatus !== 'All' ? `Leads are in '${filterStatus}' status.` : ''} 
        ${filterProduct !== 'All' ? `Leads are interested in '${filterProduct}'.` : ''}
        The message should be concise, professional, and use placeholders like {{name}} and {{product}}. 
        Keep it under 160 characters for a single SMS segment.`;
        
        try {
            const result = await onGenerateAI(prompt);
            setMessage(result);
            toast.success("AI generated a personalized SMS!");
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
                toast.success(`SMS Broadcast scheduled for ${new Date(scheduleDate).toLocaleString()}`);
            } else {
                // Bulk SMS API Call
                const response = await axios.post('/communication/bulk-sms', {
                    leadIds: selectedLeads,
                    message: message
                });

                toast.success(response.data.msg || "SMS Broadcast sent successfully!");
                setMessage("");
                setSelectedLeads([]);
                fetchLogs();
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || "Failed to send SMS broadcast");
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
                    <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">SMS Messenger</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Twilio SMS Gateway</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab("composer")}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'composer' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Composer
                    </button>
                    <button 
                        onClick={() => setActiveTab("history")}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
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
                                <button onClick={fetchLeads} disabled={fetching} className="text-slate-400 hover:text-blue-500 transition-colors">
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
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Filters */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                        <select 
                                            className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-blue-500 font-bold"
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
                                            className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                            value={filterProduct}
                                            onChange={(e) => setFilterProduct(e.target.value)}
                                        >
                                            <option value="All">All Products</option>
                                            {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 flex items-center justify-between border-y border-blue-100 dark:border-blue-900/30">
                                <button 
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-2 text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest"
                                >
                                    {selectedLeads.length === filteredLeads.length && filteredLeads.length > 0 ? (
                                        <CheckSquare size={14} />
                                    ) : (
                                        <Square size={14} />
                                    )}
                                    Select All ({filteredLeads.length})
                                </button>
                                <span className="text-[10px] font-black text-white bg-blue-500 px-2 py-0.5 rounded-full">
                                    {selectedLeads.length}
                                </span>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto p-2 space-y-1.5 scrollbar-hide">
                                {filteredLeads.length > 0 ? filteredLeads.map(lead => (
                                    <div 
                                        key={lead._id}
                                        onClick={() => toggleSelectLead(lead._id)}
                                        className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${selectedLeads.includes(lead._id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`transition-colors ${selectedLeads.includes(lead._id) ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
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
                                    <h3 className="font-black uppercase tracking-widest text-xs text-slate-800 dark:text-white">SMS Composer</h3>
                                </div>
                                <button 
                                    onClick={handleGenerateAI}
                                    disabled={isGenerating || selectedLeads.length === 0}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 disabled:opacity-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 transition-all"
                                >
                                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    AI Writer
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Templates */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">SMS Templates</label>
                                    <TemplateSelector onSelect={setMessage} />
                                </div>

                                {/* Variable Injectors */}
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => insertVariable('name')} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-400">
                                        + Name
                                    </button>
                                    <button onClick={() => insertVariable('product')} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-400">
                                        + Product
                                    </button>
                                </div>

                                {/* Textarea */}
                                <div className="relative">
                                    <textarea 
                                        className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 resize-none leading-relaxed transition-all"
                                        placeholder="Type your SMS here... Use {{name}} to personalize."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        maxLength={500}
                                    ></textarea>
                                    <div className={`absolute bottom-3 right-4 text-[10px] font-black px-2 py-1 rounded-md border ${message.length > 160 ? 'bg-amber-50 text-amber-500 border-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                        {message.length} / {Math.ceil(message.length / 160)} segment(s)
                                    </div>
                                </div>

                                {/* Sending Controls */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                                    <Button 
                                        className="w-full py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
                                        onClick={handleSendBroadcast}
                                        disabled={selectedLeads.length === 0 || !message.trim() || isSending}
                                    >
                                        {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        {isSending ? "Sending..." : `Send SMS to ${selectedLeads.length} Leads`}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Preview & Stats */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="sticky top-6">
                            <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-4 text-center flex items-center justify-center gap-2">
                                <Info size={12} /> SMS Device Preview
                            </h3>
                            <SMSPreview 
                                message={message} 
                                leadPreview={leads.find(l => selectedLeads.includes(l._id)) || leads[0]}
                            />

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Selected</p>
                                    <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{selectedLeads.length}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-900/30">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Segments</p>
                                    <p className="text-2xl font-black text-slate-700 dark:text-slate-400">{Math.ceil(message.length / 160) || 1}</p>
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
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">SMS Broadcast History</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Tracking delivery of previous SMS campaigns</p>
                        </div>
                        <button onClick={fetchLogs} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
                            <RefreshCcw size={16} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Message</th>
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
                                                <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'Success' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-[0_0_5px_rgba(16,185,129,0.5)]`}></div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${log.status === 'Success' ? 'text-emerald-600' : 'text-amber-600'}`}>{log.status || "Success"}</span>
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
                                            No SMS broadcast history available.
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

export default BulkSMSPage;

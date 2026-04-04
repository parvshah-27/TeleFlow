import React, { useState, useEffect } from 'react';
import axios from "../api/axios";
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import PhoneMask from '../components/PhoneMask';
import EmailMask from '../components/EmailMask';
import { Briefcase, PhoneCall, Clock, Sparkles, Wand2, Loader2, TrendingUp, ChevronRight, RefreshCcw, Phone, MessageSquare, Calendar, Eye, EyeOff, Users, Copy, XCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const TelecallerDashboard = ({
    user,
    filteredLeads,
    searchQuery,
    setSearchQuery,
    handleSelectLead,
    selectedLead,
    updateForm,
    setUpdateForm,
    handleLogCall,
    handleRefineNotes,
    isRefining,
    pagination,
    fetchLeads,
    dashboardStats,
    scripts
}) => {
    const [callHistory, setCallHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [revealedLeads, setRevealedLeads] = useState(new Set());
    const [activeScriptIdx, setActiveScriptIdx] = useState(0);

    const [showScriptModal, setShowScriptModal] = useState(false);

    const personalizeScript = (content, lead) => {
        if (!content) return "";
        return content
            .replace(/{{name}}/g, lead.name || lead.Name || "Customer")
            .replace(/{{product}}/g, lead.product || lead.Product || "our product")
            .replace(/{{price}}/g, lead.price || lead.Price || "TBD")
            .replace(/{{last_call}}/g, lead.callbackDate ? new Date(lead.callbackDate).toLocaleDateString() : "no previous call")
            .replace(/{{sender}}/g, user.name || "Telecaller");
    };

    const handleWhatsApp = (scriptContent, lead) => {
        const phone = lead.phone || lead.Phone;
        if (!phone) return toast.error("No phone number found");
        
        const message = personalizeScript(scriptContent, lead);
        const encodedMsg = encodeURIComponent(message);
        
        // Remove spaces and special chars from phone
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Script copied to clipboard!");
    };

    const toggleReveal = (leadId) => {
        setRevealedLeads(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) next.delete(leadId);
            else next.add(leadId);
            return next;
        });
    };

    const toggleRevealAll = () => {
        if (revealedLeads.size === (filteredLeads?.length || 0)) {
            setRevealedLeads(new Set());
        } else {
            setRevealedLeads(new Set(filteredLeads.map(l => l._id)));
        }
    };

    useEffect(() => {
        if (selectedLead && scripts && scripts.length > 0) {
            setShowScriptModal(true);
        }
    }, [selectedLead, scripts]);

    useEffect(() => {
        if (dashboardStats?.callsCompleted === 10) {
            toast.success("🏆 Milestone Reached: 10 Calls Today! Keep it up!", {
                duration: 5000,
                icon: '🔥',
            });
        }
    }, [dashboardStats?.callsCompleted]);

    useEffect(() => {
        if (selectedLead) {
            setLoadingHistory(true);
            axios.get(`/calls/history/${selectedLead._id}`)
                .then(res => {
                    setCallHistory(res.data);
                    setLoadingHistory(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoadingHistory(false);
                });
        } else {
            setCallHistory([]);
        }
    }, [selectedLead]);


    const completionPercentage = dashboardStats?.totalAssigned > 0 ? Math.round((dashboardStats.callsCompleted / dashboardStats.totalAssigned) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Script Modal */}
            {showScriptModal && selectedLead && scripts && scripts.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="bg-fuchsia-600 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Let's Pitch</h3>
                                    <p className="text-[10px] text-fuchsia-100 font-bold uppercase tracking-tighter opacity-80">Personalized for {selectedLead.name || selectedLead.Name}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowScriptModal(false)}
                                className="p-2 hover:bg-white/10 text-white rounded-full transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={14} className="text-fuchsia-500" />
                                    {scripts[activeScriptIdx]?.title}
                                </h4>
                                {scripts.length > 1 && (
                                    <div className="flex gap-1.5">
                                        {scripts.map((_, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setActiveScriptIdx(idx)}
                                                className={`w-2 h-2 rounded-full transition-all ${activeScriptIdx === idx ? 'bg-fuchsia-500 w-4' : 'bg-slate-200 dark:bg-slate-700'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 relative">
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic font-medium">
                                    "{personalizeScript(scripts[activeScriptIdx]?.content, selectedLead)}"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <button 
                                    onClick={() => handleWhatsApp(scripts[activeScriptIdx]?.content, selectedLead)}
                                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                >
                                    <MessageSquare size={16} />
                                    WhatsApp
                                </button>
                                <button 
                                    onClick={() => copyToClipboard(personalizeScript(scripts[activeScriptIdx]?.content, selectedLead))}
                                    className="flex items-center justify-center gap-2 bg-slate-800 dark:bg-white dark:text-slate-900 text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-800/20 transition-all active:scale-95"
                                >
                                    <Copy size={16} />
                                    Copy Script
                                </button>
                            </div>
                            
                            <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest">
                                Assigned by {scripts[activeScriptIdx]?.createdBy?.name || "Manager"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stats-grid">
                <StatCard
                    title="Today's Target"
                    value={dashboardStats?.todaysTarget || 0}
                    icon={Briefcase}
                    trend="Total Assigned"
                    trendUp={true}
                />
                <StatCard
                    title="Leads Remaining"
                    value={dashboardStats?.leadsRemaining || 0}
                    icon={Clock}
                    trend="Target Remaining"
                    trendUp={false}
                />
                <StatCard
                    title="Calls Completed"
                    value={dashboardStats?.callsCompleted || 0}
                    icon={PhoneCall}
                    trend={`${completionPercentage}% Done`}
                    trendUp={true}
                />
                <StatCard
                    title="Follow Ups"
                    value={dashboardStats?.followUps || 0}
                    icon={Calendar}
                    trend={`${dashboardStats?.overdueFollowUps || 0} Overdue`}
                    trendUp={false}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* LEFT SIDEBAR: Performance, Logger, and History */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Suggested Script Trigger Card */}
                    {selectedLead && scripts && scripts.length > 0 && (
                        <Card className="p-4 border-none shadow-xl bg-gradient-to-br from-fuchsia-600 to-purple-700 text-white overflow-hidden relative group cursor-pointer" onClick={() => setShowScriptModal(true)}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <FileText size={48} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={14} className="text-fuchsia-200" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest">Active Pitch</h3>
                                </div>
                                <p className="text-xs font-bold line-clamp-1 mb-3">{scripts[activeScriptIdx]?.title}</p>
                                <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-all">
                                    <Eye size={12} /> View Script
                                </button>
                            </div>
                        </Card>
                    )}

                    <Card className="log-call-section">
                        <div className="mb-4">
                            <h3 className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-1">Log a Call for</h3>
                            {selectedLead ? (
                                <div className="text-lg font-bold text-slate-800 dark:text-white truncate">
                                    {selectedLead.name || selectedLead.Name}
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 italic">No lead selected</div>
                            )}
                        </div>
                        <form className="space-y-4" onSubmit={(e) => handleLogCall(e, scripts[activeScriptIdx]?._id)}>
                            <div>
                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Status</label>
                                <select
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                                    value={updateForm.status}
                                    onChange={(e) => {
                                        const newStatus = e.target.value;
                                        let newDate = updateForm.followUpDate;

                                        if (newStatus === "Call Back" && !newDate) {
                                            const tomorrow = new Date();
                                            tomorrow.setHours(tomorrow.getHours() + 24);
                                            newDate = tomorrow.toISOString().slice(0, 16);
                                        }

                                        setUpdateForm({ ...updateForm, status: newStatus, followUpDate: newDate });
                                    }}
                                >
                                    <option>New</option>
                                    <option>Interested</option>
                                    <option>Not Interested</option>
                                    <option>Call Back</option>
                                    <option>Wrong Number</option>
                                </select>
                            </div>
                            <div className="relative group">
                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Notes</label>
                                <textarea
                                    value={updateForm.notes}
                                    onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs h-20 text-slate-900 dark:text-white outline-none resize-none"
                                    placeholder="Details..."
                                ></textarea>
                                <button
                                    onClick={handleRefineNotes}
                                    disabled={isRefining || !updateForm.notes}
                                    className="absolute bottom-2 right-2 p-1.5 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                    title="Refine with AI"
                                >
                                    {isRefining ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                </button>
                            </div>
                            <div>
                                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">Follow-up</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                                    value={updateForm.followUpDate}
                                    onChange={(e) => setUpdateForm({ ...updateForm, followUpDate: e.target.value })}
                                />
                            </div>
                            <Button className="w-full py-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20" type="submit" disabled={!selectedLead}>Log Call</Button>
                        </form>
                    </Card>

                    {selectedLead && (
                        <Card className="max-h-64 overflow-y-auto">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-sm flex items-center gap-2">
                                <Clock size={14} className="text-slate-400" />
                                Activity History
                            </h3>
                            {loadingHistory ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-600" size={16} /></div>
                            ) : callHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {callHistory.map((log) => (
                                        <div key={log._id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
                                            <div className="flex justify-between items-center mb-1">
                                                <Badge status={log.status} />
                                                <span className="text-[9px] text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 italic mt-1 line-clamp-2 leading-relaxed">"{log.notes}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] text-slate-400 text-center py-4 italic">No previous interactions found.</p>
                            )}
                        </Card>
                    )}
                </div>

                {/* MAIN CONTENT: Active Leads */}
                <div className="lg:col-span-3 space-y-6 leads-section">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Active Leads</h2>
                            <button onClick={() => fetchLeads(pagination?.currentPage || 1, searchQuery)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                <RefreshCcw size={16} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={toggleRevealAll}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${revealedLeads.size === (filteredLeads?.length || 0) && (filteredLeads?.length || 0) > 0 ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500'}`}
                                title={revealedLeads.size === (filteredLeads?.length || 0) && (filteredLeads?.length || 0) > 0 ? "Hide All Details" : "Reveal All Details"}
                            >
                                {revealedLeads.size === (filteredLeads?.length || 0) && (filteredLeads?.length || 0) > 0 ? <EyeOff size={14} /> : <Eye size={14} />}
                                <span>{revealedLeads.size === (filteredLeads?.length || 0) && (filteredLeads?.length || 0) > 0 ? "Hide All" : "Reveal All"}</span>
                            </button>
                            <input
                                type="text"
                                placeholder="Filter leads..."
                                className="pl-4 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm w-64 text-slate-900 dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <Card className="p-0 overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-2 font-black text-[10px] uppercase tracking-widest">Customer</th>
                                        <th className="px-4 py-2 font-black text-[10px] uppercase tracking-widest text-center">Contact</th>
                                        <th className="px-4 py-2 font-black text-[10px] uppercase tracking-widest text-center">Status</th>
                                        <th className="px-4 py-2 font-black text-[10px] uppercase tracking-widest text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {(filteredLeads || []).map((lead) => (
                                        <tr key={lead._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-4 py-2">
                                                <div className="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{lead.name || lead.Name}</div>
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    <EmailMask 
                                                        email={lead.email || lead.Email} 
                                                        isRevealed={revealedLeads.has(lead._id)} 
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex justify-center">
                                                    {(lead.phone || lead.Phone) && (
                                                        <PhoneMask 
                                                            phone={lead.phone || lead.Phone} 
                                                            name={lead.name || lead.Name} 
                                                            user={user} 
                                                            isRevealed={revealedLeads.has(lead._id)}
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <Badge status={lead.status} />
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <div className="flex justify-end gap-2 items-center">
                                                    <Button
                                                        variant="primary"
                                                        className="py-1.5 px-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md shadow-blue-500/10"
                                                        onClick={() => handleSelectLead(lead)}
                                                    >
                                                        Select
                                                    </Button>

                                                    <button 
                                                        onClick={() => toggleReveal(lead._id)}
                                                        className={`p-2 rounded-lg transition-all border ${revealedLeads.has(lead._id) ? 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' : 'text-slate-400 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:text-slate-600'}`}
                                                        title={revealedLeads.has(lead._id) ? "Hide Details" : "Reveal Details"}
                                                    >
                                                        {revealedLeads.has(lead._id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {pagination?.totalPages > 1 && (
                            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {pagination.currentPage} of {pagination.totalPages}</span>
                                <div className="flex gap-2">
                                    <Button variant="secondary" className="py-1 px-3 text-[10px] font-black uppercase tracking-widest" disabled={pagination.currentPage === 1} onClick={() => fetchLeads(pagination.currentPage - 1, searchQuery)}>Prev</Button>
                                    <Button variant="secondary" className="py-1 px-3 text-[10px] font-black uppercase tracking-widest" disabled={pagination.currentPage === pagination.totalPages} onClick={() => fetchLeads(pagination.currentPage + 1, searchQuery)}>Next</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TelecallerDashboard;

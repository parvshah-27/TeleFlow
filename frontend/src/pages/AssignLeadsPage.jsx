import React, { useState, useEffect } from 'react';
import axios from "../api/axios";
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Users, UserCheck, RefreshCcw } from 'lucide-react';

const AssignLeadsPage = () => {
    const [leads, setLeads] = useState([]);
    const [view, setView] = useState("unassigned"); // "unassigned", "assigned", or "all"
    const [telecallers, setTelecallers] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [selectedTelecaller, setSelectedTelecaller] = useState("");
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalLeads: 0 });
    const [summary, setSummary] = useState({ total: 0, unassigned: 0, assigned: 0 });

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            let endpoint = `/leads?page=${page}&limit=10`;
            if (view === "unassigned") endpoint = `/leads/unassigned?page=${page}&limit=10`;
            else if (view === "assigned") endpoint = `/leads/assigned?page=${page}&limit=10`;
            
            const res = await axios.get(endpoint);
            // Handle both paginated and non-paginated responses for backward compatibility
            if (res.data && res.data.leads && Array.isArray(res.data.leads)) {
                setLeads(res.data.leads);
                setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalLeads: res.data.leads.length });
                if (res.data.summary) setSummary(res.data.summary);
            } else if (Array.isArray(res.data)) {
                setLeads(res.data);
                setPagination({ currentPage: 1, totalPages: 1, totalLeads: res.data.length });
            } else {
                setLeads([]);
                setPagination({ currentPage: 1, totalPages: 1, totalLeads: 0 });
            }

            const tcRes = await axios.get("/admin/telecallers");
            setTelecallers(tcRes.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1);
        setSelectedLeads([]);
    }, [view]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchData(newPage);
            setSelectedLeads([]);
        }
    };

    const handleAssignLeads = async () => {
        if (selectedLeads.length === 0 || !selectedTelecaller) {
            toast.error("Please select at least one lead and a telecaller.");
            return;
        }

        try {
            await Promise.all(selectedLeads.map(leadId =>
                axios.post("/leads/assign", { leadId, telecallerId: selectedTelecaller })
            ));

            toast.success(view === "unassigned" ? "Leads assigned successfully!" : "Leads reassigned successfully!");
            fetchData();
            setSelectedLeads([]);
        } catch (error) {
            toast.error("Failed to process leads.");
            console.error("Error processing leads:", error);
        }
    };

    const handleAutoAssign = async () => {
        if (!window.confirm("This will automatically distribute ALL unassigned leads among active telecallers. Continue?")) return;

        try {
            const res = await axios.post("/leads/bulk-assign");
            toast.success(res.data.msg);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.msg || "Auto-assignment failed.");
        }
    };

    const toggleLeadSelection = (leadId) => {
        setSelectedLeads(prev =>
            prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
        );
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedLeads(leads.map(l => l._id));
        } else {
            setSelectedLeads([]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Users className="text-blue-600" size={24} />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-wrap">Lead Assignment</h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="secondary"
                        className="flex items-center gap-2 border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        onClick={handleAutoAssign}
                    >
                        <RefreshCcw size={16} />
                        Auto-Assign
                    </Button>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setView("unassigned")}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${view === "unassigned" ? "bg-white dark:bg-slate-700 shadow text-blue-600" : "text-slate-500"}`}
                        >
                            Unassigned
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${view === "unassigned" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-slate-200 dark:bg-slate-700 text-slate-600"}`}>
                                {summary.unassigned}
                            </span>
                        </button>
                        <button
                            onClick={() => setView("assigned")}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${view === "assigned" ? "bg-white dark:bg-slate-700 shadow text-blue-600" : "text-slate-500"}`}
                        >
                            Assigned
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${view === "assigned" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-slate-200 dark:bg-slate-700 text-slate-600"}`}>
                                {summary.assigned}
                            </span>
                        </button>
                        <button
                            onClick={() => setView("all")}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${view === "all" ? "bg-white dark:bg-slate-700 shadow text-blue-600" : "text-slate-500"}`}
                        >
                            All Leads
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${view === "all" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-slate-200 dark:bg-slate-700 text-slate-600"}`}>
                                {summary.total}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300"
                                                checked={leads.length > 0 && selectedLeads.length === leads.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-4 font-medium text-wrap">Customer</th>
                                        <th className="px-6 py-4 font-medium text-wrap">Assigned To</th>
                                        <th className="px-6 py-4 font-medium text-wrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-slate-400">Loading leads...</td>
                                        </tr>
                                    ) : leads.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-slate-400">No leads found in this view.</td>
                                        </tr>
                                    ) : leads.map((lead) => (
                                        <tr key={lead._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300"
                                                    checked={selectedLeads.includes(lead._id)}
                                                    onChange={() => toggleLeadSelection(lead._id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800 dark:text-slate-200">{lead.name || "N/A"}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{lead.phone || "N/A"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {lead.assignedTo ? (
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck size={14} className="text-green-500" />
                                                        <span className="text-slate-900 dark:text-white font-medium">{lead.assignedTo.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4"><Badge status={lead.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {pagination.totalPages > 1 && (
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div className="text-xs text-slate-500">
                                    Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalLeads} total leads)
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={pagination.currentPage === 1 || loading}
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={pagination.currentPage === pagination.totalPages || loading}
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Assign to Telecaller</h3>
                        <p className="text-xs text-slate-500 mb-6">Select one or more leads from the list and choose a telecaller to assign them to.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Select Telecaller</label>
                                <select
                                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                    value={selectedTelecaller}
                                    onChange={(e) => setSelectedTelecaller(e.target.value)}
                                >
                                    <option value="">Choose a telecaller...</option>
                                    {telecallers.map(tc => (
                                        <option key={tc._id} value={tc._id}>{tc.name} ({tc.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2">
                                <p className="text-xs text-slate-400 mb-3">{selectedLeads.length} lead(s) selected</p>
                                <Button
                                    className="w-full"
                                    onClick={handleAssignLeads}
                                    disabled={selectedLeads.length === 0 || !selectedTelecaller}
                                >
                                    {view === "unassigned" ? "Assign Leads" : "Reassign Leads"}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                        <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">Pro Tip</h4>
                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                            Use the "Auto-Assign" feature to quickly and fairly distribute all currently unassigned leads among your active telecallers using a round-robin system.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AssignLeadsPage;

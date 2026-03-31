import React, { useState, useEffect } from 'react';
import axios from "../api/axios";
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import { CheckCircle, XCircle, UserCheck, MessageSquare, ShieldCheck } from 'lucide-react';

const VerificationPage = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalLeads: 0 });

    const fetchLeads = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(`/leads/for-verification?page=${page}&limit=10`);
            if (res.data.leads) {
                setLeads(res.data.leads);
                setPagination(res.data.pagination);
            } else {
                setLeads(res.data);
                setPagination({ currentPage: 1, totalPages: 1, totalLeads: res.data.length });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load leads for verification.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads(1);
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchLeads(newPage);
        }
    };

    const handleVerify = async (leadId, status) => {
        try {
            await axios.put(`/leads/verify/${leadId}`, { status });
            // Refresh current page
            fetchLeads(pagination.currentPage);
            toast.success(`Lead successfully ${status.toLowerCase()}!`);
        } catch (error) {
            toast.error("Failed to update lead status.");
            console.error("Error verifying lead:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <ShieldCheck className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Lead Verification</h2>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-medium">Customer Details</th>
                                <th className="px-6 py-4 font-medium">Last Interaction</th>
                                <th className="px-6 py-4 font-medium">Assigned To</th>
                                <th className="px-6 py-4 font-medium text-right">Decision</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400">Loading leads...</td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400">No leads currently pending verification.</td>
                                </tr>
                            ) : leads.map((lead) => (
                                <tr key={lead._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 dark:text-white">
                                            {lead.name || lead.Name || "N/A"}
                                        </div>
                                        <div className="text-xs text-slate-500">{lead.email || lead.Email || "No Email"}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2 max-w-xs">
                                            <MessageSquare size={14} className="mt-0.5 text-slate-400 flex-shrink-0" />
                                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                                                {lead.notes ? `"${lead.notes}"` : "No notes provided"}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <UserCheck size={14} className="text-blue-500" />
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                {lead.assignedTo?.name || "N/A"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleVerify(lead._id, "Verified")}
                                                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg transition-colors"
                                                title="Approve & Verify"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleVerify(lead._id, "Rejected")}
                                                className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg transition-colors"
                                                title="Reject Lead"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalLeads} leads)
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
    );
};

export default VerificationPage;

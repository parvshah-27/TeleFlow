import React, { useState, useEffect } from 'react';
import axios from "../api/axios";
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import Card from '../components/Card';
import SimpleBarChart from '../components/SimpleBarChart';
import Badge from '../components/Badge';
import { Briefcase, PhoneCall, FileText, PieChart, Download, Users, BarChart2 } from 'lucide-react';
import { Parser } from '@json2csv/plainjs';

const ManagerDashboard = () => {
    const [stats, setStats] = useState({
        teamTarget: 0,
        callsToday: 0,
        pendingLeads: 0,
        totalLeads: 0,
        conversionRate: 0,
        teamPerformance: [],
        leadStatusDistribution: []
    });
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchStats = () => {
            axios.get("/leads/manager-dashboard-stats")
                .then(res => {
                    setStats(res.data);
                })
                .catch(err => {
                    console.error("Error fetching manager dashboard stats:", err);
                    if (stats.totalLeads === 0) toast.error("Failed to fetch manager dashboard stats.");
                });
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await axios.get("/leads"); // Fetch all leads for export
            const leads = res.data;

            if (!leads || leads.length === 0) {
                toast.error("No leads found to export.");
                return;
            }

            const fields = ['name', 'email', 'phone', 'product', 'status', 'notes'];
            const opts = { fields };
            const parser = new Parser(opts);
            const csv = parser.parse(leads);

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `team_leads_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Leads exported successfully!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export leads.");
        } finally {
            setExporting(false);
        }
    };

    // Transform data for SimpleBarChart
    const callsData = (stats?.teamPerformance || []).map(item => {
        const perPersonTarget = (stats?.teamTarget / (stats?.teamPerformance?.length || 1)) || 50;
        return {
            label: item?.name || "Unknown",
            value: Math.min(100, Math.round((item?.calls / perPersonTarget) * 100)),
            actual: item?.calls || 0
        };
    });

    const statusData = (stats?.leadStatusDistribution || []).map(item => ({
        label: item?._id || "Unknown",
        value: Math.round((item?.count / (stats?.totalLeads || 1)) * 100),
        actual: item?.count || 0
    }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manager Dashboard</h2>
                <Button
                    icon={Download}
                    onClick={handleExport}
                    disabled={exporting}
                >
                    {exporting ? "Exporting..." : "Export Leads (CSV)"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* <StatCard title="Team Target (Today)" value={stats?.teamTarget || 0} icon={Briefcase} trend="All Telecallers" trendUp={true} /> */}
                <StatCard title="Calls Made (Today)" value={stats?.callsToday || 0} icon={PhoneCall} trend="Across Team" trendUp={true} />
                <StatCard title="Pending Leads" value={`${stats?.pendingLeads || 0} / ${stats?.totalLeads || 0}`} icon={FileText} trend="Unassigned / Total" trendUp={false} />
                <StatCard title="Conversion Rate" value={`${stats?.conversionRate || 0}%`} icon={PieChart} trend="All Time" trendUp={true} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Individual Progress (% of Daily Target)" icon={Users}>
                    {callsData.length > 0 ? (
                        <div className="space-y-4">
                            <SimpleBarChart data={callsData} color="bg-indigo-500" />
                        </div>
                    ) : (
                        <p className="text-center py-10 text-slate-400">No call data available for today.</p>
                    )}
                </Card>

                <Card title="Lead Status Distribution" icon={BarChart2}>
                    {statusData.length > 0 ? (
                        <div className="space-y-4">
                            <SimpleBarChart data={statusData} color="bg-emerald-500" />
                        </div>
                    ) : (
                        <p className="text-center py-10 text-slate-400">No lead data available.</p>
                    )}
                </Card>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white">Team Performance (Today)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-medium">Telecaller</th>
                                <th className="px-6 py-4 font-medium text-center">Calls Made</th>
                                <th className="px-6 py-4 font-medium text-center">Interested</th>
                                <th className="px-6 py-4 font-medium text-center">Total Assigned</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {(stats?.teamPerformance || []).map((tc, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{tc?.name || "N/A"}</td>
                                    <td className="px-6 py-4 text-center">{tc?.calls || 0}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-emerald-600 font-semibold">{tc?.interested || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">{tc?.totalAssigned || 0}</td>
                                    <td className="px-6 py-4">
                                        <Badge status={tc?.status || "Active"} />
                                    </td>
                                </tr>
                            ))}
                            {(stats?.teamPerformance || []).length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                                        No telecallers found in the team.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;

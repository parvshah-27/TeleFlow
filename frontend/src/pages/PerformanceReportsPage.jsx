import React, { useState, useEffect } from 'react';
import axios from "../api/axios";
import Card from '../components/Card';
import SimpleBarChart from '../components/SimpleBarChart';

const COLORS = {
    primary: "bg-blue-600",
    primaryHover: "hover:bg-blue-700",
    primaryText: "text-blue-600 dark:text-blue-400",
    success: "text-green-500",
    danger: "text-red-500",
    warning: "text-amber-500",
    bg: "bg-slate-50",
    ai: "bg-gradient-to-r from-violet-500 to-fuchsia-500",
    aiText: "text-fuchsia-600 dark:text-fuchsia-400",
};

const PerformanceReportsPage = () => {
    const [stats, setStats] = useState({
        callsPerTelecaller: [],
        leadStatusDistribution: [],
    });

    useEffect(() => {
        axios.get("/leads/manager-dashboard-stats")
            .then(res => setStats(res.data))
            .catch(err => console.error(err));
    }, []);

    const barChartData = stats.callsPerTelecaller.map(item => ({
        label: item.name,
        value: item.calls,
    }));

    const pieChartData = stats.leadStatusDistribution.map(item => ({
        status: item._id,
        count: item.count,
    }));
    const totalLeads = pieChartData.reduce((acc, item) => acc + item.count, 0);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Performance Reports</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white">Calls per Telecaller (Today)</h3>
                    </div>
                    <SimpleBarChart data={barChartData} />
                </Card>
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white">Lead Status Distribution</h3>
                    </div>
                    <div className="flex items-center justify-center h-48 gap-8">
                        <div className="relative w-32 h-32 rounded-full border-8 border-blue-500" style={{ borderRightColor: '#f59e0b', borderBottomColor: '#10b981', borderLeftColor: '#ef4444' }}></div>
                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            {pieChartData.map(item => (
                                <div key={item.status} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 bg-${COLORS[item.status.toLowerCase().replace(" ", "-")] || "gray"}-500 rounded-full`}></div>
                                    {item.status} ({totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0}%)
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PerformanceReportsPage;

import React, { useState, useEffect } from 'react';
import axios from "../api/axios";
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { 
    Briefcase, PhoneCall, Clock, Calendar, 
    TrendingUp, Award, Target, CheckCircle2, 
    AlertCircle, ArrowRight, BarChart3, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PerformanceOverviewPage = () => {
    const [stats, setStats] = useState({
        todaysTarget: 0,
        callsCompleted: 0,
        followUps: 0,
        leadsRemaining: 0,
        pendingLeads: 0,
        overdueFollowUps: 0,
        totalAssigned: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/leads/dashboard-stats");
            setStats(res.data);
        } catch (err) {
            console.error("Stats error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const completionPercentage = stats.totalAssigned > 0 
        ? Math.round((stats.callsCompleted / stats.totalAssigned) * 100) 
        : 0;

    return (
        <div className="space-y-8 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-600 rounded-3xl text-white shadow-lg shadow-blue-600/20">
                        <Award size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Performance Tracking</h2>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time metrics & daily goals</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Score</p>
                        <p className="text-2xl font-black text-blue-600">{completionPercentage}%</p>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle 
                                cx="32" cy="32" r="28" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="4" 
                                className="text-blue-600"
                                strokeDasharray={175.9}
                                strokeDashoffset={175.9 - (175.9 * completionPercentage) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <Zap size={20} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Daily Target"
                    value={stats.todaysTarget}
                    icon={Target}
                    trend="Leads Assigned"
                    trendUp={true}
                    className="hover:scale-[1.02] transition-transform cursor-default"
                />
                <StatCard
                    title="Pending Work"
                    value={stats.leadsRemaining}
                    icon={Clock}
                    trend="Queue Size"
                    trendUp={false}
                    className="hover:scale-[1.02] transition-transform cursor-default"
                />
                <StatCard
                    title="Success Rate"
                    value={stats.callsCompleted}
                    icon={CheckCircle2}
                    trend={`${completionPercentage}% Daily Goal`}
                    trendUp={true}
                    className="hover:scale-[1.02] transition-transform cursor-default"
                />
                <StatCard
                    title="Active Follow-ups"
                    value={stats.followUps}
                    icon={Calendar}
                    trend={`${stats.overdueFollowUps} Overdue`}
                    trendUp={false}
                    className="hover:scale-[1.02] transition-transform cursor-default"
                />
            </div>

            {/* Detailed Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-8 border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
                        <BarChart3 size={150} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <TrendingUp className="text-emerald-500" />
                            Daily Goal Progress
                        </h3>
                        
                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Call Completion</span>
                                    <span className="text-sm font-black text-blue-600">{stats.callsCompleted} / {stats.totalAssigned}</span>
                                </div>
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all duration-1000 ease-out"
                                        style={{ width: `${completionPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue Status</p>
                                    <p className="text-xl font-black text-slate-800 dark:text-white">
                                        {stats.leadsRemaining > 0 ? "In Progress" : "All Caught Up!"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`w-2 h-2 rounded-full ${stats.leadsRemaining > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                        <span className="text-xs font-bold text-slate-500">{stats.leadsRemaining} Leads left to call</span>
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Callback Status</p>
                                    <p className="text-xl font-black text-slate-800 dark:text-white">
                                        {stats.overdueFollowUps > 0 ? "Attention Needed" : "On Track"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`w-2 h-2 rounded-full ${stats.overdueFollowUps > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                        <span className="text-xs font-bold text-slate-500">{stats.overdueFollowUps} Overdue scheduled</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 border-none shadow-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
                        <Briefcase size={80} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                            <Zap className="text-yellow-300" />
                            Next Steps
                        </h3>
                        <p className="text-blue-50 text-sm leading-relaxed mb-8 opacity-90">
                            You're currently {completionPercentage}% through your daily goal. Focus on completing your pending leads to reach 100%.
                        </p>
                        <div className="mt-auto space-y-3">
                            <Link to="/" className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all group">
                                <span className="text-xs font-black uppercase tracking-widest">Go to Worklist</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/followups" className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all group">
                                <span className="text-xs font-black uppercase tracking-widest">View Follow-ups</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PerformanceOverviewPage;
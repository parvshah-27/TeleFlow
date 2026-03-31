import React, { useState, useEffect } from 'react';
import axios from "../api/axios";
import Card from '../components/Card';
import Badge from '../components/Badge';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
    AreaChart, Area,
    LabelList
} from 'recharts';
import { 
    TrendingUp, ArrowUpDown, Calendar, PhoneCall, 
    ChevronLeft, Clock, Search, AlertCircle, BarChart3, PieChart as PieIcon, Activity,
    LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import toast from 'react-hot-toast';

// Professional, vibrant color palette
const COLORS = [
    '#2563eb', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#f43f5e', // Rose
    '#14b8a6', // Teal
];

const PerformanceInsights = () => {
    const [data, setData] = useState({
        statusDistribution: [],
        hourlyCalls: [],
        recentLogs: [],
        pendingFollowUps: []
    });
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("All");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchQuery, setSearchQuery] = useState("");
    
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/leads/performance-insights");
            
            // Validate data structure
            const statusDist = Array.isArray(res.data.statusDistribution) ? res.data.statusDistribution : [];
            const hourly = Array.isArray(res.data.hourlyCalls) ? res.data.hourlyCalls : [];
            
            setData({
                statusDistribution: statusDist,
                hourlyCalls: hourly,
                recentLogs: Array.isArray(res.data.recentLogs) ? res.data.recentLogs : [],
                pendingFollowUps: Array.isArray(res.data.pendingFollowUps) ? res.data.pendingFollowUps : []
            });
        } catch (error) {
            console.error("Error fetching performance insights:", error);
            toast.error("Failed to load performance data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredLogs = data.recentLogs
        .filter(log => filterStatus === "All" || log.status === filterStatus)
        .filter(log => {
            const leadName = (log.lead?.name || log.lead?.Name || "").toLowerCase();
            return leadName.includes(searchQuery.toLowerCase());
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-slate-500 font-bold tracking-widest animate-pulse">SYNCING DATA...</p>
            </div>
        );
    }

    const totalCallsToday = data.hourlyCalls.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Minimalist Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">
                        <Activity size={12} />
                        Analytics Engine v1.0
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Daily <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Performance</span>
                    </h2>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end px-4 border-r border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Live Pulse</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">{totalCallsToday} Calls</span>
                    </div>
                    <Button 
                        variant="secondary" 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 py-2.5 shadow-sm"
                    >
                        <LayoutDashboard size={16} />
                        Dashboard
                    </Button>
                </div>
            </div>

            {/* Visual Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Distribution Overview (Pie Chart) */}
                <Card className="lg:col-span-4 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                            <PieIcon size={20} />
                        </div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-sm">Outcome Share</h3>
                    </div>
                    <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    animationBegin={0}
                                    animationDuration={1000}
                                >
                                    {data.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Volume Metrics (Bar Chart) */}
                <Card className="lg:col-span-8 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                            <BarChart3 size={20} />
                        </div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-sm">Call Volumes</h3>
                    </div>
                    <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.statusDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10}} 
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {data.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <LabelList dataKey="value" position="top" style={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Time-Series Activity */}
            <Card className="p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border-t-4 border-t-violet-500">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg text-violet-600">
                            <Activity size={20} />
                        </div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-sm">Hourly Pulse (24h)</h3>
                    </div>
                </div>
                <div className="h-[250px] w-full" style={{ minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.hourlyCalls}>
                            <defs>
                                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="hour" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#64748b', fontSize: 9, fontWeight: 700}} 
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#8b5cf6" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorArea)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Logs & Task Management */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Real-time Activity Feed */}
                <Card className="p-0 overflow-hidden border-none shadow-2xl">
                    <div className="p-6 bg-slate-900 text-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <PhoneCall size={20} className="text-blue-400" />
                                <h3 className="font-black uppercase tracking-widest text-sm">Activity Feed</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Search..."
                                        className="pl-9 pr-4 py-2 bg-slate-800 border-none rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 w-32 md:w-48 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <ArrowUpDown size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[450px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">Lead</th>
                                    <th className="px-6 py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest text-center">Outcome</th>
                                    <th className="px-6 py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 dark:text-slate-200">{log.lead?.name || log.lead?.Name || "Unknown"}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">{log.lead?.phone || "N/A"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge status={log.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-xs font-bold text-slate-700 dark:text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-20 text-center text-slate-400 italic font-medium">No records matching criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Task Follow-up Wall */}
                <Card className="p-0 overflow-hidden border-none shadow-2xl border-l-4 border-l-amber-500">
                    <div className="p-6 bg-amber-500 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock size={20} />
                            <h3 className="font-black uppercase tracking-widest text-sm">Task Follow-up Wall</h3>
                        </div>
                        <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-black">{data.pendingFollowUps.length} PENDING</span>
                    </div>
                    <div className="overflow-x-auto max-h-[450px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">Lead</th>
                                    <th className="px-6 py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">Context</th>
                                    <th className="px-6 py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Deadline</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {data.pendingFollowUps.length > 0 ? data.pendingFollowUps.map((fu) => (
                                    <tr key={fu._id} className="hover:bg-amber-50/20 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{fu.lead?.name || fu.lead?.Name || "Unknown"}</td>
                                        <td className="px-6 py-4 max-w-[150px]">
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">"{fu.notes}"</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="flex items-center gap-1 text-xs font-black text-amber-600">
                                                    <Calendar size={12} />
                                                    {new Date(fu.followUpDate).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(fu.followUpDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-300">
                                                <AlertCircle size={30} />
                                                <p className="text-[10px] font-black uppercase tracking-widest">All tasks completed!</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                        <Button 
                            variant="secondary" 
                            className="w-full text-xs font-black uppercase tracking-widest py-3 hover:bg-amber-600 hover:text-white transition-all"
                            onClick={() => navigate('/followups')}
                        >
                            Execute Task List
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PerformanceInsights;

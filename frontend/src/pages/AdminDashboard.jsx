import React, { useState, useEffect } from 'react';
import axios from "../api/axios";
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { Users, FileText, PhoneCall, PieChart } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalLeads: 0,
        totalCalls: 0,
        conversionRate: 0,
    });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [statsRes, usersRes] = await Promise.all([
                    axios.get("/admin/dashboard-stats"),
                    axios.get("/admin/users"),
                ]);
                setStats(statsRes.data);
                
                // If the response is paginated (contains .users), extract them
                const userList = usersRes.data.users || usersRes.data;
                setUsers(userList);
            } catch (error) {
                console.error("Error fetching admin data:", error);
                toast.error("Failed to fetch admin data.");
            }
        };

        fetchAdminData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} trend="Active Staff" trendUp={true} />
                <StatCard title="Total Leads" value={stats.totalLeads} icon={FileText} trend="All Time" trendUp={true} />
                <StatCard title="Calls (All Time)" value={stats.totalCalls} icon={PhoneCall} trend="Across Platform" trendUp={true} />
                <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={PieChart} trend="Interested Leads" trendUp={true} />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white">System Users</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium text-center">Role</th>
                                <th className="px-6 py-4 font-medium text-center">Email</th>
                                <th className="px-6 py-4 font-medium text-right">Account Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {users.map(user => (
                                <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{user.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">{user.email}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Badge status="Active" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View All Users</button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

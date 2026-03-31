import React from 'react';
import Card from './Card';
import { CheckCircle, XCircle } from 'lucide-react';

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

const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => (
    <Card>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
                {trend && (
                    <p className={`text-xs mt-2 flex items-center font-medium ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {trendUp ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                        {trend}
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-lg ${COLORS.primary} bg-opacity-10 dark:bg-opacity-20`}>
                <Icon size={24} className={COLORS.primaryText} />
            </div>
        </div>
    </Card>
);

export default StatCard;

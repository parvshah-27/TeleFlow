import React from 'react';
import { Loader2 } from 'lucide-react';

const COLORS = {
    primary: "bg-blue-600",
    primaryHover: "hover:bg-blue-700",
    ai: "bg-gradient-to-r from-violet-500 to-fuchsia-500",
};

const Button = ({ children, variant = "primary", className = "", onClick, icon: Icon, disabled = false, loading = false }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2";
    const variants = {
        primary: `${COLORS.primary} text-white ${COLORS.primaryHover} shadow-md shadow-blue-200 dark:shadow-none`,
        secondary: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
        danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40",
        ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        ai: `${COLORS.ai} text-white hover:opacity-90 shadow-md shadow-fuchsia-200 dark:shadow-none border border-transparent`,
    };

    return (
        <button onClick={onClick} disabled={disabled || loading} className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={16} />}
            {children}
        </button>
    );
};

export default Button;

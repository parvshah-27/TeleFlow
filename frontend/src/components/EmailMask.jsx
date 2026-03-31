import React from 'react';

const EmailMask = ({ email, variant = "default", isRevealed = false }) => {
    if (!email) return <span className="text-slate-400 italic text-[10px]">No email</span>;

    const maskEmail = (e) => {
        const [user, domain] = e.split('@');
        if (!domain) return e;
        
        const maskedUser = user.length > 2 
            ? `${user.substring(0, 2)}***` 
            : `${user}***`;
            
        const domainParts = domain.split('.');
        const domainName = domainParts[0];
        const extension = domainParts.slice(1).join('.');
        
        const maskedDomain = domainName.length > 2
            ? `${domainName.substring(0, 2)}***`
            : `${domainName}***`;
            
        return `${maskedUser}@${maskedDomain}.${extension}`;
    };

    const displayEmail = isRevealed ? email : maskEmail(email);

    // Compact / Kanban view
    if (variant === "compact") {
        return (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800 w-fit mt-1">
                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                    {displayEmail}
                </span>
            </div>
        );
    }

    // Standard / Table view
    return (
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-xl border border-slate-100 dark:border-slate-800 w-fit mt-1 shadow-sm">
            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                {displayEmail}
            </span>
        </div>
    );
};

export default EmailMask;

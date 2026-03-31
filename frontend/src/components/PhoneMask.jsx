import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';

const PhoneMask = ({ phone, name, user, variant = "default", isRevealed = false }) => {
    if (!phone) return <span className="text-slate-400 italic text-[10px]">No phone</span>;

    const maskPhone = (p) => {
        const clean = p.replace(/\D/g, '');
        if (clean.length < 7) return p;
        return `${clean.substring(0, 4)}***${clean.substring(clean.length - 3)}`;
    };

    const displayPhone = isRevealed ? phone : maskPhone(phone);

    if (variant === "compact") {
        return (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                    {displayPhone}
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 justify-end">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] text-slate-700 dark:text-slate-200 font-bold font-mono min-w-[90px] text-center">
                    {displayPhone}
                </span>
            </div>
            
            <div className="flex gap-1">
                <a
                    href={`tel:${phone}`}
                    className="p-2 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 transition-all border border-green-100 dark:border-green-900/30 shadow-sm"
                    title={`Call ${name}`}
                >
                    <Phone size={14} />
                </a>

                <a
                    href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${name || 'there'}, this is ${user?.name || 'a representative'} from TeleFlow.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-900/30 shadow-sm"
                    title={`WhatsApp ${name}`}
                >
                    <MessageSquare size={14} />
                </a>
            </div>
        </div>
    );
};

export default PhoneMask;

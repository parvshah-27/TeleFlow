import React from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import Button from './Button';

const AIModal = ({ isOpen, onClose, title, content, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-700">
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2 font-bold">
                        <Sparkles size={18} className="text-yellow-300" />
                        {title}
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full"><X size={18} /></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 size={32} className="animate-spin text-fuchsia-600 dark:text-fuchsia-400" />
                            <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Consulting Gemini AI...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {content}
                        </div>
                    )}
                </div>
                {!loading && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIModal;

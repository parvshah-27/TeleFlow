import React from 'react';
import Card from '../components/Card';
import { 
    PlayCircle, BookOpen, MousePointer2, 
    Zap, Shield, PhoneCall, BarChart3, 
    MessageSquare, Layers, CheckCircle2,
    ArrowRight, HelpCircle, Sparkles
} from 'lucide-react';

const TutorialPage = () => {
    const steps = [
        {
            title: "Performance Tracking",
            description: "Monitor your daily goals and efficiency in real-time. Use the 'Daily Overview' page to see your progress bars and success rates.",
            icon: BarChart3,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        },
        {
            title: "Lead Management",
            description: "Select leads from your active list to view their full history. Use the Phone and Email reveal buttons to access contact details securely.",
            icon: PhoneCall,
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-900/20"
        },
        {
            title: "Smart Pitching",
            description: "When a lead is selected, a personalized script will automatically pop up. You can send it via WhatsApp or copy it with one click.",
            icon: Sparkles,
            color: "text-fuchsia-500",
            bg: "bg-fuchsia-50 dark:bg-fuchsia-900/20"
        },
        {
            title: "AI Note Refiner",
            description: "Tired of typing long notes? Use the AI Wand icon in the call logger to instantly turn your rough notes into professional summaries.",
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-900/20"
        }
    ];

    const roles = [
        {
            name: "Telecaller",
            features: ["Personalized Scripts", "Activity History", "AI Note Refiner", "WhatsApp Integration"]
        },
        {
            name: "Manager",
            features: ["Lead Import (CSV)", "Telecaller Assignment", "Script Creation", "Performance Insights"]
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-24 py-12 pb-24">
            {/* Hero Section */}
            <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest">
                    <BookOpen size={14} />
                    Learning Center
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight">
                    Master your <span className="text-blue-600">Workflow</span>
                </h1>
                
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium text-lg">
                    Welcome to the TeleFlow Tutorial. Whether you're a telecaller or a manager, 
                    this guide will help you navigate the system efficiently.
                </p>
            </div>

            {/* Quick Start Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {steps.map((step, idx) => (
                    <Card key={idx} className="p-8 border-none shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12`}>
                            <step.icon size={120} />
                        </div>
                        
                        <div className="flex items-start gap-6 relative z-10">
                            <div className={`p-5 ${step.bg} ${step.color} rounded-2xl`}>
                                <step.icon size={32} />
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">{step.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Role Features Section */}
            <div className="bg-slate-900 rounded-[3rem] p-10 md:p-20 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-20 opacity-10 blur-3xl bg-blue-600 rounded-full"></div>
                <div className="absolute bottom-0 left-0 p-20 opacity-10 blur-3xl bg-fuchsia-600 rounded-full"></div>
                
                <div className="relative z-10 space-y-16">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">Features by Role</h2>
                            <p className="text-slate-400 font-medium mt-3">What can you do on TeleFlow?</p>
                        </div>
                        
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                            <Shield size={28} className="text-blue-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
                        {roles.map((role, idx) => (
                            <div key={idx} className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-10 bg-blue-500 rounded-full"></div>
                                    <h4 className="text-2xl font-black uppercase tracking-widest text-slate-300">{role.name}</h4>
                                </div>
                                
                                <ul className="space-y-5">
                                    {role.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-center gap-4 text-slate-400 font-bold text-sm group">
                                            <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                                                <CheckCircle2 size={14} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Support CTA */}
            <div className="text-center space-y-10">
                <div className="inline-flex items-center justify-center p-6 bg-blue-600 rounded-3xl text-white shadow-2xl shadow-blue-600/30">
                    <HelpCircle size={40} />
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">Still have questions?</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto text-lg">
                        Our support team is always ready to help you with any technical difficulties or workflow questions.
                    </p>
                </div>
                
                <button className="px-10 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl">
                    Contact Support
                </button>
            </div>
        </div>
    );
};

export default TutorialPage;
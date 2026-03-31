import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from "./api/axios";
import toast, { Toaster } from 'react-hot-toast';

import MainLayout from './layouts/MainLayout';
import TelecallerDashboard from './pages/TelecallerDashboard';
import MyLeadsPage from './pages/MyLeadsPage';
import FollowUps from './pages/FollowUps';
import ImportLeadsPage from './pages/ImportLeadsPage';
import AssignLeadsPage from './pages/AssignLeadsPage';
import CompletedLeadsPage from './pages/CompletedLeadsPage';
import UserManagementPage from './pages/UserManagementPage';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PerformanceInsights from './pages/PerformanceInsights';
import ProfilePage from './pages/ProfilePage';
import BulkWhatsAppPage from './pages/BulkWhatsAppPage';
import BulkSMSPage from './pages/BulkSMSPage';
// import ManageAIScripts from './pages/ManageAIScripts';
// import AIScriptLab from './pages/AIScriptLab';
// import SelectScriptPage from './pages/SelectScriptPage';
import AIModal from './components/AIModal';

const ROLES = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    TELECALLER: 'Telecaller',
};

function TeleFlowAppContent({ user, handleLogout }) {
    console.log("TeleFlowAppContent rendering for user:", user?.email, "Role:", user?.role);
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [aiScripts, setAiScripts] = useState([]);
    const [activeUserScript, setActiveUserScript] = useState(() => {
        try {
            const saved = localStorage.getItem(`activeScript_${user?._id || 'default'}`);
            if (!saved || saved === "undefined" || saved === "null") return null;
            return JSON.parse(saved);
        } catch (error) {
            console.error("Failed to parse activeUserScript from localStorage", error);
            return null;
        }
    });
    const [updateForm, setUpdateForm] = useState({
        status: "",
        notes: "",
        followUpDate: "",
    });

    useEffect(() => {
        if (user?._id) {
            localStorage.setItem(`activeScript_${user._id}`, JSON.stringify(activeUserScript));
        }
    }, [activeUserScript, user?._id]);

    useEffect(() => {
        const fetchAIScripts = async () => {
            try {
                const res = await axios.get('/aiscripts');
                setAiScripts(res.data);
            } catch (error) {
                console.error("Failed to load AI scripts:", error);
            }
        };
        fetchAIScripts();
    }, []);

    const generateGeminiContent = async (prompt) => {
        try {
            const response = await axios.post("/gemini/generate", { prompt });
            return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
        } catch (error) {
            console.error("Gemini API failed:", error);
            return "Sorry, I couldn't generate a response at this time. Please try again.";
        }
    };
    const [modalOpen, setModalOpen] = useState(false);
    const [aiContent, setAiContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [dashboardStats, setDashboardStats] = useState({
        todaysTarget: 0,
        callsCompleted: 0,
        followUps: 0,
        leadsRemaining: 0,
        pendingLeads: 0,
        overdueFollowUps: 0,
        totalAssigned: 0,
        successStats: []
    });

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            toast.success("Back online!", { id: 'network-status' });
            fetchLeads(1, searchQuery, true);
        };
        const handleOffline = () => {
            setIsOffline(true);
            toast.error("You are offline. Showing cached data.", { id: 'network-status', duration: 4000 });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [searchQuery]);

    const fetchStats = () => {
        if (user.role?.toLowerCase() === ROLES.TELECALLER.toLowerCase()) {
            axios.get("/leads/dashboard-stats")
                .then(res => setDashboardStats(res.data))
                .catch(err => console.error("Stats error:", err));
        }
    };

    const fetchLeads = (page = 1, search = "", silent = false) => {
        if (user.role?.toLowerCase() === ROLES.TELECALLER.toLowerCase()) {
            if (!silent && (page === pagination.currentPage)) {
                toast.loading("Refreshing leads...", { id: "refresh-leads", duration: 1000 });
            }
            const url = `/leads/my?page=${page}&limit=10&search=${search}`;
            axios.get(url)
                .then(res => {
                    const data = res.data.leads || [];
                    setLeads(data);
                    setFilteredLeads(data);
                    setPagination(res.data.pagination || { currentPage: 1, totalPages: 1 });
                    if (!silent) toast.success("Leads updated", { id: "refresh-leads" });
                })
                .catch(async (err) => {
                    console.error("Leads fetch error:", err);
                    
                    // Offline fallback: Check caches directly if axios fails
                    if ('caches' in window) {
                        const cache = await caches.open('teleflow-data-v1');
                        // Use the full URL as it's the key in the service worker cache
                        const fullUrl = `${axios.defaults.baseURL}${url}`;
                        const cachedResponse = await cache.match(fullUrl);
                        if (cachedResponse) {
                            const cachedData = await cachedResponse.json();
                            setLeads(cachedData.leads || []);
                            setFilteredLeads(cachedData.leads || []);
                            setPagination(cachedData.pagination || { currentPage: 1, totalPages: 1 });
                            if (!silent) toast.success("Loaded from cache (Offline)", { id: "refresh-leads" });
                            return;
                        }
                    }

                    setLeads([]);
                    setFilteredLeads([]);
                    if (!silent) toast.error("Failed to refresh leads", { id: "refresh-leads" });
                });
        }
    };

    useEffect(() => {
        if (!user || !user.role) return;
        fetchLeads(1, searchQuery, true);
        fetchStats();
        
        if (user.role?.toLowerCase() === ROLES.TELECALLER.toLowerCase()) {
            const interval = setInterval(fetchStats, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user?.role]);

    // Update search with a small delay (debounce)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchLeads(1, searchQuery);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSelectLead = (lead) => {
        setSelectedLead(lead);
        setUpdateForm({
            status: lead.status,
            notes: lead.notes || "",
            followUpDate: "",
        });
        navigate('/');
    };

    const handleLogCall = async (e) => {
        e.preventDefault();
        if (!selectedLead) return;

        try {
            await axios.post("/calls/log", {
                leadId: selectedLead._id,
                ...updateForm
            });
            toast.success("Call logged successfully!");

            fetchLeads(pagination.currentPage, searchQuery);
            fetchStats();

            setSelectedLead(null);
            setUpdateForm({ status: "", notes: "", followUpDate: "" });
        } catch (error) {
            toast.error("Failed to log call.");
            console.error("Error logging call:", error);
        }
    };

    const handleGenerateScript = async (lead, customScript = null) => {
        setModalOpen(true);
        setLoading(true);
        setAiContent("");

        const name = lead.name || lead.Name || "Customer";
        const product = lead.product || lead.Product || "our services";
        const status = lead.status || "New";

        let prompt = "";
        const activeScript = customScript || activeUserScript || aiScripts.find(s => s.isActive);
        
        if (activeScript) {
            prompt = activeScript.promptTemplate
                .replace(/\$\{name\}/g, name)
                .replace(/\$\{product\}/g, product)
                .replace(/\$\{status\}/g, status);
        } else {
            prompt = `Act as a professional sales trainer. Write a persuasive, concise telecalling script (max 3 sentences) for a customer named ${name} regarding the product "${product}". The current lead status is '${status}'. Tone: Polite, energetic, and professional.`;
        }

        const result = await generateGeminiContent(prompt);
        setAiContent(result);
        setLoading(false);
    };

    const handleRefineNotes = async (e) => {
        e.preventDefault();
        if (!updateForm.notes) return;

        setIsRefining(true);
        const prompt = `Refine the following telecaller notes to be professional, concise, and grammatically correct. Keep important details. Only return the refined text. Raw Notes: "${updateForm.notes}"`;

        const result = await generateGeminiContent(prompt);
        setUpdateForm({ ...updateForm, notes: result });
        setIsRefining(false);
    };

    const handleUpdateStatus = async (leadId, newStatus) => {
        try {
            await axios.put(`/leads/${leadId}`, { status: newStatus });
            toast.success(`Lead marked as ${newStatus}`);
            fetchLeads(pagination.currentPage, searchQuery, true); // Silent refresh
            fetchStats();
        } catch (error) {
            toast.error("Failed to update status.");
            console.error("Error updating lead status:", error);
        }
    };

    if (!user) {
        console.warn("TeleFlowAppContent: User is missing!");
        return <div className="p-10 text-center">Authentication Error. Please log in again.</div>;
    }

    return (
        <MainLayout user={user} handleLogout={handleLogout}>
            {isOffline && (
                <div className="fixed bottom-4 left-4 z-50 animate-bounce">
                    <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest border-2 border-white">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        Offline Mode
                    </div>
                </div>
            )}
            <AIModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="AI Call Script"
                content={aiContent}
                loading={loading}
            />
            <Routes>
                <Route path="/" element={
                    user.role?.toLowerCase() === ROLES.TELECALLER.toLowerCase() ? <TelecallerDashboard {...{ user, filteredLeads, searchQuery, setSearchQuery, handleSelectLead, selectedLead, updateForm, setUpdateForm, handleLogCall, handleGenerateScript, handleRefineNotes, isRefining, pagination, fetchLeads, dashboardStats, aiScripts }} /> :
                        user.role?.toLowerCase() === ROLES.MANAGER.toLowerCase() ? <ManagerDashboard /> :
                            <AdminDashboard />
                } />
                <Route path="/leads" element={<MyLeadsPage {...{ user, filteredLeads, searchQuery, setSearchQuery, handleSelectLead, handleGenerateScript, pagination, fetchLeads, handleUpdateStatus }} />} />
                <Route path="/performance" element={<PerformanceInsights />} />
                <Route path="/followups" element={<FollowUps onSelectLead={handleSelectLead} />} />
                {/* <Route path="/script-settings" element={<SelectScriptPage aiScripts={aiScripts} activeUserScript={activeUserScript} setActiveUserScript={setActiveUserScript} />} /> */}
                <Route path="/bulk-whatsapp" element={
                    (user.role?.toLowerCase() === ROLES.ADMIN.toLowerCase() || user.role?.toLowerCase() === ROLES.TELECALLER.toLowerCase()) 
                        ? <BulkWhatsAppPage user={user} onGenerateAI={generateGeminiContent} /> 
                        : <div className="flex items-center justify-center h-[60vh] text-slate-500 font-bold uppercase tracking-widest">Access Denied</div>
                } />
                <Route path="/bulk-sms" element={
                    (user.role?.toLowerCase() === ROLES.ADMIN.toLowerCase() || user.role?.toLowerCase() === ROLES.TELECALLER.toLowerCase()) 
                        ? <BulkSMSPage user={user} onGenerateAI={generateGeminiContent} /> 
                        : <div className="flex items-center justify-center h-[60vh] text-slate-500 font-bold uppercase tracking-widest">Access Denied</div>
                } />
                {/* <Route path="/ai-scripts" element={
                    (user.role?.toLowerCase() === ROLES.ADMIN.toLowerCase() || user.role?.toLowerCase() === ROLES.MANAGER.toLowerCase()) 
                        ? <ManageAIScripts /> 
                        : <div className="flex items-center justify-center h-[60vh] text-slate-500 font-bold uppercase tracking-widest">Access Denied</div>
                } />
                <Route path="/ai-lab" element={
                    (user.role?.toLowerCase() === ROLES.ADMIN.toLowerCase() || user.role?.toLowerCase() === ROLES.MANAGER.toLowerCase()) 
                        ? <AIScriptLab /> 
                        : <div className="flex items-center justify-center h-[60vh] text-slate-500 font-bold uppercase tracking-widest">Access Denied</div>
                } /> */}
                <Route path="/upload" element={<ImportLeadsPage />} />
                <Route path="/assign" element={<AssignLeadsPage />} />
                <Route path="/completed" element={<CompletedLeadsPage />} />
                <Route path="/users" element={<UserManagementPage currentUser={user} />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<div className="flex items-center justify-center h-[60vh] text-slate-500 font-bold uppercase tracking-widest">Page Not Found</div>} />
            </Routes>
        </MainLayout>
    )
}



export default function TeleFlowApp({ user, handleLogout }) {
    return (
        <TeleFlowAppContent user={user} handleLogout={handleLogout} />
    )
}

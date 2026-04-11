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
import PerformanceOverviewPage from './pages/PerformanceOverviewPage';
import ProfilePage from './pages/ProfilePage';
import TutorialPage from './pages/TutorialPage';
import BulkWhatsAppPage from './pages/BulkWhatsAppPage';
import BulkSMSPage from './pages/BulkSMSPage';
import ManageScriptsPage from './pages/ManageScriptsPage';
import AIModal from './components/AIModal';

const ROLES = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    TELECALLER: 'Telecaller',
};

function TeleFlowAppContent({ user, handleLogout }) {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [scripts, setScripts] = useState([]);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [updateForm, setUpdateForm] = useState({
        status: "",
        notes: "",
        followUpDate: "",
    });

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

    const generateGeminiContent = async (prompt) => {
        try {
            const response = await axios.post("/gemini/generate", { prompt });
            return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
        } catch (error) {
            console.error("Gemini API failed:", error);
            return "Sorry, I couldn't generate a response at this time. Please try again.";
        }
    };

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
        if (user?.role?.toLowerCase() === ROLES.TELECALLER.toLowerCase()) {
            axios.get("/leads/dashboard-stats")
                .then(res => setDashboardStats(res.data))
                .catch(err => console.error("Stats error:", err));
        }
    };

    const fetchScripts = () => {
        axios.get("/scripts")
            .then(res => setScripts(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error("Scripts error:", err));
    };

    const fetchLeads = (page = 1, search = "", silent = false) => {
        if (user?.role?.toLowerCase() === ROLES.TELECALLER.toLowerCase()) {
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
        fetchScripts();
        
        if (user.role?.toLowerCase() === ROLES.TELECALLER.toLowerCase()) {
            const interval = setInterval(fetchStats, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user?.role]);

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

    const handleLogCall = async (e, scriptId = null) => {
        e.preventDefault();
        if (!selectedLead) return;

        try {
            await axios.post("/calls/log", {
                leadId: selectedLead._id,
                ...updateForm,
                scriptId: scriptId
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

    const handleRefineNotes = async (e) => {
        e.preventDefault();
        if (!updateForm.notes) return;

        setIsRefining(true);
        const prompt = `Convert these raw telecaller notes into one professional, grammatically correct sentence. Return ONLY the refined sentence.\n\nRaw Notes: "${updateForm.notes}"`;

        const result = await generateGeminiContent(prompt);
        setUpdateForm({ ...updateForm, notes: result });
        setIsRefining(false);
    };

    const handleUpdateStatus = async (leadId, newStatus) => {
        try {
            await axios.put(`/leads/${leadId}`, { status: newStatus });
            toast.success(`Lead marked as ${newStatus}`);
            fetchLeads(pagination.currentPage, searchQuery, true);
            fetchStats();
        } catch (error) {
            toast.error("Failed to update status.");
            console.error("Error updating lead status:", error);
        }
    };

    if (!user) {
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
            <Routes>
                <Route path="/" element={
                    user.role?.toLowerCase() === ROLES.TELECALLER.toLowerCase() ? 
                        <TelecallerDashboard {...{ user, filteredLeads, searchQuery, setSearchQuery, handleSelectLead, selectedLead, updateForm, setUpdateForm, handleLogCall, handleRefineNotes, isRefining, pagination, fetchLeads, dashboardStats, scripts }} /> :
                        user.role?.toLowerCase() === ROLES.MANAGER.toLowerCase() ? <ManagerDashboard /> :
                            <AdminDashboard />
                } />
                <Route path="/leads" element={<MyLeadsPage {...{ user, filteredLeads, searchQuery, setSearchQuery, handleSelectLead, pagination, fetchLeads, handleUpdateStatus }} />} />
                <Route path="/performance" element={<PerformanceInsights />} />
                <Route path="/performance-overview" element={<PerformanceOverviewPage />} />
                <Route path="/followups" element={<FollowUps onSelectLead={handleSelectLead} />} />
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
                <Route path="/manage-scripts" element={
                    (user.role?.toLowerCase() === ROLES.MANAGER.toLowerCase() || user.role?.toLowerCase() === ROLES.ADMIN.toLowerCase()) 
                        ? <ManageScriptsPage /> 
                        : <div className="flex items-center justify-center h-[60vh] text-slate-500 font-bold uppercase tracking-widest">Access Denied</div>
                } />
                <Route path="/upload" element={<ImportLeadsPage />} />
                <Route path="/assign" element={<AssignLeadsPage />} />
                <Route path="/completed" element={<CompletedLeadsPage />} />
                <Route path="/users" element={<UserManagementPage currentUser={user} />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/tutorial" element={<TutorialPage />} />
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

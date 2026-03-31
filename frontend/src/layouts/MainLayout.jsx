import React, { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Clock,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  PhoneCall,
  Settings,
  Sparkles,
  Sun,
  UploadCloud,
  UserCheck,
  Users,
  Wand2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  TELECALLER: "Telecaller",
};

function MainLayout({ user, handleLogout, onStartTour, children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const location = useLocation();

  const activeTab = location.pathname;

  const navItems = {
    [ROLES.TELECALLER]: [
      { id: "/", icon: LayoutDashboard, label: "Dashboard" },
      { id: "/leads", icon: PhoneCall, label: "My Leads" },
      { id: "/followups", icon: Clock, label: "Follow Ups" },
      { id: "/bulk-sms", icon: Sparkles, label: "Bulk SMS" },
    ],
    [ROLES.MANAGER]: [
      { id: "/", icon: LayoutDashboard, label: "Overview" },
      { id: "/users", icon: Users, label: "Manage Telecallers" },
      { id: "/upload", icon: UploadCloud, label: "Import Leads" },
      { id: "/assign", icon: UserCheck, label: "Manage Leads" },
      { id: "/completed", icon: ClipboardCheck, label: "Completed Leads" },
    ],
    [ROLES.ADMIN]: [
      { id: "/", icon: LayoutDashboard, label: "Admin Dashboard" },
      { id: "/users", icon: Users, label: "User Management" },
      { id: "/bulk-whatsapp", icon: MessageCircle, label: "Bulk WhatsApp" },
      { id: "/bulk-sms", icon: Sparkles, label: "Bulk SMS" },
    ],
  };

  const getUserRoleKey = () => {
    const role = user.role?.toLowerCase();
    if (role === ROLES.ADMIN.toLowerCase()) return ROLES.ADMIN;
    if (role === ROLES.MANAGER.toLowerCase()) return ROLES.MANAGER;
    if (role === ROLES.TELECALLER.toLowerCase()) return ROLES.TELECALLER;
    return ROLES.TELECALLER; // Default
  };

  const roleKey = getUserRoleKey();

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900/30 transition-colors duration-200">
        <aside
          className={`${isSidebarOpen ? "w-64" : "w-20"} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 fixed md:relative z-20 h-full`}
        >
          <div className="p-6 flex items-center gap-3 border-b border-slate-50 dark:border-slate-700">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-blue-500/30">
              TF
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
                TeleFlow
              </span>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {(navItems[roleKey] || []).map((item) => (
              <Link
                key={item.id}
                to={item.id}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors
                                    ${
                                      activeTab === item.id
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
                                    }`}
              >
                <item.icon size={20} strokeWidth={2} />
                {isSidebarOpen && <span>{item.label}</span>}
                {!isSidebarOpen && activeTab === item.id && (
                  <div className="absolute left-18 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700">
            <div
              className={`flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 ${!isSidebarOpen && "justify-center"}`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs flex-shrink-0">
                {user.role ? user.role[0] : "U"}
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-200">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.role}
                  </p>
                </div>
              )}
            </div>
            <Link
              to="/profile"
              className={`w-full mt-4 flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition-colors
                                ${
                                  activeTab === "/profile"
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
                                } ${!isSidebarOpen && "justify-center"}`}
            >
              <Settings size={18} />
              {isSidebarOpen && <span>Profile Settings</span>}
            </Link>
            <button
              className="w-full mt-2 flex items-center justify-center gap-2 text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              {isSidebarOpen && "Logout"}
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-white hidden md:block">
                {(navItems[roleKey] || []).find((item) => item.id === activeTab)?.label || "TeleFlow"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onStartTour}
                className="p-2 rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Start Tutorial"
              >
                <HelpCircle size={20} />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>

        {!isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/20 z-10"
            onClick={() => setSidebarOpen(true)}
          ></div>
        )}
      </div>
    </div>
  );
}

export default MainLayout;

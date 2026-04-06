import React, { useState, useEffect } from "react";
import TeleFlowApp from "./TeleFlowApp";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPassword";
import axios from "./api/axios";

export default function App() {
    console.log("App component rendering. User state check...");
    const [user, setUser] = useState(() => {
        try {
            const storedUser = sessionStorage.getItem("user");
            if (!storedUser || storedUser === "undefined") return null;
            const parsed = JSON.parse(storedUser);
            if (parsed && typeof parsed === "object" && parsed.role) {
                return parsed;
            }
            return null;
        } catch (error) {
            console.error("Failed to parse user from sessionStorage", error);
            return null;
        }
    });
    const [view, setView] = useState("login"); // "login", "forgot"

    useEffect(() => {
        // "Wake up" Render server early when user is on login page
        if (!user) {
            console.log("Pinging backend to wake up...");
            axios.get("/test").catch(() => {}); // /api/test exists in server.js
        }
    }, [user]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        // Removed window.location.href = "/" which breaks Electron HashRouter
    };

    const handleLogout = async () => {
        try {
            await axios.post("/auth/logout");
        } catch (error) {
            console.error("Logout failed", error);
        }
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
        setUser(null);
        // Removed window.location.href = "/" which breaks Electron HashRouter
    };

    if (!user) {
        return (
            <>
                <Toaster />
                {view === "forgot" ? (
                    <ForgotPassword onBack={() => setView("login")} />
                ) : (
                    <LoginPage
                        onLogin={handleLoginSuccess}
                        onForgotPassword={() => setView("forgot")}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <Toaster />
            <TeleFlowApp user={user} handleLogout={handleLogout} />
        </>
    );
}

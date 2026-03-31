import React, { useState } from "react";
import axios from "../api/axios";
import toast from "react-hot-toast";
import { User, Mail, Lock, Shield, ArrowLeft, Loader2 } from "lucide-react";

const RegisterPage = ({ onBack }) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "Telecaller",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post("/auth/register", form);
            toast.success("Registration successful. Please login.");
            onBack();
        } catch (err) {
            toast.error(err.response?.data?.msg || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 transition-colors">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl w-96 space-y-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create Account</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Join the TeleFlow platform</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            name="name"
                            required
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                            placeholder="Full Name"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                            placeholder="Email address"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                            placeholder="Create Password"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="relative">
                        <Shield className="absolute left-3 top-3 text-slate-400" size={18} />
                        <select
                            name="role"
                            value={form.role}
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all appearance-none"
                            onChange={handleChange}
                        >
                            <option value="Telecaller">Telecaller</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? "Creating account..." : "Register"}
                    </button>
                </form>

                <div className="text-center border-t border-slate-100 dark:border-slate-700 pt-6">
                    <button
                        onClick={onBack}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={16} />
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;

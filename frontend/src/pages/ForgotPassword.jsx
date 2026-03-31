import React, { useState } from "react";
import axios from "../api/axios";
import toast from "react-hot-toast";
import { Mail, Lock, ShieldCheck, ArrowLeft, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import Button from "../components/Button";

const ForgotPassword = ({ onBack }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post("/auth/forgot-password", { email });
            toast.success(res.data.msg);
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.msg || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        // Password Validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return toast.error(
                "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.",
                { duration: 5000 }
            );
        }

        if (password !== confirmPassword) {
            return toast.error("Passwords do not match");
        }
        if (!otp) {
            return toast.error("Please enter the OTP");
        }

        setLoading(true);
        try {
            const res = await axios.post("/auth/reset-password", { email, otp, password });
            toast.success(res.data.msg);
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.msg || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-6 transition-colors">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700 w-full max-w-md text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={40} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Password Reset!</h2>
                        <p className="text-slate-500 dark:text-slate-400">Your password has been successfully updated.</p>
                    </div>
                    <Button onClick={onBack} className="w-full py-3">
                        Back to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-6 transition-colors">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700 w-full max-w-md">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium mb-8 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to login
                </button>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                        <KeyRound size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Forgot Password</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        {step === 1 
                            ? "Enter your email to receive a verification code." 
                            : "Enter the code and your new password."}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleRequestOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-900 dark:text-white"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full py-3" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Send OTP"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Verification Code</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    maxLength="6"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm tracking-[0.5em] font-mono text-slate-900 dark:text-white"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                Must be at least 8 characters with uppercase, lowercase, number, and special character.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full py-3 mt-2" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Reset Password"}
                        </Button>
                        
                        <button 
                            type="button"
                            onClick={handleRequestOtp}
                            className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            Didn't get the code? Resend
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;

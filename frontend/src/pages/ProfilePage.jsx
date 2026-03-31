import React, { useState, useEffect } from 'react';
import axios from "../api/axios";
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import { User, Mail, Lock, Loader2, Save, AlertCircle, ShieldCheck } from 'lucide-react';

const ProfilePage = () => {
    const [originalEmail, setOriginalEmail] = useState('');
    const [profile, setProfile] = useState({
        name: '',
        email: ''
    });
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get("/users/profile");
                setProfile({
                    name: res.data.name,
                    email: res.data.email
                });
                setOriginalEmail(res.data.email);
            } catch (error) {
                console.error("Error fetching profile:", error);
                const msg = error.response?.data?.msg || error.response?.data?.message || "Failed to load profile data";
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const isEmailChanged = profile.email !== originalEmail;

    const handleSendOtp = async () => {
        if (!profile.email) return toast.error("Please enter a new email address");
        
        setSendingOtp(true);
        try {
            const res = await axios.post("/users/send-otp", { newEmail: profile.email });
            toast.success(res.data.msg);
            setOtpSent(true);
        } catch (error) {
            console.error("OTP send error:", error);
            toast.error(error.response?.data?.msg || "Failed to send OTP");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password) {
            if (!oldPassword) {
                return toast.error("Current password is required to set a new password");
            }
            if (password !== confirmPassword) {
                return toast.error("New passwords do not match");
            }
        }

        if (isEmailChanged && !otp) {
            return toast.error("Please verify your new email address with the OTP");
        }

        setUpdating(true);
        try {
            const updateData = {
                name: profile.name,
                email: profile.email
            };
            if (password) {
                updateData.password = password;
                updateData.oldPassword = oldPassword;
            }
            if (isEmailChanged) {
                updateData.otp = otp;
            }

            const res = await axios.put("/users/profile", updateData);
            
            // Update session storage if name/email changed (used for display in sidebar)
            const storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
            sessionStorage.setItem("user", JSON.stringify({
                ...storedUser,
                name: res.data.name,
                email: res.data.email
            }));

            toast.success("Profile updated successfully!");
            setOriginalEmail(profile.email);
            setOldPassword('');
            setPassword('');
            setConfirmPassword('');
            setOtp('');
            setOtpSent(false);
        } catch (error) {
            console.error("Update profile error:", error);
            toast.error(error.response?.data?.msg || "Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-blue-600 h-10 w-10 mb-4" />
                <p className="text-slate-500 font-medium">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Account Settings</h2>
                <p className="text-slate-500 dark:text-slate-400">Manage your profile information and security.</p>
            </div>

            <Card className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700">General Information</h3>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                                        value={profile.email}
                                        onChange={(e) => {
                                            setProfile({ ...profile, email: e.target.value });
                                            if (e.target.value === originalEmail) setOtpSent(false);
                                        }}
                                    />
                                </div>
                                {isEmailChanged && !otpSent && (
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        onClick={handleSendOtp} 
                                        disabled={sendingOtp}
                                        className="whitespace-nowrap"
                                    >
                                        {sendingOtp ? <Loader2 size={16} className="animate-spin" /> : "Send OTP"}
                                    </Button>
                                )}
                            </div>
                            {isEmailChanged && (
                                <p className="text-[10px] text-blue-500 font-medium">Changing email requires OTP verification.</p>
                            )}
                        </div>

                        {otpSent && isEmailChanged && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Enter OTP</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                                    <input
                                        type="text"
                                        maxLength="6"
                                        className="w-full pl-10 pr-4 py-2 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white tracking-[0.5em] font-mono text-lg transition-all"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-[10px] text-emerald-600">OTP has been sent to your new email.</p>
                                    <button type="button" onClick={handleSendOtp} className="text-[10px] text-blue-600 hover:underline">Resend OTP</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700">Security</h3>
                        
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3 rounded-lg flex gap-3 mb-4">
                            <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
                            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                To update your password, you must provide your current (old) password for verification.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Current (Old) Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Verify with current password"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <Button
                            type="submit"
                            disabled={updating}
                            className="flex items-center gap-2 px-8"
                        >
                            {updating ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ProfilePage;

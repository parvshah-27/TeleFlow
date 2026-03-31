import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Plus, X } from 'lucide-react';

const UserModal = ({ isOpen, onClose, onSave, user, currentUserRole }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: currentUserRole === 'Manager' ? 'Telecaller' : 'Telecaller',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                role: currentUserRole === 'Manager' ? 'Telecaller' : 'Telecaller',
            });
        }
    }, [user, currentUserRole]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Password Validation
        if (!user || formData.password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                return toast.error(
                    "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.",
                    { duration: 5000 }
                );
            }
        }

        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white">{user ? 'Edit User' : 'Add New User'}</h3>
                    <button onClick={onClose} className="hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Password {user ? '(leave blank to keep current)' : ''}</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                required={!user}
                            />
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                                Must be at least 8 characters with uppercase, lowercase, number, and special character.
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                disabled={currentUserRole === 'Manager'}
                                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                            >
                                <option>Admin</option>
                                <option>Manager</option>
                                <option>Telecaller</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save User</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagementPage = ({ currentUser }) => {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0 });

    const fetchUsers = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const res = await axios.get(`/admin/users?page=${page}&limit=10&search=${search}`);
            if (res.data.users) {
                // For Managers, filter the list to only show Telecallers
                const filteredList = currentUser?.role === 'Manager' 
                    ? res.data.users.filter(u => u.role === 'Telecaller')
                    : res.data.users;
                
                setUsers(filteredList);
                setPagination(res.data.pagination);
            } else {
                const filteredList = currentUser?.role === 'Manager' 
                    ? res.data.filter(u => u.role === 'Telecaller')
                    : res.data;
                setUsers(filteredList);
                setPagination({ currentPage: 1, totalPages: 1, totalUsers: res.data.length });
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1, searchQuery);
    }, [currentUser]);

    // Update search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers(1, searchQuery);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchUsers(newPage, searchQuery);
        }
    };

    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    const handleSaveUser = async (userData) => {
        try {
            if (editingUser) {
                // Update user
                await axios.put(`/admin/users/${editingUser._id}`, userData);
                toast.success("User updated successfully!");
            } else {
                // Create user
                await axios.post("/admin/users", userData);
                toast.success("User created successfully!");
            }
            fetchUsers(pagination.currentPage, searchQuery); // Refresh the current page
            handleCloseModal();
        } catch (error) {
            console.error("Error saving user:", error);
            toast.error(error.response?.data?.msg || "Failed to save user.");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await axios.delete(`/admin/users/${userId}`);
                toast.success("User deleted successfully!");
                fetchUsers(pagination.currentPage, searchQuery); // Refresh the current page
            } catch (error) {
                console.error("Error deleting user:", error);
                toast.error("Failed to delete user.");
            }
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {currentUser?.role === 'Manager' ? 'Manage Telecallers' : 'User Management'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {currentUser?.role === 'Manager' ? 'Create and oversee your telecaller team.' : 'Manage all system accounts and permissions.'}
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <input 
                            type="text" 
                            placeholder="Search by name or email..."
                            className="w-full md:w-64 pl-4 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button icon={Plus} onClick={() => handleOpenModal()}>
                        {currentUser?.role === 'Manager' ? 'Add Telecaller' : 'Add User'}
                    </Button>
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveUser}
                user={editingUser}
                currentUserRole={currentUser?.role}
            />

            <Card className="p-0 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Name</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Role</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Email</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading users...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                    No users found matching your search.
                                </td>
                            </tr>
                        ) : users.map(user => (
                            <tr key={user._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                                <td className="px-6 py-5 font-semibold text-slate-800 dark:text-slate-200">
                                    {user.name}
                                </td>
                                <td className="px-6 py-5">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-slate-500 dark:text-slate-400 text-xs">
                                    {user.email}
                                </td>
                                <td className="px-6 py-5">
                                    <Badge status="Active" />
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex justify-end items-center gap-4">
                                        <button 
                                            onClick={() => handleOpenModal(user)}
                                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs font-bold"
                                        >
                                            EDIT
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(user._id)}
                                            className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors text-xs font-bold"
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 bg-white dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <div className="text-xs text-slate-500 font-medium">
                            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalUsers} users)
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={pagination.currentPage === 1 || loading}
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={pagination.currentPage === pagination.totalPages || loading}
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default UserManagementPage;

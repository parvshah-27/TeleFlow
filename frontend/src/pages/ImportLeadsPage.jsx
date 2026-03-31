import React, { useState } from 'react';
import axios from "../api/axios";
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import { UploadCloud, FileText } from 'lucide-react';

const ImportLeadsPage = () => {
    const [file, setFile] = useState(null);
    const [manualLead, setManualLead] = useState({ name: "", email: "", phone: "", product: "" });
    const [loading, setLoading] = useState(false);
    const fileInputRef = React.useRef();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            await axios.post("/leads/import", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            toast.success("Leads imported successfully!");
            setFile(null);
        } catch (error) {
            toast.error("Failed to import leads.");
            console.error("Error importing leads:", error);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualLead.name || !manualLead.phone) {
            toast.error("Name and Phone are required.");
            return;
        }

        setLoading(true);
        try {
            await axios.post("/leads", manualLead);
            toast.success("Lead added successfully!");
            setManualLead({ name: "", email: "", phone: "", product: "" });
        } catch (error) {
            toast.error("Failed to add lead.");
            console.error("Manual add error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = "name,email,phone,product\n";
        const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "leads_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Lead Management</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manual Entry Form */}
                <Card>
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                        <FileText size={18} /> Manual Lead Entry
                    </h3>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Full Name</label>
                            <input
                                type="text"
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={manualLead.name}
                                onChange={(e) => setManualLead({ ...manualLead, name: e.target.value })}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Email Address</label>
                            <input
                                type="email"
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={manualLead.email}
                                onChange={(e) => setManualLead({ ...manualLead, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Phone Number</label>
                            <input
                                type="tel"
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={manualLead.phone}
                                onChange={(e) => setManualLead({ ...manualLead, phone: e.target.value })}
                                placeholder="+91 9876543210"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Product/Interest</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={manualLead.product}
                                onChange={(e) => setManualLead({...manualLead, product: e.target.value})}
                                placeholder="Loan/Credit Card"
                            />
                        </div>
                        <Button className="w-full mt-2" type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Lead"}
                        </Button>
                    </form>
                </Card>

                {/* File Upload Section */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <UploadCloud size={18} /> Bulk Import (CSV)
                        </h3>
                        <Button variant="ghost" className="text-[10px] h-auto py-1 px-2" onClick={handleDownloadTemplate}>Template</Button>
                    </div>
                    <div
                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                        <UploadCloud size={48} className="text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {file ? file.name : "Click to browse CSV"}
                        </p>
                    </div>
                    <Button className="w-full mt-4" onClick={handleUpload} disabled={!file}>Upload Bulk File</Button>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">Supported format: .csv only</p>
                </Card>
            </div>
        </div>
    );
};

export default ImportLeadsPage;

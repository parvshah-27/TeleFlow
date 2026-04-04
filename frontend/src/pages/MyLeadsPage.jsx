import React, { useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import PhoneMask from '../components/PhoneMask';
import EmailMask from '../components/EmailMask';
import { Sparkles, RefreshCcw, Phone, MessageSquare, Layout, List, Eye, EyeOff } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const COLUMNS = [
    { id: 'New', title: 'New Leads', color: 'bg-blue-500' },
    { id: 'Call Back', title: 'Follow Up', color: 'bg-amber-500' },
    { id: 'Interested', title: 'Interested', color: 'bg-emerald-500' },
    { id: 'Not Interested', title: 'Not Interested', color: 'bg-slate-500' },
    { id: 'Wrong Number', title: 'Invalid', color: 'bg-red-500' }
];

const MyLeadsPage = ({
    user,
    filteredLeads,
    searchQuery,
    setSearchQuery,
    handleSelectLead,
    pagination,
    fetchLeads,
    handleUpdateStatus
}) => {
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
    const [revealedLeads, setRevealedLeads] = useState(new Set());

    const toggleReveal = (leadId) => {
        setRevealedLeads(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) next.delete(leadId);
            else next.add(leadId);
            return next;
        });
    };

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        handleUpdateStatus(draggableId, destination.droppableId);
    };

    const groupedLeads = COLUMNS.reduce((acc, col) => {
        acc[col.id] = (filteredLeads || []).filter(lead => (lead.status || 'New') === col.id);
        return acc;
    }, {});

    // Catch-all for other statuses
    const otherLeads = (filteredLeads || []).filter(lead => !COLUMNS.some(col => col.id === (lead.status || 'New')));
    if (otherLeads.length > 0) {
        if (!groupedLeads['New']) groupedLeads['New'] = [];
        groupedLeads['New'] = [...groupedLeads['New'], ...otherLeads];
    }

    return (
        <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">My Leads</h2>
                        <button
                            onClick={() => fetchLeads(pagination.currentPage, searchQuery)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                            title="Refresh Leads"
                        >
                            <RefreshCcw size={18} />
                        </button>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List size={14} />
                            Table
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layout size={14} />
                            Board
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="pl-4 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 text-slate-900 dark:text-white shadow-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {viewMode === 'table' ? (
                <Card className="p-0 overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Email</th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-center">Contact</th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {(filteredLeads || []).map((lead) => (
                                    <tr key={lead._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{lead.name || lead.Name || "N/A"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <EmailMask 
                                                email={lead.email || lead.Email} 
                                                isRevealed={revealedLeads.has(lead._id)} 
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {(lead.phone || lead.Phone) && (
                                                    <PhoneMask 
                                                        phone={lead.phone || lead.Phone} 
                                                        name={lead.name || lead.Name} 
                                                        user={user} 
                                                        isRevealed={revealedLeads.has(lead._id)}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center"><Badge status={lead.status} /></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 items-center">
                                                <Button
                                                    variant="primary"
                                                    className="py-1.5 px-3 text-[10px] uppercase tracking-widest font-black flex items-center gap-1 shadow-sm"
                                                    onClick={() => handleSelectLead(lead)}
                                                >
                                                    Process
                                                </Button>

                                                <button 
                                                    onClick={() => toggleReveal(lead._id)}
                                                    className={`p-2 rounded-lg transition-all border ${revealedLeads.has(lead._id) ? 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' : 'text-slate-400 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:text-slate-600'}`}
                                                    title={revealedLeads.has(lead._id) ? "Hide Details" : "Reveal Details"}
                                                >
                                                    {revealedLeads.has(lead._id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    className="py-1 px-3 text-[10px] font-black uppercase tracking-widest"
                                    disabled={pagination.currentPage === 1}
                                    onClick={() => fetchLeads(pagination.currentPage - 1, searchQuery)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="py-1 px-3 text-[10px] font-black uppercase tracking-widest"
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    onClick={() => fetchLeads(pagination.currentPage + 1, searchQuery)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-6 overflow-x-auto pb-6 -mx-2 px-2 scrollbar-hide">
                        {COLUMNS.map((column) => (
                            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${column.color}`} />
                                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">{column.title}</h3>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-black">
                                            {groupedLeads[column.id]?.length || 0}
                                        </span>
                                    </div>
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 min-h-[500px] p-3 rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-slate-50/50 dark:bg-slate-900/30'}`}
                                        >
                                            <div className="space-y-3">
                                                {groupedLeads[column.id]?.map((lead, index) => (
                                                    <Draggable key={lead._id} draggableId={lead._id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 scale-105' : 'hover:border-blue-200 dark:hover:border-blue-900/50'}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div>
                                                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-blue-600 transition-colors">
                                                                            {lead.name || lead.Name || "N/A"}
                                                                        </h4>
                                                                        <EmailMask 
                                                                            email={lead.email || lead.Email} 
                                                                            variant="compact" 
                                                                            isRevealed={revealedLeads.has(lead._id)}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                                                    <div className="flex items-center gap-1">
                                                                        <button 
                                                                            onClick={() => toggleReveal(lead._id)}
                                                                            className={`p-1.5 rounded-lg transition-all border ${revealedLeads.has(lead._id) ? 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' : 'text-slate-400 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:text-slate-600'}`}
                                                                            title={revealedLeads.has(lead._id) ? "Hide Details" : "Reveal Details"}
                                                                        >
                                                                            {revealedLeads.has(lead._id) ? <EyeOff size={12} /> : <Eye size={12} />}
                                                                        </button>
                                                                        
                                                                        {(lead.phone || lead.Phone) && (
                                                                            <PhoneMask 
                                                                                phone={lead.phone || lead.Phone} 
                                                                                name={lead.name || lead.Name} 
                                                                                user={user} 
                                                                                variant="compact"
                                                                                isRevealed={revealedLeads.has(lead._id)}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        variant="secondary"
                                                                        className="py-1 px-3 text-[9px] font-black uppercase tracking-widest shadow-none border-slate-100"
                                                                        onClick={() => handleSelectLead(lead)}
                                                                    >
                                                                        Details
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            )}
        </div>
    );
};

export default MyLeadsPage;

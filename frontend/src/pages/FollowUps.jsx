import React, { useState, useEffect } from "react";
import { getFollowUps, updateFollowUpStatus } from "../api/axios";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { Phone, CheckCircle2, Calendar as CalendarIcon, MessageSquare, ExternalLink, List, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const FollowUps = ({ onSelectLead }) => {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalFollowUps: 0 });

  const fetchFollowUps = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getFollowUps(page); 
      if (data.followUps) {
        setFollowUps(data.followUps);
        setPagination(data.pagination);
      } else {
        setFollowUps(data);
        setPagination({ currentPage: 1, totalPages: 1, totalFollowUps: data.length });
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchFollowUps(newPage);
    }
  };

  const handleUpdateStatus = async (id) => {
    try {
      await updateFollowUpStatus(id);
      toast.success("Follow-up marked as completed");
      setFollowUps(followUps.filter((followUp) => followUp._id !== id));
    } catch (error) {
      toast.error("Failed to update status");
      console.error("Error updating follow-up status:", error);
    }
  };

  const getUrgencyStatus = (dateString) => {
    const now = new Date();
    const scheduledTime = new Date(dateString);
    const diffInMinutes = (scheduledTime - now) / (1000 * 60);

    if (diffInMinutes < 0)
      return {
        label: "Overdue",
        style: "bg-red-100 text-red-700 border-red-200",
      };
    if (diffInMinutes <= 60)
      return {
        label: "Urgent",
        style: "bg-orange-100 text-orange-700 border-orange-200",
      };
    return {
      label: "Upcoming",
      style: "bg-blue-50 text-blue-700 border-blue-100",
    };
  };

  const handleCall = (phone) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const handleChat = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const getFollowUpsForDate = (date) => {
    return followUps.filter(fu => {
      const fuDate = new Date(fu.followUpDate);
      return fuDate.getDate() === date.getDate() &&
             fuDate.getMonth() === date.getMonth() &&
             fuDate.getFullYear() === date.getFullYear();
    });
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const count = getFollowUpsForDate(date).length;
      if (count > 0) {
        return <div className="mt-1 flex justify-center"><div className="w-1 h-1 bg-blue-600 rounded-full"></div></div>;
      }
    }
    return null;
  };

  if (loading && followUps.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sortedFollowUps = [...followUps].sort(
    (a, b) => new Date(a.followUpDate) - new Date(b.followUpDate),
  );

  const displayedFollowUps = viewMode === 'calendar' ? getFollowUpsForDate(selectedDate) : sortedFollowUps;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-blue-600" size={24} />
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Follow-Up Center
          </h2>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List size={14} />
            Queue
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid size={14} />
            Calendar
          </button>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <Card className="p-4 md:p-6 border-none shadow-xl shadow-slate-200/50 dark:shadow-none mb-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full flex justify-center custom-calendar-wrapper">
              <Calendar 
                onChange={setSelectedDate} 
                value={selectedDate}
                tileContent={tileContent}
                className="rounded-xl border-none font-sans"
              />
            </div>
            <div className="flex-1 w-full lg:max-w-md xl:max-w-none">
               <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                 Tasks for {selectedDate.toLocaleDateString([], { day: 'numeric', month: 'long' })}
               </h3>
               <div className="space-y-3">
                 {displayedFollowUps.length > 0 ? displayedFollowUps.map(fu => (
                    <div key={fu._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:border-blue-200 dark:hover:border-blue-900/50">
                       <div className="flex flex-col min-w-0">
                         <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{fu.lead?.name || "Unknown"}</span>
                         <span className="text-[10px] text-slate-500">{new Date(fu.followUpDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                       <Button variant="secondary" className="py-1 px-3 text-[10px] font-black flex-shrink-0 ml-4" onClick={() => onSelectLead(fu.lead)}>Details</Button>
                    </div>
                 )) : (
                   <div className="py-10 text-center text-slate-400 italic text-sm">No follow-ups for this date.</div>
                 )}
               </div>
            </div>
          </div>
        </Card>
      )}

      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedFollowUps.length === 0 ? (
            <div className="col-span-full py-20">
              <Card className="flex flex-col items-center justify-center py-12 text-slate-400 border-none shadow-xl">
                <CheckCircle2 size={48} className="mb-4 opacity-20 text-emerald-500" />
                <p className="font-bold uppercase tracking-widest text-xs">All caught up!</p>
              </Card>
            </div>
          ) : (
            displayedFollowUps.map((followUp) => {
              const urgency = getUrgencyStatus(followUp.followUpDate);
              return (
                <Card
                  key={followUp._id}
                  className="hover:border-blue-200 dark:hover:border-blue-900/50 transition-all border-t-4 shadow-xl shadow-slate-200/50 dark:shadow-none"
                  style={{
                    borderTopColor:
                      urgency.label === "Overdue"
                        ? "#ef4444"
                        : urgency.label === "Urgent"
                          ? "#f97316"
                          : "#3b82f6",
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {followUp.lead?.name ||
                          followUp.lead?.Name ||
                          "Unknown Lead"}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <CalendarIcon size={10} className="text-slate-400" />
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                          {new Date(followUp.followUpDate).toLocaleDateString([], {
                            day: "2-digit",
                            month: "short",
                          })} at {new Date(followUp.followUpDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${urgency.style}`}
                    >
                      {urgency.label}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl mb-6">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2 leading-relaxed">
                      "{followUp.notes || "No notes provided"}"
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest gap-2 shadow-md shadow-blue-200 dark:shadow-none"
                        disabled={!followUp.lead?.phone}
                        onClick={() => handleCall(followUp.lead.phone)}
                      >
                        <Phone size={12} />
                        Call
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest gap-2 bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20"
                        disabled={!followUp.lead?.phone}
                        onClick={() => handleChat(followUp.lead.phone)}
                      >
                        <MessageSquare size={12} />
                        WhatsApp
                      </Button>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-800 mt-2">
                      {onSelectLead && (
                        <Button
                          variant="secondary"
                          className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest gap-2 border-slate-100"
                          disabled={!followUp.lead}
                          onClick={() => onSelectLead(followUp.lead)}
                        >
                          <ExternalLink size={12} />
                          Details
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                        onClick={() => handleUpdateStatus(followUp._id)}
                      >
                        <CheckCircle2 size={12} />
                        Done
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {viewMode === 'list' && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalFollowUps} tasks)
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="py-1 px-3 text-[10px] font-black uppercase tracking-widest shadow-none"
              disabled={pagination.currentPage === 1 || loading}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              className="py-1 px-3 text-[10px] font-black uppercase tracking-widest shadow-none"
              disabled={pagination.currentPage === pagination.totalPages || loading}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUps;

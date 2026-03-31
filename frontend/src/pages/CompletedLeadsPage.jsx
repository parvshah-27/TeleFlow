import React, { useEffect, useState } from "react";
import { ClipboardCheck, MessageSquare, Phone, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../api/axios";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";

const CompletedLeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTelecaller, setSelectedTelecaller] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLeads: 0,
  });

  const fetchData = async (page = 1) => {
    setLoading(true);
    console.log("Fetching completed leads for page:", page);
    try {
      const [leadsRes, tcsRes] = await Promise.all([
        axios.get(`/leads/completed?page=${page}&limit=10`),
        axios.get("/admin/telecallers"),
      ]);

      console.log("Leads Response Data:", leadsRes.data);
      console.log("Telecallers Response Data:", tcsRes.data);

      if (
        leadsRes.data &&
        leadsRes.data.leads &&
        Array.isArray(leadsRes.data.leads)
      ) {
        setLeads(leadsRes.data.leads);
        setPagination(
          leadsRes.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalLeads: leadsRes.data.leads.length,
          },
        );
      } else if (Array.isArray(leadsRes.data)) {
        setLeads(leadsRes.data);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalLeads: leadsRes.data.length,
        });
      } else {
        console.warn("Unexpected leads response structure", leadsRes.data);
        setLeads([]);
        setPagination({ currentPage: 1, totalPages: 1, totalLeads: 0 });
      }

      setTelecallers(Array.isArray(tcsRes.data) ? tcsRes.data : []);
    } catch (err) {
      console.error("Fetch Data Error:", err);
      toast.error("Failed to load tracking data.");
      setLeads([]);
      setTelecallers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchData(newPage);
    }
  };

  // Calculate stats for all telecallers (based on currently loaded page or all if needed, but here simple display)
  const telecallerStats = telecallers.map((tc) => {
    const count = leads.filter(
      (lead) => lead.assignedTo?._id === tc._id,
    ).length;
    return { id: tc._id, name: tc.name, count };
  });

  const filteredLeads =
    selectedTelecaller === "all"
      ? leads
      : leads.filter(
          (lead) =>
            (lead.assignedTo?._id || "unassigned") === selectedTelecaller,
        );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Completed Leads Tracking
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Filter by Telecaller:
          </label>
          <select
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedTelecaller}
            onChange={(e) => setSelectedTelecaller(e.target.value)}
          >
            <option value="all">All Telecallers</option>
            {telecallers.map((tc) => (
              <option key={tc._id} value={tc._id}>
                {tc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {telecallerStats.map((tc, idx) => (
          <Card key={idx} className="p-4 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Telecaller
                </p>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                  {tc.name}
                </h4>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Loaded Page Count
                </p>
                <span className="text-2xl font-black text-blue-600">
                  {tc.count}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">Customer Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Completed By</th>
                <th className="px-6 py-4 font-medium">Last Notes</th>
                <th className="px-6 py-4 font-medium">Completion Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    Loading completed leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    No completed leads found for this selection.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-white">
                        {lead.name || lead.Name || "N/A"}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Phone size={10} />
                        {lead.phone || "No Phone"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={lead.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="text-blue-500" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {lead.assignedTo?.name || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2 max-w-xs">
                        <MessageSquare
                          size={14}
                          className="mt-0.5 text-slate-400 flex-shrink-0"
                        />
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                          {lead.notes ? `"${lead.notes}"` : "No notes provided"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(lead.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Showing page {pagination.currentPage} of {pagination.totalPages} (
              {pagination.totalLeads} total leads)
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
                disabled={
                  pagination.currentPage === pagination.totalPages || loading
                }
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

export default CompletedLeadsPage;

"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import * as XLSX from "xlsx";
import Image from "next/image";
import { FiEdit2, FiTrash2, FiDownload, FiCalendar, FiUser, FiMail, FiCheckCircle, FiXCircle, FiStar, FiClock, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface WeddingTimelineFeedback {
  _id: string;
  userId?: string;
  zaffaTime: string;
  selectedFeatures: { name: string; duration: number; enabled: boolean }[];
  events: {
    id: string;
    brideActivity: string;
    groomActivity: string;
    bridesmaidsActivity: string;
    groomsmenActivity: string;
    duration: number;
    timeLabel?: string;
  }[];
  feedback?: {
    easeOfUse: number;
    satisfaction: number;
    timeSaved: string;
    feelings: string[];
    recommend: string;
    comment?: string;
  };
  user?: { firstName: string; lastName: string; email: string; imageURL: string };
  subscription?: { hasSubscription: boolean; expiryDate: string | null };
  createdAt: string;
}

const WeddingTimelinePage = () => {
  const [timelines, setTimelines] = useState<WeddingTimelineFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"edit" | "delete">("edit");
  const [selectedTimeline, setSelectedTimeline] = useState<WeddingTimelineFeedback | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    easeOfUse: 0,
    satisfaction: 0,
    timeSaved: "",
    feelings: [] as string[],
    recommend: "",
    comment: "",
  });

  const limit = 10;

  useEffect(() => {
    fetchTimelines();
  }, [currentPage, searchTerm]);

  const fetchTimelines = useCallback(async () => {
    try {
      setLoading(true);
      const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
      const response = await axios.get(`/api/wedding-timeline?page=${currentPage}&limit=${limit}${searchQuery}`);
      setTimelines(response.data.data);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching wedding timelines:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = timelines.map((timeline) => ({
      "First Name": timeline.user?.firstName || "N/A",
      "Last Name": timeline.user?.lastName || "N/A",
      Email: timeline.user?.email || "N/A",
      "Zaffa Time": timeline.zaffaTime,
      "Events Count": timeline.events.length,
      "Has Subscription": timeline.subscription?.hasSubscription ? "Yes" : "No",
      "Ease of Use": timeline.feedback?.easeOfUse || "N/A",
      Satisfaction: timeline.feedback?.satisfaction || "N/A",
      "Time Saved": timeline.feedback?.timeSaved || "N/A",
      Feelings: timeline.feedback?.feelings?.join(", ") || "N/A",
      Recommend: timeline.feedback?.recommend || "N/A",
      Comment: timeline.feedback?.comment || "N/A",
      "Created At": new Date(timeline.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Wedding Timelines");
    XLSX.writeFile(workbook, "wedding-timelines.xlsx");
  };

  const openModal = (type: "edit" | "delete", timeline: WeddingTimelineFeedback) => {
    setModalType(type);
    setSelectedTimeline(timeline);
    if (type === "edit" && timeline.feedback) {
      setFormData({
        easeOfUse: timeline.feedback.easeOfUse,
        satisfaction: timeline.feedback.satisfaction,
        timeSaved: timeline.feedback.timeSaved,
        feelings: timeline.feedback.feelings || [],
        recommend: timeline.feedback.recommend,
        comment: timeline.feedback.comment || "",
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTimeline(null);
  };

  const handleDelete = async () => {
    if (!selectedTimeline) return;
    try {
      await axios.delete(`/api/wedding-timeline?id=${selectedTimeline._id}`);
      fetchTimelines();
      closeModal();
    } catch (error) {
      console.error("Error deleting timeline:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimeline) return;
    try {
      await axios.put(`/api/wedding-timeline?id=${selectedTimeline._id}`, { feedback: formData });
      fetchTimelines();
      closeModal();
    } catch (error) {
      console.error("Error updating timeline:", error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar key={star} className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} size={14} />
      ))}
    </div>
  );

  const toggleFeeling = (feeling: string) => {
    setFormData({
      ...formData,
      feelings: formData.feelings.includes(feeling)
        ? formData.feelings.filter((f) => f !== feeling)
        : [...formData.feelings, feeling],
    });
  };

  const feelingsOptions = [
    "less_stressed",
    "more_organized",
    "confident",
    "excited",
    "relieved",
    "overwhelmed",
    "creative",
    "prepared",
  ];

  const formatFeeling = (feeling: string) => {
    return feeling.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-7xl p-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Wedding Timelines</h1>
            <p className="mt-1 text-sm text-gray-600">View and manage user wedding timelines</p>
          </div>
          <button onClick={exportToExcel} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white shadow-lg hover:opacity-90">
            <FiDownload /> Export to Excel
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 pr-10 text-gray-900 placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
              >
                <FiXCircle size={20} />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-gray-600">
              Showing results for: <span className="font-semibold text-primary">&quot;{searchTerm}&quot;</span>
            </p>
          )}
        </motion.div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-primary p-5 text-white shadow-lg">
            <p className="text-sm opacity-90">Total Timelines</p>
            <p className="mt-2 text-3xl font-bold">{total}</p>
          </div>
          <div className="rounded-lg bg-primary  p-5 text-white shadow-lg">
            <p className="text-sm opacity-90">Subscribed Users</p>
            <p className="mt-2 text-3xl font-bold">{timelines.filter((t) => t.subscription?.hasSubscription).length}</p>
          </div>
          <div className="rounded-lg bg-primary p-5 text-white shadow-lg">
            <p className="text-sm">Avg Ease of Use</p>
            <p className="mt-2 text-3xl font-bold">
              {(() => {
                const timelinesWithFeedback = timelines.filter((t) => t.feedback?.easeOfUse && t.feedback.easeOfUse > 0);
                if (timelinesWithFeedback.length === 0) return "0";
                const avg = timelinesWithFeedback.reduce((acc, t) => acc + (t.feedback?.easeOfUse || 0), 0) / timelinesWithFeedback.length;
                return avg.toFixed(1);
              })()}
              /5
            </p>
          </div>
          <div className="rounded-lg bg-primary p-5 text-white shadow-lg">
            <p className="text-sm">Avg Satisfaction</p>
            <p className="mt-2 text-3xl font-bold">
              {(() => {
                const timelinesWithFeedback = timelines.filter((t) => t.feedback?.satisfaction && t.feedback.satisfaction > 0);
                if (timelinesWithFeedback.length === 0) return "0";
                const avg = timelinesWithFeedback.reduce((acc, t) => acc + (t.feedback?.satisfaction || 0), 0) / timelinesWithFeedback.length;
                return avg.toFixed(1);
              })()}
              /5
            </p>
          </div>
        </div>

        {/* Records List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {timelines.map((timeline, idx) => (
              <motion.div
                key={timeline._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="overflow-hidden rounded-lg bg-white shadow-lg"
              >
                {/* Collapsed View - User Data & Date */}
                <div
                  onClick={() => toggleExpand(timeline._id)}
                  className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primaryLight text-white">
                      {timeline.user?.imageURL ? (
                        <Image
                          src={timeline.user.imageURL}
                          alt={`${timeline.user.firstName} ${timeline.user.lastName}`}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FiUser size={28} />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary">
                        {timeline.user?.firstName} {timeline.user?.lastName}
                      </p>
                      <p className="flex items-center gap-1 text-sm text-gray-600">
                        <FiMail size={14} />
                        {timeline.user?.email}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <FiCalendar size={12} />
                          {new Date(timeline.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {timeline.subscription?.hasSubscription ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            <FiCheckCircle size={12} /> Subscribed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                            <FiXCircle size={12} /> Not Subscribed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal("edit", timeline);
                        }}
                        className="rounded-lg bg-primary p-2 text-white hover:opacity-90"
                      >
                        <FiEdit2 size={16} />
                      </button> */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal("delete", timeline);
                        }}
                        className="rounded-lg bg-red-600 p-2 text-white hover:opacity-90"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    {expandedId === timeline._id ? (
                      <FiChevronUp size={24} className="text-primary" />
                    ) : (
                      <FiChevronDown size={24} className="text-primary" />
                    )}
                  </div>
                </div>

                {/* Expanded View - Full Details */}
                <AnimatePresence>
                  {expandedId === timeline._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 bg-creamey"
                    >
                      <div className="p-6">
                        {/* Zaffa Time */}
                        {/* <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
                          <FiClock size={20} />
                          <span>Zaffa Time: {timeline.zaffaTime}</span>
                        </div> */}

                        {/* Timeline Events Table */}
                        <div className="mb-6 overflow-x-auto rounded-lg bg-white shadow">
                          <table className="w-full text-sm">
                            <thead className="bg-primary text-white">
                              <tr>
                                <th className="px-4 py-3 text-left">Time</th>
                                <th className="px-4 py-3 text-left">Bride</th>
                                <th className="px-4 py-3 text-left">Groom</th>
                                <th className="px-4 py-3 text-left">Bridesmaids</th>
                                <th className="px-4 py-3 text-left">Groomsmen</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {timeline.events.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-semibold text-primary">{event.timeLabel}</td>
                                  <td className="px-4 py-3">{event.brideActivity || "-"}</td>
                                  <td className="px-4 py-3">{event.groomActivity || "-"}</td>
                                  <td className="px-4 py-3">{event.bridesmaidsActivity || "-"}</td>
                                  <td className="px-4 py-3">{event.groomsmenActivity || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Feedback Section */}
                        {timeline.feedback && (
                          <div className="rounded-lg bg-white p-5 shadow">
                            <h3 className="mb-4 text-lg font-bold text-primary">User Feedback</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-sm font-medium text-gray-700">Ease of Use</p>
                                {renderStars(timeline.feedback.easeOfUse)}
                              </div>
                              <div>
                                <p className="mb-1 text-sm font-medium text-gray-700">Satisfaction</p>
                                {renderStars(timeline.feedback.satisfaction)}
                              </div>
                              <div>
                                <p className="mb-1 text-sm font-medium text-gray-700">Time Saved</p>
                                <p className="text-primary font-semibold">{timeline.feedback.timeSaved}</p>
                              </div>
                              <div>
                                <p className="mb-1 text-sm font-medium text-gray-700">Would Recommend</p>
                                <p className="text-primary font-semibold">
                                  {timeline.feedback.recommend?.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                </p>
                              </div>
                              {timeline.feedback.feelings && timeline.feedback.feelings.length > 0 && (
                                <div className="md:col-span-2">
                                  <p className="mb-2 text-sm font-medium text-gray-700">Feelings</p>
                                  <div className="flex flex-wrap gap-2">
                                    {timeline.feedback.feelings.map((feeling) => (
                                      <span
                                        key={feeling}
                                        className="rounded-full bg-primaryLight bg-opacity-20 px-3 py-1 text-sm font-medium text-primary"
                                      >
                                        {formatFeeling(feeling)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {timeline.feedback.comment && (
                                <div className="md:col-span-2">
                                  <p className="mb-1 text-sm font-medium text-gray-700">Comment</p>
                                  <p className="italic text-gray-600">&quot;{timeline.feedback.comment}&quot;</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg bg-creamey px-4 py-2 text-primary disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`rounded-lg px-4 py-2 ${currentPage === page ? "bg-primary text-white" : "bg-creamey text-primary"}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg bg-creamey px-4 py-2 text-primary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl"
            >
              {modalType === "delete" ? (
                <div>
                  <h2 className="mb-4 text-xl font-bold text-primary">Confirm Deletion</h2>
                  <p className="mb-6 text-gray-600">Are you sure you want to delete this timeline? This action cannot be undone.</p>
                  <div className="flex justify-end gap-3">
                    <button onClick={closeModal} className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300">
                      Cancel
                    </button>
                    <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h2 className="mb-4 text-xl font-bold text-primary">Edit Feedback</h2>
                  <div className="mb-4 rounded-lg bg-creamey p-3">
                    <p className="text-sm">
                      <strong>User:</strong> {selectedTimeline?.user?.firstName} {selectedTimeline?.user?.lastName}
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> {selectedTimeline?.user?.email}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Ease of Use</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setFormData({ ...formData, easeOfUse: star })}>
                            <FiStar size={28} className={star <= formData.easeOfUse ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Satisfaction</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setFormData({ ...formData, satisfaction: star })}>
                            <FiStar size={28} className={star <= formData.satisfaction ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Time Saved</label>
                      <select
                        value={formData.timeSaved}
                        onChange={(e) => setFormData({ ...formData, timeSaved: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="">Select</option>
                        <option value="2-7 days">2-7 Days</option>
                        <option value="7-14 days">7-14 Days</option>
                        <option value="era">An Era (Life-Changing!)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Feelings (Select multiple)</label>
                      <div className="flex flex-wrap gap-2">
                        {feelingsOptions.map((feeling) => (
                          <button
                            key={feeling}
                            type="button"
                            onClick={() => toggleFeeling(feeling)}
                            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                              formData.feelings.includes(feeling)
                                ? "bg-primary text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {formatFeeling(feeling)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Recommend</label>
                      <select
                        value={formData.recommend}
                        onChange={(e) => setFormData({ ...formData, recommend: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="">Select</option>
                        <option value="definitely_not">Definitely Not</option>
                        <option value="maybe">Maybe</option>
                        <option value="definitely_yes">Definitely Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Comment</label>
                      <textarea
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="Enter feedback comment..."
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={closeModal} className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300">
                      Cancel
                    </button>
                    <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-white hover:opacity-90">
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DefaultLayout>
  );
};

export default WeddingTimelinePage;

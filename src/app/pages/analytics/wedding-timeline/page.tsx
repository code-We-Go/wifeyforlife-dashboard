"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import * as XLSX from "xlsx";
import Image from "next/image";
import { 
  FiUser, 
  FiMail, 
  FiCheckCircle, 
  FiXCircle, 
  FiCalendar, 
  FiDownload,
  FiFilter,
  FiBarChart2,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiArrowLeft,
  FiArrowUp,
  FiArrowDown,
  FiStar,
  FiChevronDown,
  FiChevronUp
} from "react-icons/fi";
import { useRouter } from "next/navigation";
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
  exported?: number;
  createdAt: string;
}

type TabType = "users" | "insights" | "feedback";
type SubscriptionFilter = "all" | "subscribed" | "not_subscribed";

const WeddingTimelineAnalyticsPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [timelines, setTimelines] = useState<WeddingTimelineFeedback[]>([]);
  const [allTimelines, setAllTimelines] = useState<WeddingTimelineFeedback[]>([]);
  const [filteredTimelines, setFilteredTimelines] = useState<WeddingTimelineFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [apiStats, setApiStats] = useState({
    subscribedUsersCount: 0,
    avgEaseOfUse: 0,
    avgSatisfaction: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>("all");
  const [exportSortOrder, setExportSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const limit = 10;

  useEffect(() => {
    fetchTimelines();
    fetchAllTimelines();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [timelines, searchTerm, subscriptionFilter]);

  const fetchTimelines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/wedding-timeline?page=${currentPage}&limit=${limit}`);
      setTimelines(response.data.data);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
      setApiStats(response.data.stats || {
        subscribedUsersCount: 0,
        avgEaseOfUse: 0,
        avgSatisfaction: 0,
      });
    } catch (error) {
      console.error("Error fetching wedding timelines:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchAllTimelines = useCallback(async () => {
    try {
      // Fetch all timelines without pagination for accurate stats
      const response = await axios.get(`/api/wedding-timeline?page=1&limit=10000`);
      setAllTimelines(response.data.data);
    } catch (error) {
      console.error("Error fetching all wedding timelines:", error);
    }
  }, []);

  const applyFilters = () => {
    let filtered = [...timelines];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((timeline) => {
        const firstName = timeline.user?.firstName?.toLowerCase() || "";
        const lastName = timeline.user?.lastName?.toLowerCase() || "";
        const email = timeline.user?.email?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();
        return firstName.includes(search) || lastName.includes(search) || email.includes(search);
      });
    }

    // Apply subscription filter
    if (subscriptionFilter === "subscribed") {
      filtered = filtered.filter((timeline) => timeline.subscription?.hasSubscription);
    } else if (subscriptionFilter === "not_subscribed") {
      filtered = filtered.filter((timeline) => !timeline.subscription?.hasSubscription);
    }

    setFilteredTimelines(filtered);
  };

  const exportToExcel = () => {
    const exportData = filteredTimelines.map((timeline) => ({
      "First Name": timeline.user?.firstName || "N/A",
      "Last Name": timeline.user?.lastName || "N/A",
      Email: timeline.user?.email || "N/A",
      "Zaffa Time": timeline.zaffaTime,
      "Events Count": timeline.events.length,
      "Has Subscription": timeline.subscription?.hasSubscription ? "Yes" : "No",
      "Subscription Expiry": timeline.subscription?.expiryDate 
        ? new Date(timeline.subscription.expiryDate).toLocaleDateString() 
        : "N/A",
      "Ease of Use": timeline.feedback?.easeOfUse || "N/A",
      Satisfaction: timeline.feedback?.satisfaction || "N/A",
      "Time Saved": timeline.feedback?.timeSaved || "N/A",
      Recommend: timeline.feedback?.recommend || "N/A",
      "Created At": new Date(timeline.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Wedding Timeline Users");
    XLSX.writeFile(workbook, "wedding-timeline-analytics.xlsx");
  };

  const calculateStats = () => {
    // Use API stats for all-time data
    const subscribedCount = apiStats.subscribedUsersCount;
    const notSubscribedCount = total - subscribedCount;
    
    // Export statistics from all timelines
    const totalExports = allTimelines.reduce((acc, t) => acc + (t.exported || 0), 0);
    const timelinesExported = allTimelines.filter((t) => t.exported && t.exported > 0).length;
    const exportRate = total > 0 ? ((timelinesExported / total) * 100).toFixed(1) : "0";

    return {
      total: total,
      subscribedCount,
      notSubscribedCount,
      avgEaseOfUse: apiStats.avgEaseOfUse.toString(),
      avgSatisfaction: apiStats.avgSatisfaction.toString(),
      subscriptionRate: total > 0 ? ((subscribedCount / total) * 100).toFixed(1) : "0",
      totalExports,
      timelinesExported,
      exportRate
    };
  };

  const stats = calculateStats();

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

  const formatFeeling = (feeling: string) => {
    return feeling.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Subscription Breakdown Cards */}
      {loading ? (
        // Skeleton loaders
        <div className="grid gap-6 md:grid-cols-2">
          {/* Subscription Breakdown Skeleton */}
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200"></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-gray-200"></div>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                </div>
                <div className="h-6 w-12 animate-pulse rounded bg-gray-200"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-gray-200"></div>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                </div>
                <div className="h-6 w-12 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
          </div>

          {/* Quick Stats Skeleton */}
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200"></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                <div className="h-6 w-12 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Actual stats cards
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg bg-white p-6 shadow-lg"
          >
            <h3 className="mb-4 text-lg font-bold text-primary">Subscription Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                  <span className="text-gray-700">Subscribed Users</span>
                </div>
                <span className="font-bold text-gray-900">{stats.subscribedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                  <span className="text-gray-700">Not Subscribed</span>
                </div>
                <span className="font-bold text-gray-900">{stats.notSubscribedCount}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg bg-white p-6 shadow-lg"
          >
            <h3 className="mb-4 text-lg font-bold text-primary">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Total Timelines</span>
                <span className="font-bold text-gray-900">{stats.total}</span>
              </div>
              {/* <div className="flex items-center justify-between">
                <span className="text-gray-700">Conversion Rate</span>
                <span className="font-bold text-gray-900">{stats.subscriptionRate}%</span>
              </div> */}
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Search Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <FiFilter className="inline mr-2" />
            Search Users
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          />
        </div>

        {/* Subscription Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <FiCheckCircle className="inline mr-2" />
            Subscription Status
          </label>
          <select
            value={subscriptionFilter}
            onChange={(e) => setSubscriptionFilter(e.target.value as SubscriptionFilter)}
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          >
            <option value="all">All Users</option>
            <option value="subscribed">Subscribed Only</option>
            <option value="not_subscribed">Not Subscribed</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-primary">{filteredTimelines.length}</span> of{" "}
          <span className="font-semibold text-primary">{timelines.length}</span> users
        </p>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white shadow-lg hover:opacity-90"
        >
          <FiDownload size={16} />
          Export
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTimelines.map((timeline, idx) => (
            <motion.div
              key={timeline._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="overflow-hidden rounded-lg bg-white shadow-lg"
            >
              {/* Collapsed View */}
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                        {timeline.events.length} events
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {expandedId === timeline._id ? (
                    <FiChevronUp size={24} className="text-primary" />
                  ) : (
                    <FiChevronDown size={24} className="text-primary" />
                  )}
                </div>
              </div>

              {/* Expanded View */}
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
                        (timeline.feedback.easeOfUse && timeline.feedback.easeOfUse > 0) ||
                        (timeline.feedback.satisfaction && timeline.feedback.satisfaction > 0) ||
                        (timeline.feedback.comment && timeline.feedback.comment.trim().length > 0) ||
                        (timeline.feedback.timeSaved && timeline.feedback.timeSaved !== '') ||
                        (timeline.feedback.recommend && timeline.feedback.recommend !== '') ||
                        (timeline.feedback.feelings && timeline.feedback.feelings.length > 0)
                      ) && (
                        <div className="rounded-lg bg-white p-5 shadow">
                          <h3 className="mb-4 text-lg font-bold text-primary">User Feedback</h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            {timeline.feedback.easeOfUse && timeline.feedback.easeOfUse > 0 && (
                              <div>
                                <p className="mb-1 text-sm font-medium text-gray-700">Ease of Use</p>
                                {renderStars(timeline.feedback.easeOfUse)}
                              </div>
                            )}
                            {timeline.feedback.satisfaction && timeline.feedback.satisfaction > 0 && (
                              <div>
                                <p className="mb-1 text-sm font-medium text-gray-700">Satisfaction</p>
                                {renderStars(timeline.feedback.satisfaction)}
                              </div>
                            )}
                            {timeline.feedback.timeSaved && timeline.feedback.timeSaved !== '' && (
                              <div>
                                <p className="mb-1 text-sm font-medium text-gray-700">Time Saved</p>
                                <p className="text-primary font-semibold">{timeline.feedback.timeSaved}</p>
                              </div>
                            )}
                            {timeline.feedback.recommend && timeline.feedback.recommend !== '' && (
                              <div>
                                <p className="mb-1 text-sm font-medium text-gray-700">Would Recommend</p>
                                <p className="text-primary font-semibold">
                                  {timeline.feedback.recommend?.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                </p>
                              </div>
                            )}
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
                            {timeline.feedback.comment && timeline.feedback.comment.trim().length > 0 && (
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
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* User Engagement Metrics */}
      {/* <div>
        <h2 className="mb-4 text-xl font-bold text-gray-800">User Engagement</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-gradient-to-br from-primary to-primaryLight p-6 text-white shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Subscription Rate</h3>
              <FiTrendingUp size={24} />
            </div>
            <p className="text-4xl font-bold">{stats.subscriptionRate}%</p>
            <p className="mt-2 text-sm opacity-90">
              {stats.subscribedCount} of {stats.total} users subscribed
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Avg Ease of Use</h3>
              <FiBarChart2 size={24} />
            </div>
            <p className="text-4xl font-bold">{stats.avgEaseOfUse}/5</p>
            <p className="mt-2 text-sm opacity-90">User experience rating</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Avg Satisfaction</h3>
              <FiBarChart2 size={24} />
            </div>
            <p className="text-4xl font-bold">{stats.avgSatisfaction}/5</p>
            <p className="mt-2 text-sm opacity-90">Overall satisfaction rating</p>
          </motion.div>
        </div>
      </div> */}

      {/* Export Analytics */}
      <div>
        {/* <h2 className="mb-4 text-xl font-bold text-gray-800">Export Analytics</h2> */}
        {loading ? (
          // Skeleton loaders for export cards
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg bg-primary p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-6 w-32 animate-pulse rounded bg-white/20"></div>
                  <div className="h-6 w-6 animate-pulse rounded-full bg-white/20"></div>
                </div>
                <div className="h-10 w-24 animate-pulse rounded bg-white/20"></div>
                <div className="mt-2 h-4 w-40 animate-pulse rounded bg-white/20"></div>
              </div>
            ))}
          </div>
        ) : (
          // Actual export cards
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Total Exports Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-lg bg-primary p-6 text-white shadow-lg"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Total Exports</h3>
                <FiDownload size={24} />
              </div>
              <p className="text-4xl font-bold">{stats.totalExports}</p>
              <p className="mt-2 text-sm opacity-90">All-time PDF exports</p>
            </motion.div>

            {/* Export Rate Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-lg bg-primary p-6 text-white shadow-lg"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Export Rate</h3>
                <FiTrendingUp size={24} />
              </div>
              <p className="text-4xl font-bold">{stats.exportRate}%</p>
              <p className="mt-2 text-sm opacity-90">
                {stats.timelinesExported} of {stats.total} timelines exported
              </p>
            </motion.div>

            {/* Timelines Exported Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-lg bg-primary p-6 text-white shadow-lg"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Unique Exports</h3>
                <FiCheckCircle size={24} />
              </div>
              <p className="text-4xl font-bold">{stats.timelinesExported}</p>
              <p className="mt-2 text-sm opacity-90">Timelines exported at least once</p>
            </motion.div>
          </div>
        )}
        
        {/* Timeline Export List */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Timeline Export Details</h3>
            <button
              onClick={() => setExportSortOrder(exportSortOrder === "desc" ? "asc" : "desc")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:opacity-90 transition-opacity"
            >
              {exportSortOrder === "desc" ? (
                <>
                  <FiArrowDown size={16} />
                  Highest First
                </>
              ) : (
                <>
                  <FiArrowUp size={16} />
                  Lowest First
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {[...allTimelines]
              .sort((a, b) => {
                const aExports = a.exported || 0;
                const bExports = b.exported || 0;
                return exportSortOrder === "desc" 
                  ? bExports - aExports 
                  : aExports - bExports;
              })
              .map((timeline, idx) => (
                <motion.div
                  key={timeline._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="overflow-hidden rounded-lg bg-white shadow-lg"
                >
                  {/* Collapsed View */}
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
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            (timeline.exported || 0) > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <FiDownload size={12} />
                            {timeline.exported || 0} {(timeline.exported || 0) === 1 ? 'export' : 'exports'}
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
                    <div>
                      {expandedId === timeline._id ? (
                        <FiChevronUp size={24} className="text-primary" />
                      ) : (
                        <FiChevronDown size={24} className="text-primary" />
                      )}
                    </div>
                  </div>

                  {/* Expanded View */}
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
                            (timeline.feedback.easeOfUse && timeline.feedback.easeOfUse > 0) ||
                            (timeline.feedback.satisfaction && timeline.feedback.satisfaction > 0) ||
                            (timeline.feedback.comment && timeline.feedback.comment.trim().length > 0) ||
                            (timeline.feedback.timeSaved && timeline.feedback.timeSaved !== '') ||
                            (timeline.feedback.recommend && timeline.feedback.recommend !== '') ||
                            (timeline.feedback.feelings && timeline.feedback.feelings.length > 0)
                          ) && (
                            <div className="rounded-lg bg-white p-5 shadow">
                              <h3 className="mb-4 text-lg font-bold text-primary">User Feedback</h3>
                              <div className="grid gap-4 md:grid-cols-2">
                                {timeline.feedback.easeOfUse && timeline.feedback.easeOfUse > 0 && (
                                  <div>
                                    <p className="mb-1 text-sm font-medium text-gray-700">Ease of Use</p>
                                    {renderStars(timeline.feedback.easeOfUse)}
                                  </div>
                                )}
                                {timeline.feedback.satisfaction && timeline.feedback.satisfaction > 0 && (
                                  <div>
                                    <p className="mb-1 text-sm font-medium text-gray-700">Satisfaction</p>
                                    {renderStars(timeline.feedback.satisfaction)}
                                  </div>
                                )}
                                {timeline.feedback.timeSaved && timeline.feedback.timeSaved !== '' && (
                                  <div>
                                    <p className="mb-1 text-sm font-medium text-gray-700">Time Saved</p>
                                    <p className="text-primary font-semibold">{timeline.feedback.timeSaved}</p>
                                  </div>
                                )}
                                {timeline.feedback.recommend && timeline.feedback.recommend !== '' && (
                                  <div>
                                    <p className="mb-1 text-sm font-medium text-gray-700">Would Recommend</p>
                                    <p className="text-primary font-semibold">
                                      {timeline.feedback.recommend?.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                    </p>
                                  </div>
                                )}
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
                                {timeline.feedback.comment && timeline.feedback.comment.trim().length > 0 && (
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
        </div>
      </div>
    </div>
  );

  const renderFeedbackTab = () => {
    // Filter for timelines with real user feedback (not default values) from ALL timelines
    const timelinesWithFeedback = allTimelines.filter((t) => 
      t.feedback && (
        (t.feedback.easeOfUse && t.feedback.easeOfUse > 0) ||
        (t.feedback.satisfaction && t.feedback.satisfaction > 0) ||
        (t.feedback.comment && t.feedback.comment.trim().length > 0) ||
        (t.feedback.timeSaved && t.feedback.timeSaved !== '') ||
        (t.feedback.recommend && t.feedback.recommend !== '') ||
        (t.feedback.feelings && t.feedback.feelings.length > 0)
      )
    );
    
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-bold text-primary">User Feedback Summary</h3>
          <p className="text-sm text-gray-600">
            {timelinesWithFeedback.length} users have provided feedback
          </p>
        </div>

        <div className="space-y-4">
          {timelinesWithFeedback.map((timeline, idx) => (
            <motion.div
              key={timeline._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-lg bg-white p-6 shadow-lg"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primaryLight text-white">
                  {timeline.user?.imageURL ? (
                    <Image
                      src={timeline.user.imageURL}
                      alt={`${timeline.user?.firstName} ${timeline.user?.lastName}`}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FiUser size={20} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {timeline.user?.firstName} {timeline.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{timeline.user?.email}</p>
                </div>
              </div>

              {timeline.feedback && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">Ease of Use</p>
                    <p className="text-lg font-bold text-primary">{timeline.feedback.easeOfUse}/5</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">Satisfaction</p>
                    <p className="text-lg font-bold text-primary">{timeline.feedback.satisfaction}/5</p>
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
                  {timeline.feedback.comment && (
                    <div className="md:col-span-2">
                      <p className="mb-1 text-sm font-medium text-gray-700">Comment</p>
                      <p className="italic text-gray-600">&quot;{timeline.feedback.comment}&quot;</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-7xl p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="mb-4">
            <button
              onClick={() => router.push('/pages/wedding-timeline')}
              className="flex items-center gap-2 text-primary hover:text-primaryLight transition-colors"
            >
              <FiArrowLeft size={20} />
              <span className="font-medium">Back to Wedding Timelines</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-primary">Wedding Timeline Analytics</h1>
          {/* <p className="mt-1 text-sm text-gray-600">
            Comprehensive analytics and insights for wedding timeline users
          </p> */}
        </motion.div>

        {/* Stats Overview */}
        {/* <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-primary p-5 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Users</p>
                <p className="mt-2 text-3xl font-bold">{stats.total}</p>
              </div>
              <FiUsers size={32} className="opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg bg-green-600 p-5 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Subscribed</p>
                <p className="mt-2 text-3xl font-bold">{stats.subscribedCount}</p>
              </div>
              <FiCheckCircle size={32} className="opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg bg-blue-600 p-5 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Ease of Use</p>
                <p className="mt-2 text-3xl font-bold">{stats.avgEaseOfUse}/5</p>
              </div>
              <FiBarChart2 size={32} className="opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg bg-purple-600 p-5 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Conversion Rate</p>
                <p className="mt-2 text-3xl font-bold">{stats.subscriptionRate}%</p>
              </div>
              <FiTrendingUp size={32} className="opacity-80" />
            </div>
          </motion.div>
        </div> */}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
                activeTab === "users"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              <FiUsers size={18} />
              Users
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
                activeTab === "insights"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              <FiBarChart2 size={18} />
              Insights
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
                activeTab === "feedback"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              <FiClock size={18} />
              Feedback
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "users" && renderUsersTab()}
            {activeTab === "insights" && renderInsightsTab()}
            {activeTab === "feedback" && renderFeedbackTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </DefaultLayout>
  );
};

export default WeddingTimelineAnalyticsPage;

"use client";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { IUser } from "@/app/models/userModel";

// ─── Types ───────────────────────────────────────────────────────────────────
interface NotificationSummary {
  _id: string;
  title: string;
  body: string;
  link?: string;
  targetType: "all" | "specific";
  totalRecipients: number;
  seenCount: number;
  unseenCount: number;
  deliveryStats: {
    requested: number;
    delivered: number;
    failed: number;
  };
  createdAt: string;
}

interface RecipientDetail {
  userId: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    imageURL?: string;
  };
  seen: boolean;
  seenAt?: string;
}

interface NotificationDetail {
  _id: string;
  title: string;
  body: string;
  link?: string;
  targetType: "all" | "specific";
  recipients: RecipientDetail[];
  deliveryStats: {
    requested: number;
    delivered: number;
    failed: number;
  };
  createdAt: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
const NotificationsPage = () => {
  // Send form state
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [users, setUsers] = useState<IUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);

  // History state
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Detail modal state
  const [detailNotification, setDetailNotification] =
    useState<NotificationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Data Fetching ───────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get("/api/notifications");
      setNotifications(res.data.data.notifications);
    } catch (error) {
      console.error("Error fetching notification history:", error);
      toast.error("Failed to load notification history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (targetType === "specific" && users.length === 0) {
      fetchUsers();
    }
  }, [targetType]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await axios.get("/api/users?all=true");
      setUsers(res.data.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users for selection.");
    } finally {
      setUsersLoading(false);
    }
  };

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleUserToggle = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both a title and a message.");
      return;
    }

    if (targetType === "specific" && selectedUserIds.length === 0) {
      toast.error("Please select at least one user.");
      return;
    }

    setLoading(true);
    setLastResult(null);
    try {
      const payload = {
        userIds: targetType === "all" ? ["all"] : selectedUserIds,
        title: title.trim(),
        message: message.trim(),
        link: link.trim(),
      };

      const res = await axios.post("/api/notifications", payload);
      const data = res.data.data;
      setLastResult(data);

      toast.success(
        `Notifications sent! Delivered: ${data.delivered}, Failed: ${data.failed}`,
      );

      // Reset form
      setTitle("");
      setMessage("");
      setLink("");
      if (targetType === "specific") {
        setSelectedUserIds([]);
        setTargetType("all");
      }

      // Refresh history
      fetchNotifications();
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      toast.error(
        error.response?.data?.error || "Failed to send notifications.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await axios.get(`/api/notifications/${id}`);
      setDetailNotification(res.data.data.notification);
    } catch (error) {
      console.error("Error fetching notification detail:", error);
      toast.error("Failed to load notification details.");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/notifications?id=${deleteId}`);
      toast.success("Notification deleted.");
      setDeleteId(null);
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeenPercentage = (seen: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((seen / total) * 100);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <DefaultLayout>
      <Toaster position="top-right" />
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-6 bg-backgroundColor px-4 py-6 md:px-8">
        {/* ═══ SEND FORM ═══ */}
        <div className="w-full max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-1 text-2xl font-bold text-gray-800">
            Push Notifications
          </h2>
          <p className="mb-8 text-gray-500">
            Send push notifications to your mobile app users.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Target Audience
              </label>
              <div className="flex items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="targetType"
                    value="all"
                    checked={targetType === "all"}
                    onChange={() => setTargetType("all")}
                    className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                  />
                  <span>All Users (with active push tokens)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="targetType"
                    value="specific"
                    checked={targetType === "specific"}
                    onChange={() => setTargetType("specific")}
                    className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                  />
                  <span>Specific Users</span>
                </label>
              </div>
            </div>

            {/* User Selection List */}
            {targetType === "specific" && (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 p-4">
                {usersLoading ? (
                  <div className="py-4 text-center text-gray-500">
                    Loading users...
                  </div>
                ) : users.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">
                    No users found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <label
                        key={user._id as string}
                        className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(
                            user._id as string,
                          )}
                          onChange={() =>
                            handleUserToggle(user._id as string)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        <span className="text-sm font-medium">
                          {user.username}{" "}
                          <span className="text-xs text-gray-500">
                            ({user.email})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Notification Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g., New Workshop Available!"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter the notification message here..."
                required
              />
            </div>

            {/* Link */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Link (Optional)
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g., https://yourapp.com/workshop/123 or app://workshop/123"
              />
              <p className="mt-1 text-xs text-gray-500">
                Add a URL to direct the user when they tap the notification.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-semibold text-white transition-all hover:bg-opacity-90 disabled:opacity-50"
              >
                {loading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                )}
                Send Notification
              </button>
            </div>
          </form>

          {/* Send Result */}
          {lastResult && (
            <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-800">
                Expo Push Delivery Result
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Tokens
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {lastResult.tokenCount}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Accepted
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {lastResult.sendAccepted}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Rejected
                  </p>
                  <p className="text-xl font-bold text-red-500">
                    {lastResult.sendRejected}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Delivered
                  </p>
                  <p className="text-xl font-bold text-green-700">
                    {lastResult.delivered}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Failed
                  </p>
                  <p className="text-xl font-bold text-red-700">
                    {lastResult.failed}
                  </p>
                </div>
              </div>

              {lastResult.failures && lastResult.failures.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Detailed Failures:
                  </p>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 text-xs">
                    {lastResult.failures.map((f: any, i: number) => (
                      <div
                        key={i}
                        className="mb-1 border-b border-gray-50 pb-1 last:border-0"
                      >
                        <span className="font-mono text-gray-500">
                          {f.ticketId}:
                        </span>{" "}
                        <span className="text-red-600">{f.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ NOTIFICATION HISTORY ═══ */}
        <div className="w-full max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Sent Notifications
              </h2>
              <p className="text-sm text-gray-500">
                History of all push notifications sent from this dashboard.
              </p>
            </div>
            <button
              onClick={fetchNotifications}
              disabled={historyLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {historyLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              Refresh
            </button>
          </div>

          {historyLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-accent border-t-transparent"></div>
              <p className="mt-3 text-sm text-gray-500">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg
                className="mb-3 h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-gray-500">No notifications sent yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3 text-center">Target</th>
                    <th className="px-4 py-3 text-center">Recipients</th>
                    <th className="px-4 py-3 text-center">Seen</th>
                    <th className="px-4 py-3 text-center">Delivery</th>
                    <th className="px-4 py-3">Sent</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => {
                    const seenPct = getSeenPercentage(
                      n.seenCount,
                      n.totalRecipients,
                    );
                    return (
                      <tr
                        key={n._id}
                        className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                      >
                        <td className="max-w-[180px] truncate px-4 py-4 font-medium text-gray-800">
                          {n.title}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-4 text-gray-600">
                          {n.body}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              n.targetType === "all"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            {n.targetType === "all"
                              ? "All Users"
                              : "Specific"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center font-medium text-gray-700">
                          {n.totalRecipients}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-gray-600">
                              {n.seenCount}/{n.totalRecipients}
                            </span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-accent transition-all duration-500"
                                style={{ width: `${seenPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-medium text-green-600">
                              ✓{n.deliveryStats.delivered}
                            </span>
                            {n.deliveryStats.failed > 0 && (
                              <span className="text-xs font-medium text-red-500">
                                ✗{n.deliveryStats.failed}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-500">
                          {formatDate(n.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {/* View Detail */}
                            <button
                              onClick={() => handleViewDetail(n._id)}
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-accent/10 hover:text-accent"
                              title="View details"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => setDeleteId(n._id)}
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              title="Delete notification"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ═══ DETAIL MODAL ═══ */}
      {showDetailModal && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => {
            setShowDetailModal(false);
            setDetailNotification(null);
          }}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  {detailLoading ? (
                    <div className="h-6 w-48 animate-pulse rounded bg-gray-200"></div>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-gray-800">
                        {detailNotification?.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {detailNotification?.body}
                      </p>
                      {detailNotification?.link && (
                        <p className="mt-1 text-xs text-accent">
                          🔗 {detailNotification.link}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailNotification(null);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Stats row */}
              {detailNotification && (
                <div className="mt-4 flex gap-3">
                  <div className="rounded-lg bg-gray-50 px-3 py-1.5">
                    <span className="text-xs text-gray-500">Target: </span>
                    <span className="text-xs font-semibold text-gray-700">
                      {detailNotification.targetType === "all"
                        ? "All Users"
                        : "Specific"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-green-50 px-3 py-1.5">
                    <span className="text-xs text-gray-500">Delivered: </span>
                    <span className="text-xs font-semibold text-green-700">
                      {detailNotification.deliveryStats.delivered}
                    </span>
                  </div>
                  <div className="rounded-lg bg-accent/10 px-3 py-1.5">
                    <span className="text-xs text-gray-500">Seen: </span>
                    <span className="text-xs font-semibold text-accent">
                      {
                        detailNotification.recipients.filter((r) => r.seen)
                          .length
                      }
                      /{detailNotification.recipients.length}
                    </span>
                  </div>
                  {detailNotification.deliveryStats.failed > 0 && (
                    <div className="rounded-lg bg-red-50 px-3 py-1.5">
                      <span className="text-xs text-gray-500">Failed: </span>
                      <span className="text-xs font-semibold text-red-600">
                        {detailNotification.deliveryStats.failed}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
              {detailLoading ? (
                <div className="flex flex-col items-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
                  <p className="mt-2 text-sm text-gray-500">
                    Loading recipients...
                  </p>
                </div>
              ) : detailNotification ? (
                <div className="space-y-2">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Recipients ({detailNotification.recipients.length})
                  </p>
                  {detailNotification.recipients.map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50/50"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                          {r.userId?.username
                            ? r.userId.username.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {r.userId?.username || "Unknown User"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {r.userId?.email || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.seen ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Seen
                            {r.seenAt && (
                              <span className="text-[10px] text-gray-400">
                                {formatDate(r.seenAt)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Not seen
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Sent:{" "}
                  {detailNotification
                    ? formatDate(detailNotification.createdAt)
                    : "—"}
                </p>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailNotification(null);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      {deleteId && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-bold text-gray-800">
              Delete Notification
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Are you sure you want to delete this notification? This action
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleteLoading}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deleteLoading && (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default NotificationsPage;

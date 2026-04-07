"use client";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { IUser } from "@/app/models/userModel";

const NotificationsPage = () => {
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [users, setUsers] = useState<IUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (targetType === "specific" && users.length === 0) {
      fetchUsers();
    }
  }, [targetType]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await axios.get("/api/users?all=true");
      // Optionally filter out users without pushTokens here if exposed in API,
      // but if pushToken isn't sent to frontend for privacy, we just list all and let backend handle missing tokens.
      setUsers(res.data.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users for selection.");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds((prev) => 
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
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
    try {
      const payload = {
        userIds: targetType === "all" ? ["all"] : selectedUserIds,
        title: title.trim(),
        message: message.trim(),
        link: link.trim()
      };

      const res = await axios.post("/api/notifications", payload);
      const data = res.data.data;
      
      toast.success(`Notifications sent successfully! (Success: ${data.successCount}, Failed: ${data.failureCount})`);
      
      // Reset form
      setTitle("");
      setMessage("");
      setLink("");
      if (targetType === "specific") {
        setSelectedUserIds([]);
        setTargetType("all");
      }
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      toast.error(error.response?.data?.error || "Failed to send notifications.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <Toaster position="top-right" />
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 bg-backgroundColor px-4 py-6 md:px-8">
        <div className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">Push Notifications</h2>
          <p className="mb-8 text-gray-600">Send push notifications to your mobile app users.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Target Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Target Audience</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="targetType" 
                    value="all" 
                    checked={targetType === "all"} 
                    onChange={() => setTargetType("all")}
                    className="h-4 w-4 text-accent border-gray-300 focus:ring-accent"
                  />
                  <span>All Users (with active push tokens)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="targetType" 
                    value="specific" 
                    checked={targetType === "specific"} 
                    onChange={() => setTargetType("specific")}
                    className="h-4 w-4 text-accent border-gray-300 focus:ring-accent"
                  />
                  <span>Specific Users</span>
                </label>
              </div>
            </div>

            {/* User Selection List */}
            {targetType === "specific" && (
              <div className="rounded-lg border border-gray-200 p-4 max-h-60 overflow-y-auto">
                {usersLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No users found.</div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <label key={user._id as string} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user._id as string)}
                          onChange={() => handleUserToggle(user._id as string)}
                          className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        <span className="text-sm font-medium">{user.username} <span className="text-xs text-gray-500">({user.email})</span></span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
               <label className="block text-sm font-semibold text-gray-700 mb-1">Notification Title</label>
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
               <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
               <textarea
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-accent min-h-[120px]"
                 placeholder="Enter the notification message here..."
                 required
               />
            </div>

            {/* Link */}
            <div>
               <label className="block text-sm font-semibold text-gray-700 mb-1">Link (Optional)</label>
               <input
                 type="text"
                 value={link}
                 onChange={(e) => setLink(e.target.value)}
                 className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-accent"
                 placeholder="e.g., https://yourapp.com/workshop/123 or app://workshop/123"
               />
               <p className="mt-1 text-xs text-gray-500">Add a URL to direct the user when they tap the notification.</p>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-primary px-8 py-3 text-white font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                )}
                Send Notification
              </button>
            </div>
          </form>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default NotificationsPage;

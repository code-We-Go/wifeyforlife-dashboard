"use client";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { IUser } from "@/app/models/userModel";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const UsersPage = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalType, setModalType] = useState<"edit" | "delete" | "add" | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscriptionModal, setSubscriptionModal] = useState<{
    type: "view" | "add" | null;
    user: IUser | null;
  }>({ type: null, user: null });
  const [availablePackages, setAvailablePackages] = useState<
    { _id: string; name: string }[]
  >([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) return; // Only reset when debounced query is set
    setPage(1);
  }, [debouncedSearchQuery]);

  // Fetch users when page or debounced search query changes
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const apiUrl = `/api/users?page=${page}&search=${encodeURIComponent(debouncedSearchQuery)}`;
        const res = await axios.get(apiUrl);
        
        setUsers(res.data.data.users);
        setTotalPages(res.data.data.pagination.totalPages);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, debouncedSearchQuery]);

  const openModal = (type: "edit" | "delete" | "add", user?: IUser) => {
    setModalType(type);
    setSelectedUser(user || null);
  };

  const handleDelete = async (userId: string) => {
    try {
      await axios.delete(`/api/users?userId=${userId}`);
      // Refresh the users list with current search and page
      const res = await axios.get(
        `/api/users?page=${page}&search=${encodeURIComponent(debouncedSearchQuery)}`,
      );
      setUsers(res.data.data.users);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleSubscriptionClick = (user: IUser) => {
    setSubscriptionModal({ type: "view", user });
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        <div className="flex w-[97%] items-center justify-between text-primary">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            className="rounded-2xl bg-primary px-4 py-2 text-sm text-creamey hover:cursor-pointer"
            onClick={() => openModal("add")}
          >
            ADD USER
          </button>
        </div>

        {/* Table */}
        <table className="w-[97%] rounded border border-gray-300 text-left">
          <thead className="bg-secondary text-sm text-white">
            <tr>
              <th className="border p-2">#</th>
              <th className="border p-2">Username</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Subscription</th>
              <th className="border p-2">Created At</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="border p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="text-gray-600">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user, index) => (
                <tr key={index} className="text-sm hover:bg-gray-50">
                  <td className="border p-2">{(page - 1) * 10 + index + 1}</td>
                  <td className="border p-2">
                    <Link
                      href={`/pages/users/${user._id}`}
                      className=" hover:underline"
                    >
                      <div className="flex items-center gap-2">
                        {user.imageURL && user.imageURL.trim() !== "" ? (
                          <img
                            src={user.imageURL}
                            alt={user.username}
                            className="h-8 w-8 rounded-full border object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-gray-300 text-base font-bold text-gray-700">
                            {user.username
                              ? user.username
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : "?"}
                          </div>
                        )}
                        <span>{user.username}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{user.role}</td>
                  <td
                    className="cursor-pointer border p-2 text-blue-600 underline"
                    onClick={() => handleSubscriptionClick(user)}
                  >
                    {user.subscriptions?.some(s => s.subscribed) ? "Yes" : "No"}
                  </td>
                  <td className="border p-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="space-x-2 border p-2">
                    <button
                      onClick={() => openModal("edit", user)}
                      className="text-blue-600 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(String(user._id))}
                      className="text-red-600 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="border p-8 text-center">
                  <div className="text-gray-600">
                    {debouncedSearchQuery
                      ? `No users found matching "${debouncedSearchQuery}"`
                      : "No users found"}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && users.length > 0 && totalPages > 1 && (
          <div className="mt-4 flex items-center gap-4">
            <button
              className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-lg">
              Page {page} of {totalPages}
            </span>
            <button
              className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Add User Modal */}
        {modalType === "add" && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-96 rounded-lg bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">Add New User</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  try {
                    await axios.post("/api/users", {
                      username: formData.get("username"),
                      email: formData.get("email"),
                      password: formData.get("password"),
                      role: formData.get("role"),
                      // isSubscriped: formData.get('subscription') === 'true'
                    });
                    setModalType(null);
                    // Refresh users list
                    const res = await axios.get(`/api/users?page=${page}`);
                    setUsers(res.data.data.users);
                  } catch (error) {
                    console.error("Error adding user:", error);
                  }
                }}
              >
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full rounded border p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full lowercase rounded border p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full rounded border p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">Role</label>
                  <select name="role" className="w-full rounded border p-2">
                    <option value="customer">Customer</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Subscription</label>
                  <select name="subscription" className="w-full p-2 border rounded">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div> */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-accent px-4 py-2 text-white"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {modalType === "edit" && selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-96 rounded-lg bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">Edit User</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  try {
                    await axios.put(`/api/users?userId=${selectedUser._id}`, {
                      username: formData.get("username"),
                      email: formData.get("email"),
                      role: formData.get("role"),
                      // isSubscribed: formData.get('subscription') === 'true',
                      emailVerified: formData.get("emailVerified") === "true",
                    });
                    setModalType(null);
                    // Refresh users list
                    const res = await axios.get(`/api/users?page=${page}`);
                    setUsers(res.data.data.users);
                  } catch (error) {
                    console.error("Error updating user:", error);
                  }
                }}
              >
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    defaultValue={selectedUser.username}
                    required
                    className="w-full rounded border p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedUser.email}
                    required
                    className="w-full lowercase rounded border p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">Role</label>
                  <select
                    name="role"
                    defaultValue={selectedUser.role}
                    className="w-full rounded border p-2"
                  >
                    <option value="customer">Customer</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">
                    Email Verified
                  </label>
                  <select
                    name="emailVerified"
                    defaultValue={selectedUser.emailVerified ? "true" : "false"}
                    className="w-full rounded border p-2"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Subscription</label>
                  <select
                    name="subscription"
                    defaultValue={selectedUser.subscription?.subscribed?"true":"false"}
                    className="w-full p-2 border rounded"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div> */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-accent px-4 py-2 text-white"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Subscription Management Modal */}
        {subscriptionModal.user && (
          <SubscriptionInfoModal
            user={subscriptionModal.user}
            availablePackages={availablePackages}
            setAvailablePackages={setAvailablePackages}
            onClose={() => setSubscriptionModal({ type: null, user: null })}
            onUserRefresh={async () => {
              const res = await axios.get(
                `/api/users?page=${page}&search=${encodeURIComponent(debouncedSearchQuery)}`,
              );
              setUsers(res.data.data.users);
              setTotalPages(res.data.data.pagination.totalPages);
            }}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default UsersPage;

const SubscriptionInfoModal = ({
  user,
  availablePackages,
  setAvailablePackages,
  onClose,
  onUserRefresh,
}: {
  user: IUser;
  availablePackages: { _id: string; name: string }[];
  setAvailablePackages: React.Dispatch<
    React.SetStateAction<{ _id: string; name: string }[]>
  >;
  onClose: () => void;
  onUserRefresh: () => void;
}) => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Refresh user to get latest subscriptions array
      const userRes = await axios.get(`/api/users?userId=${user._id}`);
      const userData = userRes.data.data;
      
      if (userData.subscriptions && userData.subscriptions.length > 0) {
        setSubscriptions(userData.subscriptions);
      } else {
        setSubscriptions([]);
      }

      // Fetch packages if not already loaded
      if (!availablePackages.length) {
        const pkgRes = await axios.get("/api/packages?all=true");
        setAvailablePackages(
          pkgRes.data.data.map((pkg: any) => ({
            _id: pkg._id,
            name: pkg.name,
          })),
        );
      }
    } catch (err) {
      setError("Failed to load subscription data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserSubscriptions();
    // eslint-disable-next-line
  }, [user]);

  const handleDeleteSub = async (subId: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;
    try {
      await axios.delete(`/api/subscriptions?subscriptionID=${subId}`);
      await fetchUserSubscriptions();
      await onUserRefresh();
    } catch (err) {
      alert("Failed to delete subscription");
    }
  };

  const handleSaveSub = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = {
      paymentID: formData.get("paymentID"),
      packageID: formData.get("packageID"),
      expiryDate: formData.get("expiryDate"),
      subscribed: formData.get("subscribed") === "true",
      email: user.email,
    };

    try {
      if (isAdding) {
        await axios.post("/api/subscriptions", payload);
      } else if (editingSub) {
        await axios.put(`/api/subscriptions?subscriptionID=${editingSub._id}`, payload);
      }
      setEditingSub(null);
      setIsAdding(false);
      await fetchUserSubscriptions();
      await onUserRefresh();
    } catch (err) {
      setError("Failed to save subscription");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-96 rounded-lg bg-white p-6 text-center">Loading...</div>
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
        
        <h2 className="mb-6 text-2xl font-bold text-primary border-b pb-2">
          Manage Subscriptions: <span className="text-secondary font-medium">{user.username}</span>
        </h2>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

        {!editingSub && !isAdding ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Existing Subscriptions</h3>
              <button
                onClick={() => setIsAdding(true)}
                className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-opacity-90 transition-all"
              >
                + Add New
              </button>
            </div>

            {subscriptions.length === 0 ? (
              <p className="text-gray-500 py-4 text-center border-2 border-dashed rounded-lg">No active subscriptions found for this user.</p>
            ) : (
              <div className="grid gap-4">
                {subscriptions.map((sub) => (
                  <div key={sub._id} className="border rounded-xl p-4 flex justify-between items-center bg-gray-50 hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-bold text-secondary">{sub.packageID?.name || "Unknown Package"}</p>
                      <p className="text-xs text-gray-500 mt-1">ID: {sub.paymentID}</p>
                      <div className="flex gap-4 mt-2">
                        <p className="text-sm">
                          Status: <span className={sub.subscribed ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {sub.subscribed ? "Active" : "Inactive"}
                          </span>
                        </p>
                        <p className="text-sm">
                          Expires: <span className="font-medium">{sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : "N/A"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingSub(sub)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSub(sub._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <h3 className="text-lg font-semibold mb-4">
              {isAdding ? "Add New Subscription" : "Edit Subscription"}
            </h3>
            <form onSubmit={handleSaveSub} className="space-y-4 bg-gray-50 p-6 rounded-xl border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Payment ID</label>
                  <input
                    type="text"
                    name="paymentID"
                    className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-primary outline-none"
                    defaultValue={editingSub?.paymentID || ""}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Package</label>
                  <select
                    name="packageID"
                    className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-primary outline-none"
                    defaultValue={editingSub?.packageID?._id || editingSub?.packageID || ""}
                    required
                  >
                    <option value="">Select a package</option>
                    {availablePackages.map((pkg) => (
                      <option key={pkg._id} value={pkg._id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-primary outline-none"
                    defaultValue={editingSub?.expiryDate ? editingSub.expiryDate.slice(0, 10) : ""}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="subscribed"
                    className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-primary outline-none"
                    defaultValue={editingSub?.subscribed ? "true" : "false"}
                    required
                  >
                    <option value="true">Active (Paid)</option>
                    <option value="false">Inactive (Unpaid)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSub(null);
                    setIsAdding(false);
                  }}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  disabled={saving}
                >
                  Back to List
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-8 py-2 text-white font-bold hover:bg-opacity-90 shadow-lg disabled:opacity-50 transition-all"
                  disabled={saving}
                >
                  {saving ? "Saving..." : (isAdding ? "Create Subscription" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

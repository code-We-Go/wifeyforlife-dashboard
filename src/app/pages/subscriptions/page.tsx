"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Ipackage } from "@/interfaces/interfaces";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

interface Subscription {
  _id: string;
  paymentID: string;
  packageID: Ipackage & { _id: string } | null;
  email: string;
  subscribed: boolean;
  expiryDate: string;
  createdAt: string;
}

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [packages, setPackages] = useState<(Ipackage & { _id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"add" | "edit" | "delete" | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [search, setSearch] = useState("");

  // Form state for add/edit
  const [form, setForm] = useState({
    paymentID: "",
    packageID: "",
    email: "",
    subscribed: false,
    expiryDate: "",
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchPackages();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/subscriptions");
      setSubscriptions(res.data.data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await axios.get("/api/packages?all=true");
      setPackages(res.data.data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  const openModal = (type: "add" | "edit" | "delete", subscription?: Subscription) => {
    setModalType(type);
    setSelectedSubscription(subscription || null);
    if (type === "edit" && subscription) {
      setForm({
        paymentID: subscription.paymentID,
        packageID: subscription.packageID?._id || "",
        email: subscription.email,
        subscribed: subscription.subscribed,
        expiryDate: subscription.expiryDate?.slice(0, 10) || "",
      });
    } else if (type === "add") {
      setForm({ paymentID: "", packageID: "", email: "", subscribed: false, expiryDate: "" });
    }
  };

  const handleDelete = async () => {
    if (!selectedSubscription) return;
    try {
      await axios.delete(`/api/subscriptions?subscriptionID=${selectedSubscription._id}`);
      setModalType(null);
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === "add") {
        await axios.post("/api/subscriptions", form);
      } else if (modalType === "edit" && selectedSubscription) {
        await axios.put(`/api/subscriptions?subscriptionID=${selectedSubscription._id}`, form);
      }
      setModalType(null);
      fetchSubscriptions();
    } catch (error) {
      console.error("Error saving subscription:", error);
    }
  };

  return (
    <DefaultLayout>
      <div className="w-full min-h-[calc(100vh-124px)] p-4 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search by email or paymentID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="p-2 border rounded w-64"
          />
          <button
            className="bg-primary text-white px-4 py-2 rounded"
            onClick={() => openModal("add")}
          >
            Add Subscription
          </button>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full border text-left">
            <thead className="bg-secondary text-white">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Payment ID</th>
                <th className="p-2 border">Package</th>
                <th className="p-2 border">Subscribed</th>
                <th className="p-2 border">Expiry</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {subscriptions
                .filter(s =>
                  s.email.toLowerCase().includes(search.toLowerCase()) ||
                  s.paymentID.toLowerCase().includes(search.toLowerCase())
                )
                .map((sub, idx) => (
                  <tr key={sub._id} className="hover:bg-gray-50">
                    <td className="p-2 border">{idx + 1}</td>
                    <td className="p-2 border">{sub.email}</td>
                    <td className="p-2 border">{sub.paymentID}</td>
                    <td className="p-2 border">{sub.packageID ? sub.packageID.name : "-"}</td>
                    <td className="p-2 border">{sub.subscribed ? "Yes" : "No"}</td>
                    <td className="p-2 border">{sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : "-"}</td>
                    <td className="p-2 border space-x-2">
                      <button
                        onClick={() => openModal("edit", sub)}
                        className="text-blue-600 underline"
                      >Edit</button>
                      <button
                        onClick={() => openModal("delete", sub)}
                        className="text-red-600 underline"
                      >Delete</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Modal for Add/Edit */}
        {(modalType === "add" || modalType === "edit") && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4">{modalType === "add" ? "Add Subscription" : "Edit Subscription"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment ID</label>
                  <input
                    type="text"
                    value={form.paymentID}
                    onChange={e => setForm(f => ({ ...f, paymentID: e.target.value }))}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Package</label>
                  <select
                    value={form.packageID}
                    onChange={e => setForm(f => ({ ...f, packageID: e.target.value }))}
                    required
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a package</option>
                    {packages.map(pkg => (
                      <option key={pkg._id} value={pkg._id}>{pkg.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subscribed</label>
                  <select
                    value={form.subscribed ? "true" : "false"}
                    onChange={e => setForm(f => ({ ...f, subscribed: e.target.value === "true" }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >Cancel</button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded"
                  >{modalType === "add" ? "Add" : "Save"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {modalType === "delete" && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4">Delete Subscription</h2>
              <p>Are you sure you want to delete this subscription?</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >Cancel</button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default SubscriptionsPage;
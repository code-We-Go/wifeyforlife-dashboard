"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type OrderStatus = "pending" | "paid" | "cancelled";

interface PartnerSession {
  _id: string;
  title: string;
  partnerName: string;
  partnerEmail: string;
  whatsappNumber: string;
  price: number;
  subscriptionDiscountPercentage?: number;
  profitPercentage: number;
}

interface PartnerSessionOrder {
  _id?: string;
  sessionId: string;
  sessionTitle: string;
  partnerName: string;
  partnerEmail: string;
  whatsappNumber: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  appliedDiscountCode?: string;
  basePrice: number;
  finalPrice: number;
  subscriptionDiscountAmount?: number;
  profitPercentage: number;
  ourProfitAmount: number;
  paymentID?: string;
  status: OrderStatus;
  createdAt?: string;
}

const emptyOrder: PartnerSessionOrder = {
  sessionId: "",
  sessionTitle: "",
  partnerName: "",
  partnerEmail: "",
  whatsappNumber: "",
  clientFirstName: "",
  clientLastName: "",
  clientEmail: "",
  clientPhone: "",
  appliedDiscountCode: "",
  basePrice: 0,
  finalPrice: 0,
  subscriptionDiscountAmount: 0,
  profitPercentage: 0,
  ourProfitAmount: 0,
  paymentID: "",
  status: "pending",
};

export default function PartnerSessionOrdersPage() {
  const [orders, setOrders] = useState<PartnerSessionOrder[]>([]);
  const [sessions, setSessions] = useState<PartnerSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<PartnerSessionOrder>(emptyOrder);
  const [editing, setEditing] = useState<PartnerSessionOrder | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (searchEmail) params.set("clientEmail", searchEmail);
    if (statusFilter !== "all") params.set("status", statusFilter);
    return params.toString();
  }, [searchEmail, statusFilter]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/partner-session-orders${queryString ? `?${queryString}` : ""}`,
      );
      setOrders(res.data.data || []);
    } catch (e) {
      console.error("Failed to load orders", e);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await axios.get(`/api/partner-sessions?isActive=true`);
      setSessions(res.data.data || []);
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const resetForm = () => {
    setForm(emptyOrder);
    setEditing(null);
    setShowAdd(false);
  };

  const onSelectSession = (sessionId: string) => {
    const s = sessions.find((x) => x._id === sessionId);
    if (!s) return;
    const discountAmount =
      Math.round((s.subscriptionDiscountPercentage || 0) * s.price) / 100;
    const final = Math.round(s.price - discountAmount);
    const profitPct = s.profitPercentage || 0;
    const ourProfit = Math.round((final * profitPct) / 100);
    setForm((f) => ({
      ...f,
      sessionId: s._id,
      sessionTitle: s.title,
      partnerName: s.partnerName,
      partnerEmail: s.partnerEmail,
      whatsappNumber: s.whatsappNumber,
      basePrice: s.price,
      finalPrice: final,
      subscriptionDiscountAmount: discountAmount,
      profitPercentage: profitPct,
      ourProfitAmount: ourProfit,
    }));
  };

  const recomputeProfit = (finalPrice: number, profitPercentage: number) => {
    return Math.round((finalPrice * profitPercentage) / 100);
  };

  const handleCreate = async () => {
    try {
      const res = await axios.post("/api/partner-session-orders", form);
      setOrders((prev) => [res.data.data, ...prev]);
      resetForm();
    } catch (e) {
      console.error("Create failed", e);
    }
  };

  const handleUpdate = async () => {
    if (!editing?._id) return;
    try {
      const res = await axios.put("/api/partner-session-orders", {
        _id: editing._id,
        ...form,
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === editing._id ? res.data.data : o)),
      );
      resetForm();
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await axios.delete(`/api/partner-session-orders?id=${id}`);
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const startEdit = (order: PartnerSessionOrder) => {
    setEditing(order);
    setForm({ ...order });
    setShowAdd(true);
  };

  return (
    <DefaultLayout>
      <div className="flex min-h-[calc(100vh-124px)] w-full flex-col gap-4 p-4">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              className="w-64 rounded border p-2"
              placeholder="Search by client email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <select
              className="rounded border p-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              {/* <option value="failed">Failed</option> */}
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <button
              className="rounded bg-primary px-4 py-2 text-white"
              onClick={() => {
                setShowAdd((s) => !s);
                setEditing(null);
                setForm(emptyOrder);
              }}
            >
              {showAdd ? "Close Form" : "Add Order"}
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="rounded bg-white p-4 shadow">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Session
                </label>
                <select
                  className="w-full rounded border p-2"
                  value={form.sessionId}
                  onChange={(e) => onSelectSession(e.target.value)}
                >
                  <option value="">Select a session</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title} — {s.partnerName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client First Name
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.clientFirstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientFirstName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client Last Name
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.clientLastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientLastName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client Email
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.clientEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientEmail: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client Phone
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.clientPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientPhone: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Applied Discount Code
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.appliedDiscountCode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      appliedDiscountCode: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Base Price
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      basePrice: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Final Price
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.finalPrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      finalPrice: parseFloat(e.target.value) || 0,
                      ourProfitAmount: recomputeProfit(
                        parseFloat(e.target.value) || 0,
                        f.profitPercentage,
                      ),
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Subscription Discount Amount
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.subscriptionDiscountAmount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      subscriptionDiscountAmount:
                        parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Profit %
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.profitPercentage}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      profitPercentage: parseFloat(e.target.value) || 0,
                      ourProfitAmount: recomputeProfit(
                        f.finalPrice,
                        parseFloat(e.target.value) || 0,
                      ),
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Our Profit Amount
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.ourProfitAmount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ourProfitAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment ID
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.paymentID}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentID: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  className="w-full rounded border p-2"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as OrderStatus,
                    }))
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  {/* <option value="failed">Failed</option> */}
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {editing ? (
                <>
                  <button
                    className="rounded bg-gray-200 px-4 py-2"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded bg-primary px-4 py-2 text-white"
                    onClick={handleUpdate}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  className="rounded bg-primary px-4 py-2 text-white"
                  onClick={handleCreate}
                >
                  Create Order
                </button>
              )}
            </div>
          </div>
        )}

        <div className="rounded bg-white p-4 shadow">
          {loading ? (
            <div className="flex h-20 items-center justify-center">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead className="bg-secondary text-creamey">
                  <tr>
                    <th className="px-3 py-2">Session</th>
                    <th className="px-3 py-2">Partner</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Final Price</th>
                    <th className="px-3 py-2">Profit</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id} className="border-b">
                      <td className="px-3 py-2">{o.sessionTitle}</td>
                      <td className="px-3 py-2">{o.partnerName}</td>
                      <td className="px-3 py-2">
                        {o.clientFirstName} {o.clientLastName}
                      </td>
                      <td className="px-3 py-2">{o.clientEmail}</td>
                      <td className="px-3 py-2">{o.finalPrice}</td>
                      <td className="px-3 py-2">{o.ourProfitAmount}</td>
                      <td className="px-3 py-2">
                        <select
                          className="rounded border p-1 text-sm"
                          value={o.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as OrderStatus;
                            try {
                              const res = await axios.put(
                                "/api/partner-session-orders",
                                { _id: o._id, status: newStatus },
                              );
                              setOrders((prev) =>
                                prev.map((x) =>
                                  x._id === o._id ? res.data.data : x,
                                ),
                              );
                            } catch (err) {
                              console.error("Failed to update status", err);
                            }
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          {/* <option value="failed">Failed</option> */}
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            className="text-primary underline"
                            onClick={() => startEdit(o)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 underline"
                            onClick={() => handleDelete(o._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
}

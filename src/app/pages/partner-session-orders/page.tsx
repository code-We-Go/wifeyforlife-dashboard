"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import PartnerSessionOrderModal from "@/components/PartnerSessionOrderModal";
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
  createdAt: new Date().toISOString().split('T')[0],
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
    // Format createdAt to YYYY-MM-DD if it exists
    const formattedOrder = {
      ...order,
      createdAt: order.createdAt
        ? new Date(order.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };
    setForm(formattedOrder);
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
                setShowAdd(true);
                setEditing(null);
                setForm({
                  ...emptyOrder,
                  createdAt: new Date().toISOString().split('T')[0],
                });
              }}
            >
              Add Order
            </button>
          </div>
        </div>

        <PartnerSessionOrderModal
          isOpen={showAdd}
          onClose={resetForm}
          form={form}
          setForm={setForm}
          sessions={sessions}
          editing={editing}
          onSelectSession={onSelectSession}
          recomputeProfit={recomputeProfit}
          handleCreate={handleCreate}
          handleUpdate={handleUpdate}
        />

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

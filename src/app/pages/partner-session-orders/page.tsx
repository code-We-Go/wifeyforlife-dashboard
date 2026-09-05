"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import PartnerSessionOrderModal, { PartnerSessionOrder } from "@/components/PartnerSessionOrderModal";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "instapay_review";

interface PartnerSessionVariant {
  title: string;
  description: string;
  price: number;
  duration: number;
}

interface PartnerSession {
  _id: string;
  title: string;
  partnerName: string;
  partnerEmail: string;
  whatsappNumber: string;
  price: number;
  subscriptionDiscountPercentage?: number;
  profitPercentage: number;
  variants?: PartnerSessionVariant[];
}

const emptyOrder: PartnerSessionOrder = {
  sessionId: "",
  sessionTitle: "",
  variantTitle: "",
  variantDuration: 0,
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
  paymentMethod: "card",
  instapayReceipt: "",
  link: "",
  meetingLink: "",
  status: "pending",
  createdAt: new Date().toISOString().split("T")[0],
};

export default function PartnerSessionOrdersPage() {
  const [orders, setOrders] = useState<PartnerSessionOrder[]>([]);
  const [sessions, setSessions] = useState<PartnerSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<PartnerSessionOrder>(emptyOrder);
  const [editing, setEditing] = useState<PartnerSessionOrder | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (searchEmail) params.set("clientEmail", searchEmail);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (paymentMethodFilter !== "all") params.set("paymentMethod", paymentMethodFilter);
    return params.toString();
  }, [searchEmail, statusFilter, paymentMethodFilter]);

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
    const firstVariant = s.variants && s.variants.length > 0 ? s.variants[0] : null;
    const priceToUse = firstVariant ? firstVariant.price : s.price;
    const discountAmount =
      Math.round((s.subscriptionDiscountPercentage || 0) * priceToUse) / 100;
    const final = Math.max(0, Math.round(priceToUse - discountAmount));
    const profitPct = s.profitPercentage || 0;
    const ourProfit = Math.round((final * profitPct) / 100);
    setForm((f) => ({
      ...f,
      sessionId: s._id,
      sessionTitle: s.title,
      variantTitle: firstVariant ? firstVariant.title : "",
      variantDuration: firstVariant ? firstVariant.duration : undefined,
      partnerName: s.partnerName,
      partnerEmail: s.partnerEmail,
      whatsappNumber: s.whatsappNumber,
      basePrice: priceToUse,
      finalPrice: final,
      subscriptionDiscountAmount: discountAmount,
      profitPercentage: profitPct,
      ourProfitAmount: ourProfit,
    }));
  };

  const onSelectVariant = (variantTitle: string) => {
    const s = sessions.find((x) => x._id === form.sessionId);
    if (!s) return;

    if (!variantTitle) {
      const discountAmount =
        Math.round((s.subscriptionDiscountPercentage || 0) * s.price) / 100;
      const final = Math.max(0, Math.round(s.price - discountAmount));
      const profitPct = s.profitPercentage || form.profitPercentage || 0;
      const ourProfit = Math.round((final * profitPct) / 100);
      setForm((f) => ({
        ...f,
        variantTitle: "",
        variantDuration: undefined,
        basePrice: s.price,
        finalPrice: final,
        subscriptionDiscountAmount: discountAmount,
        ourProfitAmount: ourProfit,
      }));
      return;
    }

    const variant = s.variants?.find((v) => v.title === variantTitle);
    if (!variant) return;

    const discountAmount =
      Math.round((s.subscriptionDiscountPercentage || 0) * variant.price) / 100;
    const final = Math.max(0, Math.round(variant.price - discountAmount));
    const profitPct = s.profitPercentage || form.profitPercentage || 0;
    const ourProfit = Math.round((final * profitPct) / 100);
    setForm((f) => ({
      ...f,
      variantTitle: variant.title,
      variantDuration: variant.duration,
      basePrice: variant.price,
      finalPrice: final,
      subscriptionDiscountAmount: discountAmount,
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
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await axios.delete(`/api/partner-session-orders?id=${id}`);
      setOrders((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleApproveInstapay = async (order: PartnerSessionOrder) => {
    const paymentIdentifier = order.paymentID || order._id || "";
    if (!paymentIdentifier) {
      alert("No payment ID or order ID found for this order.");
      return;
    }
    setApprovingId(paymentIdentifier);
    try {
      // 1. Call website callback endpoint to trigger emails/fulfillment
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback?success=true&order=${paymentIdentifier}&json=true`,
        );
        console.log("Website callback response:", response.data);
      } catch (cbErr) {
        console.warn("Website callback endpoint warning:", cbErr);
      }

      // 2. Ensure status is updated to 'paid' in DB
      if (order._id) {
        await axios.put("/api/partner-session-orders", {
          _id: order._id,
          status: "paid",
        });
      }

      alert("Payment approved successfully!");
      fetchOrders();
    } catch (error: any) {
      console.error("Error approving instapay payment:", error);
      alert(
        "An error occurred while approving the payment: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setApprovingId(null);
    }
  };

  const startEdit = (order: PartnerSessionOrder) => {
    setEditing(order);
    const formattedOrder = {
      ...order,
      createdAt: order.createdAt
        ? new Date(order.createdAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    };
    setForm(formattedOrder);
    setShowAdd(true);
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-300";
      case "instapay_review":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <DefaultLayout>
      <div className="flex min-h-[calc(100vh-124px)] w-full flex-col gap-4 p-4">
        {/* Header and Filters */}
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="w-64 rounded border p-2 text-sm shadow-sm"
              placeholder="Search by client email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <select
              className="rounded border p-2 text-sm shadow-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="instapay_review">Instapay Review</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="rounded border p-2 text-sm shadow-sm"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <option value="all">All Payment Methods</option>
              <option value="card">Card</option>
              <option value="instapay">Instapay</option>
            </select>
          </div>
          <div>
            <button
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-opacity-90 transition"
              onClick={() => {
                setShowAdd(true);
                setEditing(null);
                setForm({
                  ...emptyOrder,
                  createdAt: new Date().toISOString().split("T")[0],
                });
              }}
            >
              + Add Order
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
          onSelectVariant={onSelectVariant}
          recomputeProfit={recomputeProfit}
          handleCreate={handleCreate}
          handleUpdate={handleUpdate}
        />

        {/* Orders Table */}
        <div className="rounded bg-white p-4 shadow">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-gray-500">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-gray-400">
              No partner session orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left text-sm">
                <thead className="bg-secondary text-creamey">
                  <tr>
                    <th className="px-3 py-2.5">Session</th>
                    <th className="px-3 py-2.5">Partner</th>
                    <th className="px-3 py-2.5">Client</th>
                    <th className="px-3 py-2.5">Price / Profit</th>
                    <th className="px-3 py-2.5">Payment</th>
                    <th className="px-3 py-2.5">Links</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((o) => {
                    const paymentIdentifier = o.paymentID || o._id || "";
                    const isInstapay = o.paymentMethod === "instapay";
                    const isPaid = o.status === "paid";
                    const isApproving = approvingId === paymentIdentifier;

                    return (
                      <tr key={o._id} className="hover:bg-gray-50">
                        {/* Session Details */}
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-gray-900">
                            {o.sessionTitle}
                          </div>
                          {o.variantTitle && (
                            <div className="text-xs text-gray-500">
                              {o.variantTitle}{" "}
                              {o.variantDuration ? `(${o.variantDuration} min)` : ""}
                            </div>
                          )}
                          {o.createdAt && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        {/* Partner Details */}
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-800">
                            {o.partnerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {o.whatsappNumber}
                          </div>
                        </td>

                        {/* Client Details */}
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-900">
                            {o.clientFirstName} {o.clientLastName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {o.clientEmail}
                          </div>
                          <div className="text-xs text-gray-500">
                            {o.clientPhone}
                          </div>
                        </td>

                        {/* Price & Profit */}
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-900">
                            {o.finalPrice} EGP
                          </div>
                          <div className="text-xs text-green-700">
                            Profit: {o.ourProfitAmount} EGP ({o.profitPercentage}%)
                          </div>
                          {o.appliedDiscountCode && (
                            <div className="text-xs text-gray-400">
                              Code: {o.appliedDiscountCode}
                            </div>
                          )}
                        </td>

                        {/* Payment Method & Receipt */}
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${isInstapay
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                                }`}
                            >
                              {isInstapay ? "Instapay" : "Card"}
                            </span>
                            {o.paymentID && (
                              <span className="text-xs font-mono text-gray-500 truncate max-w-[120px]" title={o.paymentID}>
                                ID: {o.paymentID}
                              </span>
                            )}
                            {isInstapay && (
                              o.instapayReceipt ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewReceipt(o.instapayReceipt || null)}
                                  className="text-xs text-primary underline font-medium hover:text-opacity-80"
                                >
                                  View Receipt
                                </button>
                              ) : (
                                <span className="text-xs italic text-gray-400">
                                  No receipt
                                </span>
                              )
                            )}
                          </div>
                        </td>

                        {/* Links */}
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1 text-xs">
                            {o.meetingLink ? (
                              <a
                                href={o.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 underline hover:text-blue-800"
                              >
                                Join Meeting
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">No meeting link</span>
                            )}
                            {o.link && (
                              <a
                                href={o.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-gray-600 underline hover:text-gray-800"
                              >
                                Session Link
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Status Select */}
                        <td className="px-3 py-2.5">
                          <select
                            className={`rounded border px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                              o.status,
                            )}`}
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
                            <option value="instapay_review">Instapay Review</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-2">
                            {isInstapay && !isPaid && (
                              <button
                                disabled={isApproving}
                                onClick={() => handleApproveInstapay(o)}
                                className={`rounded px-2.5 py-1 text-xs font-semibold bg-green-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 ${isApproving
                                    ? "cursor-not-allowed bg-gray-400"
                                    : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                                  }`}
                              >
                                {isApproving ? "..." : "Approve"}
                              </button>
                            )}
                            <button
                              className="text-xs font-medium text-primary underline hover:text-opacity-80"
                              onClick={() => startEdit(o)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-xs font-medium text-red-600 underline hover:text-red-800"
                              onClick={() => handleDelete(o._id)}
                            >
                              Delete
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

        {/* Receipt Image Preview Modal */}
        {previewReceipt && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
            onClick={() => setPreviewReceipt(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-lg bg-white p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold text-gray-800">Instapay Receipt</h3>
                <button
                  onClick={() => setPreviewReceipt(null)}
                  className="text-xl font-bold text-gray-500 hover:text-gray-800"
                >
                  ×
                </button>
              </div>
              <div className="flex max-h-[75vh] items-center justify-center overflow-auto">
                <img
                  src={previewReceipt}
                  alt="Instapay Receipt Preview"
                  className="max-h-[70vh] w-auto object-contain rounded"
                />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <a
                  href={previewReceipt}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-primary px-3 py-1.5 text-xs text-white hover:bg-opacity-90"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() => setPreviewReceipt(null)}
                  className="rounded bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}


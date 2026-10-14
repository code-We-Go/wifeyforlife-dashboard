"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { UploadButton } from "@/utils/uploadthing";

type SessionType = "one-to-one" | "webinar";

export interface PartnerSessionVariant {
  title: string;
  description: string;
  price: number;
  duration: number;
}

export interface PartnerSessionBooking {
  _id?: string;
  orderId?: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  variantTitle?: string;
  bookedAt?: string | Date;
  status?: string;
}

export interface PartnerSession {
  _id?: string;
  title: string;
  description: string;
  partnerName: string;
  price: number;
  sessionType?: SessionType;
  whatsappNumber: string;
  partnerEmail: string;
  subscriptionDiscountPercentage?: number;
  profitPercentage: number;
  imageUrl: string;
  isActive?: boolean;
  order?: number;
  featured?: boolean;
  maxCapacity?: number;
  bookings?: PartnerSessionBooking[];
  variants?: PartnerSessionVariant[];
  meetingLink?: string;
  createdAt?: string;
}

const emptyForm: PartnerSession = {
  title: "",
  description: "",
  partnerName: "",
  price: 0,
  sessionType: "one-to-one",
  whatsappNumber: "",
  partnerEmail: "",
  subscriptionDiscountPercentage: 0,
  profitPercentage: 0,
  imageUrl: "",
  isActive: true,
  order: 0,
  featured: false,
  maxCapacity: 0,
  bookings: [],
  variants: [],
  meetingLink: "",
};

export default function PartnerSessionsPage() {
  const [sessions, setSessions] = useState<PartnerSession[]>([]);
  const [viewingBookingsSession, setViewingBookingsSession] = useState<PartnerSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("order");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<PartnerSession>(emptyForm);
  const [editing, setEditing] = useState<PartnerSession | null>(null);
  const [orderSaving, setOrderSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeFilter !== "all") params.set("isActive", activeFilter);
    if (sortBy) params.set("sortBy", sortBy);
    return params.toString();
  }, [search, activeFilter, sortBy]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/partner-sessions${queryString ? `?${queryString}` : ""}`,
      );
      setSessions(res.data.data || []);
    } catch (e) {
      console.error("Failed to load sessions", e);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowAdd(false);
  };

  const handleCreate = async () => {
    try {
      const res = await axios.post("/api/partner-sessions", form);
      setSessions((prev) => [res.data.data, ...prev]);
      resetForm();
      showToast("Session created successfully!");
    } catch (e) {
      console.error("Create failed", e);
    }
  };

  const handleUpdate = async () => {
    if (!editing?._id) return;
    try {
      const res = await axios.put("/api/partner-sessions", {
        _id: editing._id,
        ...form,
      });
      setSessions((prev) =>
        prev.map((s) => (s._id === editing._id ? res.data.data : s)),
      );
      resetForm();
      showToast("Session updated successfully!");
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      await axios.delete(`/api/partner-sessions?id=${id}`);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      showToast("Session deleted!");
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const toggleFeatured = async (sessionId?: string, currentFeatured?: boolean) => {
    if (!sessionId) return;
    const newFeatured = !currentFeatured;
    setSessions((prev) =>
      prev.map((s) => (s._id === sessionId ? { ...s, featured: newFeatured } : s))
    );
    try {
      await axios.patch("/api/partner-sessions", {
        id: sessionId,
        featured: newFeatured,
      });
      showToast(newFeatured ? "Marked as Featured!" : "Unmarked from Featured");
    } catch (err) {
      console.error("Failed to toggle featured status", err);
      // Revert on error
      setSessions((prev) =>
        prev.map((s) => (s._id === sessionId ? { ...s, featured: currentFeatured } : s))
      );
    }
  };

  const moveSession = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sessions.length) return;

    const newSessions = [...sessions];
    const [moved] = newSessions.splice(index, 1);
    newSessions.splice(targetIndex, 0, moved);

    const updatedWithOrder = newSessions.map((s, idx) => ({
      ...s,
      order: idx,
    }));
    setSessions(updatedWithOrder);

    try {
      setOrderSaving(true);
      await axios.patch("/api/partner-sessions", {
        orderedIds: updatedWithOrder.map((s) => s._id),
      });
      showToast("Session order saved!");
    } catch (err) {
      console.error("Failed to save session order", err);
    } finally {
      setOrderSaving(false);
    }
  };

  const handleInlineOrderSave = async (sessionId?: string, newOrder?: number) => {
    if (!sessionId || newOrder === undefined || isNaN(newOrder)) return;
    try {
      setOrderSaving(true);
      await axios.patch("/api/partner-sessions", {
        id: sessionId,
        order: newOrder,
      });
      setSessions((prev) =>
        prev
          .map((s) => (s._id === sessionId ? { ...s, order: newOrder } : s))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );
      showToast("Order updated!");
    } catch (err) {
      console.error("Failed to update session order", err);
    } finally {
      setOrderSaving(false);
    }
  };

  const startEdit = (session: PartnerSession) => {
    setEditing(session);
    setForm({
      ...session,
      order: session.order ?? 0,
      maxCapacity: session.maxCapacity ?? 0,
      variants: session.variants ? [...session.variants] : [],
    });
    setShowAdd(true);
  };

  const addVariant = () => {
    setForm((f) => ({
      ...f,
      variants: [
        ...(f.variants || []),
        { title: "", description: "", price: 0, duration: 30 },
      ],
    }));
  };

  const updateVariant = (
    index: number,
    field: keyof PartnerSessionVariant,
    value: string | number,
  ) => {
    setForm((f) => {
      const updated = [...(f.variants || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, variants: updated };
    });
  };

  const removeVariant = (index: number) => {
    setForm((f) => {
      const updated = [...(f.variants || [])];
      updated.splice(index, 1);
      return { ...f, variants: updated };
    });
  };

  return (
    <DefaultLayout>
      <div className="flex min-h-[calc(100vh-124px)] w-full flex-col gap-4 p-4">
        {/* Top Controls Bar */}
        <div className="flex w-full flex-wrap items-center justify-between gap-3 bg-white p-3 rounded shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="w-56 md:w-64 rounded border p-2 text-sm"
              placeholder="Search title or partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded border p-2 text-sm"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="all">Status: All</option>
              <option value="true">Status: Active</option>
              <option value="false">Status: Inactive</option>
            </select>
            <select
              className="rounded border p-2 text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="order">Sort: Dashboard Order</option>
              <option value="date">Sort: Date (Latest first)</option>
            </select>
            {(orderSaving || toastMessage) && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  orderSaving
                    ? "bg-yellow-100 text-yellow-800 animate-pulse"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {orderSaving ? "Saving order..." : toastMessage}
              </span>
            )}
          </div>
          <div>
            <button
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
              onClick={() => {
                setShowAdd((s) => !s);
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              {showAdd ? "Close Form" : "+ Add Session"}
            </button>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showAdd && (
          <div className="rounded bg-white p-4 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              {editing ? "Edit Session" : "Create Session"}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  className="w-full rounded border p-2"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Partner Name
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.partnerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, partnerName: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  className="w-full rounded border p-2"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
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
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Display Order
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.order ?? 0}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      order: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
                <span className="text-xs text-gray-500">
                  Lower numbers appear first (0, 1, 2...)
                </span>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Session Type
                </label>
                <select
                  className="w-full rounded border p-2"
                  value={form.sessionType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sessionType: e.target.value as SessionType,
                    }))
                  }
                >
                  <option value="one-to-one">One-to-one</option>
                  <option value="webinar">Webinar</option>
                </select>
              </div>
              {form.sessionType === "webinar" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Max Capacity (Attendee Limit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50 (0 = unlimited)"
                    className="w-full rounded border p-2"
                    value={form.maxCapacity ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxCapacity: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                      }))
                    }
                  />
                  <span className="text-xs text-gray-500">
                    Max bookings before session disables as Fully Booked (0 for unlimited)
                  </span>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  WhatsApp
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.whatsappNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, whatsappNumber: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Partner Email
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.partnerEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, partnerEmail: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Profit Percentage (%)
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.profitPercentage}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      profitPercentage: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Subscription Discount (%)
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.subscriptionDiscountPercentage}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      subscriptionDiscountPercentage:
                        parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Meeting Link
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.meetingLink}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, meetingLink: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Image</label>
                <div className="flex items-center gap-3">
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="Session"
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <UploadButton
                    endpoint="mediaUploader"
                    onClientUploadComplete={(res: any) => {
                      if (res && res[0]) {
                        setForm((f) => ({ ...f, imageUrl: res[0].url }));
                      }
                    }}
                    onUploadError={(err: any) => {
                      console.error("Upload error", err);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={Boolean(form.featured)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, featured: e.target.checked }))
                  }
                />
                <label htmlFor="featured" className="text-sm font-medium text-amber-700 font-semibold">
                  ★ Featured Session (displayed in top section)
                </label>
              </div>

              {/* Variants Section */}
              <div className="md:col-span-2 border-t pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">Session Variants</h4>
                    <p className="text-xs text-gray-500">
                      Add duration and pricing tiers (e.g. 30 mins, 60 mins).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="rounded border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary hover:text-white"
                  >
                    + Add Variant
                  </button>
                </div>

                {(!form.variants || form.variants.length === 0) ? (
                  <div className="rounded border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
                    No variants added yet. Click &quot;+ Add Variant&quot; above to add options.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {form.variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-md border border-gray-200 bg-gray-50 p-4 shadow-sm"
                      >
                        <div className="mb-2 flex items-center justify-between border-b pb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Variant #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeVariant(idx)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Variant Title
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 30 Minutes Session"
                              className="w-full rounded border bg-white p-2 text-sm"
                              value={v.title}
                              onChange={(e) =>
                                updateVariant(idx, "title", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Duration (minutes)
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="30"
                              className="w-full rounded border bg-white p-2 text-sm"
                              value={v.duration}
                              onChange={(e) =>
                                updateVariant(
                                  idx,
                                  "duration",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Price
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="100"
                              className="w-full rounded border bg-white p-2 text-sm"
                              value={v.price}
                              onChange={(e) =>
                                updateVariant(
                                  idx,
                                  "price",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Description
                            </label>
                            <textarea
                              placeholder="Details about what is covered in this variant..."
                              rows={2}
                              className="w-full rounded border bg-white p-2 text-sm"
                              value={v.description}
                              onChange={(e) =>
                                updateVariant(idx, "description", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
              {editing ? (
                <>
                  <button
                    className="rounded bg-gray-200 px-4 py-2 text-sm"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-opacity-90"
                    onClick={handleUpdate}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-opacity-90"
                  onClick={handleCreate}
                >
                  Create Session
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <div className="rounded bg-white p-4 shadow">
          {loading ? (
            <div className="flex h-20 items-center justify-center text-sm text-gray-500">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No sessions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left text-sm">
                <thead className="bg-secondary text-creamey">
                  <tr>
                    <th className="px-3 py-2 text-center w-28">Order</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Partner</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Variants</th>
                    <th className="px-3 py-2">Profit %</th>
                    <th className="px-3 py-2">Capacity & Bookings</th>
                    <th className="px-3 py-2 text-center">Featured</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, idx) => (
                    <tr key={s._id} className="border-b hover:bg-gray-50">
                      {/* Order Controls */}
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0 || orderSaving}
                            onClick={() => moveSession(idx, "up")}
                            title="Move Up"
                            className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed"
                          >
                            ▲
                          </button>
                          <input
                            type="number"
                            value={s.order ?? idx}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setSessions((prev) =>
                                prev.map((item) =>
                                  item._id === s._id ? { ...item, order: val } : item
                                )
                              );
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleInlineOrderSave(s._id, isNaN(val) ? idx : val);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = parseInt((e.target as HTMLInputElement).value, 10);
                                handleInlineOrderSave(s._id, isNaN(val) ? idx : val);
                              }
                            }}
                            className="w-12 rounded border p-1 text-center text-xs font-semibold"
                            title="Edit order and press Enter or click outside to save"
                          />
                          <button
                            type="button"
                            disabled={idx === sessions.length - 1 || orderSaving}
                            onClick={() => moveSession(idx, "down")}
                            title="Move Down"
                            className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed"
                          >
                            ▼
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium">
                        <div>{s.title}</div>
                        {s.meetingLink && (
                          <a
                            href={s.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-xs font-normal text-primary underline"
                          >
                            Meeting Link ↗
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-2">{s.partnerName}</td>
                      <td className="px-3 py-2">{s.sessionType || "-"}</td>
                      <td className="px-3 py-2">
                        {s.variants && s.variants.length > 0 ? (
                          <span title={s.variants.map(v => `${v.title}: ${v.price}`).join(", ")}>
                            {Math.min(...s.variants.map((v) => v.price))} - {Math.max(...s.variants.map((v) => v.price))}
                          </span>
                        ) : (
                          s.price
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {s.variants && s.variants.length > 0 ? (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                            {s.variants.length} variant{s.variants.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{s.profitPercentage}%</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1 items-start">
                          {s.sessionType === "webinar" ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-gray-700">
                                {s.bookings?.length || 0} / {s.maxCapacity && s.maxCapacity > 0 ? s.maxCapacity : "∞"}
                              </span>
                              {s.maxCapacity && s.maxCapacity > 0 && (s.bookings?.length || 0) >= s.maxCapacity ? (
                                <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                  Full
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  Open
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {s.bookings?.length || 0} booking{(s.bookings?.length || 0) === 1 ? "" : "s"}
                            </span>
                          )}
                          {(s.bookings && s.bookings.length > 0) && (
                            <button
                              type="button"
                              onClick={() => setViewingBookingsSession(s)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 underline mt-0.5"
                            >
                              View Attendees ({s.bookings.length})
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleFeatured(s._id, s.featured)}
                          title="Click to toggle featured"
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
                            s.featured
                              ? "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {s.featured ? "★ Featured" : "☆ Standard"}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            s.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {s.isActive ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            className="text-primary underline hover:text-opacity-80"
                            onClick={() => startEdit(s)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 underline hover:text-opacity-80"
                            onClick={() => handleDelete(s._id)}
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

      {/* Bookings / Attendees Modal */}
      {viewingBookingsSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingBookingsSession(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Bookings: {viewingBookingsSession.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Partner: <span className="font-medium text-gray-700">{viewingBookingsSession.partnerName}</span> • Type:{" "}
                  <span className="capitalize font-medium text-gray-700">{viewingBookingsSession.sessionType}</span> • Total Bookings:{" "}
                  <span className="font-bold text-blue-600">{viewingBookingsSession.bookings?.length || 0}</span>
                  {viewingBookingsSession.maxCapacity && viewingBookingsSession.maxCapacity > 0
                    ? ` / ${viewingBookingsSession.maxCapacity} seats`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingBookingsSession(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content / Bookings Table */}
            <div className="overflow-y-auto p-6 flex-1">
              {(!viewingBookingsSession.bookings || viewingBookingsSession.bookings.length === 0) ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No bookings recorded yet for this session.
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">Attendee</th>
                        <th className="px-3 py-2.5">Email</th>
                        <th className="px-3 py-2.5">Phone</th>
                        <th className="px-3 py-2.5">Variant</th>
                        <th className="px-3 py-2.5">Booked At</th>
                        <th className="px-3 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewingBookingsSession.bookings.map((b, idx) => (
                        <tr key={b._id || idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-gray-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {b.clientFirstName} {b.clientLastName}
                          </td>
                          <td className="px-3 py-2 text-gray-600 font-mono">
                            <a href={`mailto:${b.clientEmail}`} className="hover:underline">
                              {b.clientEmail}
                            </a>
                          </td>
                          <td className="px-3 py-2 text-gray-600 font-mono">
                            <a
                              href={`https://wa.me/${String(b.clientPhone).replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:underline"
                            >
                              {b.clientPhone}
                            </a>
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {b.variantTitle || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                            {b.bookedAt ? new Date(b.bookedAt).toLocaleString() : "-"}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                b.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : b.status === "instapay_review"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {b.status || "confirmed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t px-6 py-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setViewingBookingsSession(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}

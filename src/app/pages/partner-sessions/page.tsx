"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { UploadButton } from "@/utils/uploadthing";

type SessionType = "one-to-one" | "webinar";

interface PartnerSessionVariant {
  title: string;
  description: string;
  price: number;
  duration: number;
}

interface PartnerSession {
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
  variants: [],
  meetingLink: "",
};

export default function PartnerSessionsPage() {
  const [sessions, setSessions] = useState<PartnerSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<PartnerSession>(emptyForm);
  const [editing, setEditing] = useState<PartnerSession | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeFilter !== "all") params.set("isActive", activeFilter);
    return params.toString();
  }, [search, activeFilter]);

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
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await axios.delete(`/api/partner-sessions?id=${id}`);
      setSessions((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const startEdit = (session: PartnerSession) => {
    setEditing(session);
    setForm({
      ...session,
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
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              className="w-64 rounded border p-2"
              placeholder="Search title or partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded border p-2"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <button
              className="rounded bg-primary px-4 py-2 text-white"
              onClick={() => {
                setShowAdd((s) => !s);
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              {showAdd ? "Close Form" : "Add Session"}
            </button>
          </div>
        </div>

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
                  Subscription Discount %
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
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Image</label>
                <div className="flex flex-col gap-2">
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="Session image"
                      className="h-40 w-auto rounded border object-contain"
                    />
                  )}
                  <UploadButton
                    appearance={{
                      button: "bg-primary px-4 py-2",
                    }}
                    endpoint="mediaUploader"
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setForm((f) => ({ ...f, imageUrl: res[0].url }));
                      }
                    }}
                    onUploadError={(error: Error) => {
                      alert(`ERROR! ${error.message}`);
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Meeting Link (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://zoom.us/... or https://meet.google.com/..."
                  className="w-full rounded border p-2"
                  value={form.meetingLink || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, meetingLink: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Active</label>
                <select
                  className="w-full rounded border p-2"
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      isActive: e.target.value === "true",
                    }))
                  }
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            </div>

            {/* Variants Section */}
            <div className="mt-6 border-t pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-md font-semibold text-gray-800">
                    Session Variants
                  </h4>
                  <p className="text-xs text-gray-500">
                    Add specific variants (e.g., duration, topics, pricing). If empty, the base session price and title will be used.
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
                  No variants added yet. Click &quot;+ Add Variant&quot; above to add options like 30-min, 60-min, etc.
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
                    className="rounded bg-primary px-4 py-2 text-sm text-white"
                    onClick={handleUpdate}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  className="rounded bg-primary px-4 py-2 text-sm text-white"
                  onClick={handleCreate}
                >
                  Create Session
                </button>
              )}
            </div>
          </div>
        )}

        <div className="rounded bg-white p-4 shadow">
          {loading ? (
            <div className="flex h-20 items-center justify-center">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center">No sessions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead className="bg-secondary text-creamey">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Partner</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Variants</th>
                    <th className="px-3 py-2">Profit %</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s._id} className="border-b hover:bg-gray-50">
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
    </DefaultLayout>
  );
}

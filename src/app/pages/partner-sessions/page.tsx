"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { UploadButton } from "@/utils/uploadthing";

type SessionType = "one-to-one" | "webinar";

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
    setForm({ ...session });
    setShowAdd(true);
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
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Price</label>
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
                    <th className="px-3 py-2">Profit %</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s._id} className="border-b">
                      <td className="px-3 py-2">{s.title}</td>
                      <td className="px-3 py-2">{s.partnerName}</td>
                      <td className="px-3 py-2">{s.sessionType || "-"}</td>
                      <td className="px-3 py-2">{s.price}</td>
                      <td className="px-3 py-2">{s.profitPercentage}</td>
                      <td className="px-3 py-2">{s.isActive ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            className="text-primary underline"
                            onClick={() => startEdit(s)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 underline"
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

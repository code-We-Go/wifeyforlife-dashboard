"use client";
import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";

const BannersPage = () => {
  const [banner, setBanner] = useState({ announcementBar: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/banners");
        setBanner(res.data.data || { announcementBar: "" });
      } catch (err) {
        setError("Failed to load banner");
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBanner({ ...banner, announcementBar: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await axios.patch("/api/banners", {
        announcementBar: banner.announcementBar,
      });
      // await axios.put("/api/banners", banner);
      setEditing(false);
    } catch (err) {
      setError("Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto mt-10  rounded  p-6 ">
        <h1 className="mb-4 text-2xl font-bold text-primary">Banners</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <label className="mb-2 block font-medium">Announcement Bar</label>
            <input
              type="text"
              className="mb-4 w-full rounded border px-3 py-2"
              value={banner.announcementBar}
              onChange={handleChange}
              disabled={!editing}
            />
            {error && <div className="mb-2 text-red-500">{error}</div>}
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    className="rounded bg-primary px-4 py-2 text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="rounded bg-gray-300 px-4 py-2"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="rounded bg-primary px-4 py-2 text-white"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </DefaultLayout>
  );
};

export default BannersPage;

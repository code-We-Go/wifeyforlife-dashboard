"use client";
import React, { useState, useEffect } from "react";
import { Playlist, PlaylistFolder, Video } from "@/interfaces/interfaces";
import axios from "axios";
import { UploadButton } from "@/utils/uploadthing";
import Image from "next/image";

interface AddPlaylistModalProps {
  isModalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
}

/** Convert any string to a URL-safe slug */
const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const EMPTY_FORM = {
  title: "",
  description: "",
  thumbnailUrl: "",
  category: "",
  isPublic: true,
  featured: false,
  folders: [] as PlaylistFolder[],
  /** Each entry: { videoId, folder?: slug } */
  videos: [] as { videoId: string; folder?: string }[],
};

const AddPlaylistModal: React.FC<AddPlaylistModalProps> = ({
  isModalOpen,
  setModalOpen,
  setPlaylists,
}) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [availableVideos, setAvailableVideos] = useState<Video[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // Folder input state
  const [folderName, setFolderName] = useState("");

  useEffect(() => {
    if (isModalOpen) fetchAvailableVideos();
  }, [isModalOpen]);

  const fetchAvailableVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const response = await axios.get("/api/videos?all=true");
      setAvailableVideos(response.data.data);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ── Folder management ──────────────────────────────────────────────────────

  const addFolder = () => {
    const name = folderName.trim();
    if (!name) return;
    const slug = toSlug(name);
    if (formData.folders.some((f) => f.slug === slug)) return; // no duplicates
    setFormData((prev) => ({
      ...prev,
      folders: [...prev.folders, { name, slug }],
    }));
    setFolderName("");
  };

  const removeFolder = (slug: string) => {
    setFormData((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.slug !== slug),
      // clear folder from any video that had it
      videos: prev.videos.map((v) =>
        v.folder === slug ? { ...v, folder: undefined } : v,
      ),
    }));
  };

  // ── Video management ───────────────────────────────────────────────────────

  const isVideoSelected = (videoId: string) =>
    formData.videos.some((v) => v.videoId === videoId);

  const toggleVideo = (videoId: string) => {
    if (isVideoSelected(videoId)) {
      setFormData((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v.videoId !== videoId),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        videos: [...prev.videos, { videoId }],
      }));
    }
  };

  const setVideoFolder = (videoId: string, folder: string) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.videoId === videoId
          ? { ...v, folder: folder || undefined }
          : v,
      ),
    }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        videos: formData.videos.map((v) => v.videoId),
      };
      const response = await axios.post("/api/playlists", payload);
      setPlaylists((prev) => [response.data.data, ...prev]);
      setModalOpen(false);
      setFormData(EMPTY_FORM);
      setFolderName("");
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Failed to create playlist");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 md:pl-72.5">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Playlist</h2>
          <button
            onClick={() => setModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title + Category */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Thumbnail Image *
            </label>
            <div className="flex flex-col gap-2">
              {formData.thumbnailUrl && (
                <Image
                  width={80}
                  height={60}
                  src={formData.thumbnailUrl}
                  alt="Thumbnail Preview"
                  className="mt-2 h-30 w-40 rounded border border-gray-300 object-cover"
                />
              )}
              <UploadButton
                className="flex w-fit rounded-2xl bg-primary px-2"
                endpoint="mediaUploader"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    setFormData((prev) => ({ ...prev, thumbnailUrl: res[0].url }));
                  }
                }}
                onUploadError={(error: Error) => alert(`ERROR! ${error.message}`)}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Public Playlist
            </label>
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="ml-6 mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Featured</label>
          </div>

          {/* ── Folder Manager ─────────────────────────────────────────────── */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Folders ({formData.folders.length})
            </label>

            {/* Add row */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Folder name, e.g. Week 1"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFolder())}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {folderName && (
                <span className="self-center rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                  slug: {toSlug(folderName)}
                </span>
              )}
              <button
                type="button"
                onClick={addFolder}
                className="rounded-md bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90"
              >
                Add Folder
              </button>
            </div>

            {/* Chips */}
            {formData.folders.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.folders.map((folder) => (
                  <span
                    key={folder.slug}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                  >
                    <span className="font-medium">{folder.name}</span>
                    <span className="text-xs text-gray-400">#{folder.slug}</span>
                    <button
                      type="button"
                      onClick={() => removeFolder(folder.slug)}
                      className="ml-1 text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Video Picker ───────────────────────────────────────────────── */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Videos ({formData.videos.length} selected)
            </label>

            {/* Selected summary (with folder badge) */}
            {formData.videos.length > 0 && (
              <div className="mb-3 space-y-1 rounded-md border border-primary/30 bg-primary/5 p-2">
                {formData.videos.map((entry, idx) => {
                  const vid = availableVideos.find((v) => v._id === entry.videoId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded bg-white p-2 text-sm"
                    >
                      {vid?.thumbnailUrl && (
                        <Image
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          width={48}
                          height={32}
                          className="flex-shrink-0 rounded object-cover"
                        />
                      )}
                      <span className="flex-1 truncate text-gray-800">
                        {vid?.title ?? entry.videoId}
                      </span>

                      {/* Folder selector */}
                      {formData.folders.length > 0 && (
                        <select
                          value={entry.folder ?? ""}
                          onChange={(e) =>
                            setVideoFolder(entry.videoId, e.target.value)
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Uncategorised</option>
                          {formData.folders.map((f) => (
                            <option key={f.slug} value={f.slug}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleVideo(entry.videoId)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available video grid */}
            {isLoadingVideos ? (
              <div className="py-4 text-center">Loading videos...</div>
            ) : availableVideos.length > 0 ? (
              <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-gray-300 p-2 md:grid-cols-2 lg:grid-cols-3">
                {availableVideos.map((video) => (
                  <div
                    key={video._id}
                    className={`flex cursor-pointer items-center space-x-2 rounded p-2 ${
                      isVideoSelected(video._id || "")
                        ? "border border-primary bg-primary/10"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => toggleVideo(video._id || "")}
                  >
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      checked={isVideoSelected(video._id || "")}
                      onChange={() => toggleVideo(video._id || "")}
                      className="mr-2"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-900">{video.title}</p>
                      {video.playlistHint && (
                        <p className="truncate text-xs text-gray-500">
                          ({video.playlistHint})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">
                No videos available. Please create some videos first.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Playlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlaylistModal;

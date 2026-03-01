"use client";
import React, { useState, useEffect } from "react";
import { Playlist, PlaylistFolder, Video } from "@/interfaces/interfaces";
import axios from "axios";
import Image from "next/image";
import { UploadButton } from "@/utils/uploadthing";
import { useDrag, useDrop } from "react-dnd";

// ─────────────────────────────────────────────────────────────────────────────
// Module-level drag-and-drop row for selected videos.
// IMPORTANT: must be defined OUTSIDE PlaylistComponent so React never remounts
// instances just because the parent re-renders (each render would otherwise
// create a new component type, causing all folder selects to reset).
// ─────────────────────────────────────────────────────────────────────────────
const VIDEO_DND_TYPE = "playlist_edit_video";

interface DraggableVideoRowProps {
  entry: { videoId: string; _video?: Video };
  index: number;
  video?: Video;           // looked up from availableVideos (full list, loaded later)
  folders: PlaylistFolder[];
  onFolderChange: (videoId: string, folder: string) => void;
  onRemove: (videoId: string) => void;
  onMove: (from: number, to: number) => void;
}

const DraggableVideoRow: React.FC<DraggableVideoRowProps> = ({
  entry,
  index,
  video: videoProp,
  folders,
  onFolderChange,
  onRemove,
  onMove,
}) => {
  // Prefer the fully-loaded video from availableVideos; fall back to what we
  // already have from the populated playlist response (_video on the entry).
  const video = videoProp ?? entry._video;
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: VIDEO_DND_TYPE,
    hover(item: { index: number }) {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: VIDEO_DND_TYPE,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="mb-1 flex cursor-move items-center gap-2 rounded border border-gray-200 bg-white p-2"
    >
      {video?.thumbnailUrl && (
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          width={56}
          height={40}
          className=" rounded object-cover"
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-gray-900">
          {video?.title ?? entry.videoId}
        </p>
        {video?.playlistHint && (
          <p className="truncate text-xs text-gray-500">({video.playlistHint})</p>
        )}
      </div>

      {folders.length > 0 && (
        <select
          value={video?.playlistFolder ?? ""}
          onChange={(e) => onFolderChange(entry.videoId, e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Uncategorised</option>
          {folders.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        className="text-xs text-red-500 hover:text-red-700"
        onClick={() => onRemove(entry.videoId)}
      >
        Remove
      </button>
    </div>
  );
};


interface PlaylistComponentProps {
  playlist: Playlist;
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
}

/** Convert any string to a URL-safe slug */
const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

/** Resolve any video entry shape into { videoId, _video? } for the form.
 *  Handles three cases that can arrive from the API:
 *  1. Old schema, non-populated : "64abc..." (plain ObjectId string)
 *  2. Old schema, populated     : { _id: "64abc...", title: "...", ... }  (Video object)
 *  3. New schema                : { videoId: "64abc..." | VideoObj }
 *
 * When a full Video object is available it is stored as `_video` so rows can
 * render thumbnails/titles before the full availableVideos fetch completes.
 */
function resolveVideoEntry(v: unknown): { videoId: string; _video?: Video } {
  if (!v) return { videoId: "" };

  // Case 1: plain string ID
  if (typeof v === "string") return { videoId: v };

  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;

    // Case 3: new schema — object has a `videoId` field
    if ("videoId" in obj) {
      const vid = obj.videoId;
      if (vid && typeof vid === "object" && "_id" in (vid as Record<string, unknown>)) {
        // videoId is a fully populated Video document
        const populated = vid as Video;
        return { videoId: String(populated._id ?? ""), _video: populated };
      }
      return { videoId: String(vid ?? "") };
    }

    // Case 2: old schema populated Video object — has `_id` directly
    if ("_id" in obj) {
      return { videoId: String(obj._id ?? ""), _video: obj as unknown as Video };
    }
  }

  return { videoId: "" };
}


const PlaylistComponent: React.FC<PlaylistComponentProps> = ({
  playlist,
  setPlaylists,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(() => ({
    title: playlist.title,
    description: Array.isArray(playlist.description)
      ? playlist.description
      : playlist.description
        ? [playlist.description]
        : [],
    thumbnailUrl: playlist.thumbnailUrl,
    category: playlist.category || "",
    tags: playlist.tags || [],
    isPublic: playlist.isPublic,
    featured: typeof playlist.featured === "boolean" ? playlist.featured : false,
    folders: (playlist.folders ?? []) as PlaylistFolder[],
    videos: (playlist.videos ?? [])
      .map(resolveVideoEntry)
      .filter((e) => e.videoId !== ""), // drop stale refs to deleted videos
  }));

  const [availableVideos, setAvailableVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoSearch, setVideoSearch] = useState("");
  const [playlistHintSearch, setPlaylistHintSearch] = useState("");

  // Folder input state
  const [folderName, setFolderName] = useState("");

  useEffect(() => {
    if (!isEditing) return;

    // Pre-seed availableVideos from the already-populated playlist.videos so
    // thumbnails & titles appear immediately before the full fetch resolves.
    const seeded: Video[] = [];
    for (const v of playlist.videos ?? []) {
      const vid = (v as unknown as { videoId: unknown }).videoId;
      if (vid && typeof vid === "object" && "_id" in (vid as Record<string, unknown>)) {
        seeded.push(vid as Video);
      }
    }
    if (seeded.length > 0) setAvailableVideos(seeded);

    fetchAvailableVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

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
    if (formData.folders.some((f) => f.slug === slug)) return;
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
      const _video = availableVideos.find((v) => v._id === videoId);
      setFormData((prev) => ({
        ...prev,
        videos: [...prev.videos, { videoId, _video }],
      }));
    }
  };

  const setVideoFolder = async (videoId: string, folder: string) => {
    if (!videoId) return; // guard: skip stale/unresolved entries
    try {
      await axios.put(`/api/videos?videoID=${videoId}`, {
        playlistFolder: folder || null,
      });
      // Reflect the change in local availableVideos so the dropdown updates immediately
      setAvailableVideos((prev) =>
        prev.map((v) =>
          v._id === videoId
            ? { ...v, playlistFolder: folder || undefined }
            : v,
        ),
      );
    } catch (err) {
      console.error("Error updating video folder:", err);
      alert("Failed to update video folder");
    }
  };

  // ── Reorder selected videos (drag-and-drop) ────────────────────────────────

  const moveVideo = (from: number, to: number) => {
    setFormData((prev) => {
      const updated = [...prev.videos];
      const [removed] = updated.splice(from, 1);
      updated.splice(to, 0, removed);
      return { ...prev, videos: updated };
    });
  };


  // ── Save / Delete ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        videos: formData.videos.map((v) => v.videoId),
      };
      const response = await axios.put(
        `/api/playlists?playlistID=${playlist._id}`,
        payload,
      );
      setPlaylists((prev) =>
        prev.map((p) => (p._id === playlist._id ? response.data.data : p)),
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating playlist:", error);
      alert("Failed to update playlist");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    setIsDeleting(true);
    try {
      await axios.delete("/api/playlists", {
        data: { playlistID: playlist._id },
      });
      setPlaylists((prev) => prev.filter((p) => p._id !== playlist._id));
    } catch (error) {
      console.error("Error deleting playlist:", error);
      alert("Failed to delete playlist");
    } finally {
      setIsDeleting(false);
    }
  };

  const getVideoCount = () =>
    Array.isArray(playlist.videos) ? playlist.videos.length : 0;

  const getFolderCount = () =>
    Array.isArray(playlist.folders) ? playlist.folders.length : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // EDIT MODAL
  // ══════════════════════════════════════════════════════════════════════════

  if (isEditing) {
    const filteredAvailableVideos = availableVideos.filter((video) => {
      const matchesTitle = video.title
        .toLowerCase()
        .includes(videoSearch.toLowerCase());
      const matchesHint = playlistHintSearch
        ? video.playlistHint
            ?.toLowerCase()
            .includes(playlistHintSearch.toLowerCase())
        : true;
      return matchesTitle && matchesHint;
    });

    return (
      <div
        onClick={() => setIsEditing(false)}
        className="fixed inset-0 z-20 flex h-full w-full items-center justify-center bg-black/30 md:pl-72.5"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="mb-4 max-h-[90vh] w-full max-w-4xl overflow-y-scroll rounded-md bg-white p-6 shadow-md"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">
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

            {/* Description points */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-secondary">
                Description Points
              </label>
              {formData.description.map((point, idx) => (
                <div key={idx} className="mb-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => {
                      const newDesc = [...formData.description];
                      newDesc[idx] = e.target.value;
                      setFormData((prev) => ({ ...prev, description: newDesc }));
                    }}
                    className="flex-1 rounded border px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        description: prev.description.filter((_, i) => i !== idx),
                      }))
                    }
                    className="text-xs text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    description: [...prev.description, ""],
                  }))
                }
                className="mt-2 rounded bg-primary px-2 py-1 text-sm text-white"
              >
                Add Point
              </button>
            </div>

            {/* Thumbnail */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-secondary">
                Thumbnail Image
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
                  className="flex w-fit rounded-md bg-primary px-2"
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                      setFormData((prev) => ({
                        ...prev,
                        thumbnailUrl: res[0].url,
                      }));
                    }
                  }}
                  onUploadError={(error) => alert(`ERROR! ${error.message}`)}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex items-center md:col-span-2">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-secondary">
                Public Playlist
              </label>
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="ml-6 mr-2"
              />
              <label className="text-sm font-medium text-secondary">
                Featured
              </label>
            </div>

            {/* ── Folder Manager ────────────────────────────────────────────── */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-secondary">
                Folders ({formData.folders.length})
              </label>

              {/* Add row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Folder name, e.g. Week 1"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addFolder())
                  }
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
                      <span className="text-xs text-gray-400">
                        #{folder.slug}
                      </span>
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

            {/* ── Video section ─────────────────────────────────────────────── */}
            <div className="mt-2 md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-secondary">
                Select Videos ({formData.videos.length} selected)
              </label>

              {/* Drag-and-drop list for selected videos */}
              {formData.videos.length > 0 && (
                <div className="mb-4 max-h-52 overflow-y-auto rounded-md border border-primary/30 bg-primary/5 p-2">
                  {formData.videos.map((entry, idx) => (
                    <DraggableVideoRow
                      key={entry.videoId || idx}
                      entry={entry}
                      index={idx}
                      video={availableVideos.find((v) => v._id === entry.videoId)}
                      folders={formData.folders}
                      onFolderChange={setVideoFolder}
                      onRemove={toggleVideo}
                      onMove={moveVideo}
                    />
                  ))}
                </div>
              )}

              {/* Search + available video grid */}
              {isLoadingVideos ? (
                <div className="py-4 text-center">Loading videos...</div>
              ) : availableVideos.length > 0 ? (
                <div>
                  <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Filter videos by title..."
                      value={videoSearch}
                      onChange={(e) => setVideoSearch(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Filter by playlist hint..."
                      value={playlistHintSearch}
                      onChange={(e) => setPlaylistHintSearch(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-gray-300 p-2 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAvailableVideos.length > 0 ? (
                      filteredAvailableVideos.map((video) => (
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
                          <div className="relative h-12 w-16 flex-shrink-0">
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.title}
                              fill
                              className="rounded object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-gray-900">
                              {video.title}
                            </p>
                            {video.playlistHint && (
                              <p className="truncate text-xs text-gray-500">
                                ({video.playlistHint})
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-1 py-4 text-center text-gray-500 md:col-span-2 lg:col-span-3">
                        No videos match &quot;{videoSearch}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  No videos available. Please create some videos first.
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-primary px-4 py-2 text-primary hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // READ-ONLY CARD
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="mb-4 w-full rounded-md bg-secondary p-6 text-creamey shadow-md">
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Thumbnail */}
        <div className="relative h-32 w-full flex-shrink-0 md:w-48">
          <Image
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            fill
            className="rounded-md object-cover"
          />
          <div className="absolute bottom-2 right-2 rounded-md bg-black bg-opacity-75 px-2 py-1 text-xs text-white">
            {getVideoCount()} videos
          </div>
        </div>

        <div className="flex-1">
          {/* Title + actions */}
          <div className="mb-2 flex items-start justify-between">
            <h3 className="text-lg font-semibold text-creamey">
              {playlist.title}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md bg-creamey px-3 py-1 text-sm text-primary hover:bg-creamey/90"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="font-medium text-creamey/90">Category:</span>
              <span className="ml-1 text-creamey/90">
                {playlist.category || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-medium text-creamey/90">Status:</span>
              <span
                className={`ml-1 ${
                  playlist.isPublic ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {playlist.isPublic ? "Public" : "Private"}
              </span>
            </div>
            <div>
              <span className="font-medium text-creamey/90">Videos:</span>
              <span className="ml-1 text-creamey/90">{getVideoCount()}</span>
            </div>
            <div>
              <span className="font-medium text-creamey/90">Featured:</span>
              <span
                className={`ml-1 ${
                  playlist.featured ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {playlist.featured ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {/* Folders badge row */}
          {getFolderCount() > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(playlist.folders ?? []).map((f) => (
                <span
                  key={f.slug}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-creamey/80"
                >
                  📁 {f.name}
                </span>
              ))}
            </div>
          )}

          {/* Tags */}
          {playlist.tags && playlist.tags.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium text-creamey/90">Tags:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {playlist.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-md bg-white/10 px-2 py-1 text-xs text-creamey/90"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="mt-2 text-xs text-creamey/80">
            Created: {new Date(playlist.createdAt).toLocaleDateString()}
            {playlist.updatedAt &&
              playlist.updatedAt !== playlist.createdAt && (
                <span className="ml-4">
                  Updated: {new Date(playlist.updatedAt).toLocaleDateString()}
                </span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistComponent;

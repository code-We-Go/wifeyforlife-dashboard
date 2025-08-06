"use client";
import React, { useState } from "react";
import { Video } from "@/interfaces/interfaces";
import axios from "axios";
import Image from "next/image";
import { thirdFont } from "@/app/lib/fonts";
import { UploadButton } from "@/utils/uploadthing";

interface VideoComponentProps {
  video: Video;
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
}

const VideoComponent: React.FC<VideoComponentProps> = ({
  video,
  setVideos,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: video.title,
    description: video.description || "",
    url: video.url,
    thumbnailUrl: video.thumbnailUrl,
    isPublic: video.isPublic || false,
    playlistHint: video.playlistHint || "",
  });

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

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `/api/videos?videoID=${video._id}`,
        formData,
      );
      setVideos((prev) =>
        prev.map((v) => (v._id === video._id ? response.data.data : v)),
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating video:", error);
      alert("Failed to update video");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    setIsDeleting(true);
    try {
      await axios.delete("/api/videos", { data: { videoID: video._id } });
      setVideos((prev) => prev.filter((v) => v._id !== video._id));
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete video");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (isEditing) {
    return (
      <div 
      onClick={()=>setIsEditing(false)}
      className="fixed inset-0 z-10 flex h-full w-full items-center justify-center bg-black/30 md:pl-72.5">
        <div 
        onClick={(e)=>e.stopPropagation()}
        className="boder-lovely mb-4 max-h-[80vh] overflow-y-scroll rounded-2xl  border-2 bg-white p-6 shadow-md md:w-[50vw]">
          <div className="grid grid-cols-1 gap-4  md:col-span-2">
            <div className="w-full">
              <label className="mb-2 block text-sm font-medium text-primary/80">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Category
            </label>

          </div> */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-primary/80">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-2xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-primary/80">
                VDO ID
              </label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary/80">
                Playlist Hint
              </label>
              <input
                type="text"
                name="playlistHint"
                value={formData.playlistHint}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Duration (seconds)
            </label>

          </div> */}

            {/* <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Tags (comma-separated)
            </label>

          </div> */}

            <div className="md:col-span-2">
              {/* <label className="block text-sm font-medium text-primary/80 mb-2">
              Thumbnail URL
            </label>
            <input
              type="url"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            /> */}

              {formData.thumbnailUrl && (
                <div className="mt-2">
                  <p className="mb-2 text-xs text-gray-500">
                    Current thumbnail:
                  </p>
                  <div className="relative h-20 w-32 overflow-hidden rounded-lg border border-gray-300">
                    <Image
                      src={formData.thumbnailUrl}
                      alt="Thumbnail preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Or upload an image using the button below
              </p>
              <div className="mt-2">
                <UploadButton
                  className="w-fit rounded-2xl bg-primary p-2"
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                      setFormData((prev) => ({
                        ...prev,
                        thumbnailUrl: res[0].url,
                      }));
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`ERROR! ${error.message}`);
                  }}
                />
              </div>
            </div>

            <div className="mt-2 flex items-center md:col-span-2">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="mr-2 accent-primary"
              />
              <label className="text-sm font-medium text-primary/80">
                Public
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-2xl border  border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-2xl bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="mb-4 w-full  rounded-2xl bg-secondary p-6 text-creamey shadow-md">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative h-32 w-full flex-shrink-0 max-md:h-52 md:w-48">
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="aspect-video rounded-2xl object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="mb-2 flex items-start justify-between">
              <h3
                className={`${thirdFont.className} text-lg font-semibold md:text-2xl `}
              >
                {video.title}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-2xl bg-creamey px-3 py-1 text-sm text-primary hover:bg-creamey/80"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-2xl bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>

            {video.description && (
              <p className=" mb-2 whitespace-pre-line">{video.description}</p>
            )}

            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-primary/80">Category:</span>
            </div>
            <div>
              <span className="font-medium text-creamey/80">Status:</span>

            </div>
            <div>
              <span className="font-medium text-creamey/80">Duration:</span>

            </div>
            <div>
              <span className="font-medium text-creamey/80">Tags:</span>
            </div>
          </div> */}

            <div className="mt-2 text-xs text-creamey/70">
              Created: {new Date(video.createdAt).toLocaleDateString()}
              {video.updatedAt && video.updatedAt !== video.createdAt && (
                <span className="ml-4">
                  Updated: {new Date(video.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default VideoComponent;

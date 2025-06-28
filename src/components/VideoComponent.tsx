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

const VideoComponent: React.FC<VideoComponentProps> = ({ video, setVideos }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: video.title,
    description: video.description || "",
    url: video.url,
    thumbnailUrl: video.thumbnailUrl,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(`/api/videos?videoID=${video._id}`, formData);
      setVideos(prev => prev.map(v => v._id === video._id ? response.data.data : v));
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
      setVideos(prev => prev.filter(v => v._id !== video._id));
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
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isEditing) {
    return (
    <div className="fixed z-10 md:pl-72.5 inset-0 w-full h-full flex justify-center bg-black/30 items-center">
    <div className="bg-white max-h-[80vh] overflow-y-scroll border-2 md:w-[50vw]  boder-lovely rounded-2xl shadow-md p-6 mb-4">
        <div className="grid grid-cols-1 md:col-span-2  gap-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {/* <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Category
            </label>

          </div> */}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary/80 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary/80 mb-2">
              VDO ID
            </label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                <p className="text-xs text-gray-500 mb-2">Current thumbnail:</p>
                <div className="relative w-32 h-20 border border-gray-300 rounded-lg overflow-hidden">
                  <Image
                    src={formData.thumbnailUrl}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Or upload an image using the button below
            </p>
            <div className="mt-2">
              <UploadButton
                className="bg-primary w-fit p-2 rounded-2xl"
                endpoint="mediaUploader"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    setFormData(prev => ({ ...prev, thumbnailUrl: res[0].url }));
                  }
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
            </div>
          </div>

          {/* <div className="md:col-span-2 flex items-center">

            <label className="text-sm font-medium text-primary/80">
              Published
            </label>
          </div> */}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2  border border-gray-300 rounded-2xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      </div>
      </div>
    );
  }
else{
  return (
    <div className="bg-secondary text-primary rounded-2xl w-full shadow-md p-6 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-48 h-32 flex-shrink-0">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover rounded-2xl"
          />

        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className={`${thirdFont.className} text-lg md:text-2xl font-semibold `}>{video.title}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm bg-creamey text-primary rounded-2xl hover:bg-creamey/80"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded-2xl hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          {video.description && (
            <p className=" mb-2">{video.description}</p>
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
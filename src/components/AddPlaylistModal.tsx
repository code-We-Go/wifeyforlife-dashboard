"use client";
import React, { useState, useEffect } from "react";
import { Playlist, Video } from "@/interfaces/interfaces";
import axios from "axios";
import { UploadButton } from "@/utils/uploadthing";
import Image from "next/image";

interface AddPlaylistModalProps {
  isModalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
}

const AddPlaylistModal: React.FC<AddPlaylistModalProps> = ({ isModalOpen, setModalOpen, setPlaylists }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    category: "",
    tags: [] as string[],
    isPublic: true,
    videos: [] as string[],
    featured: false,
  });
  const [availableVideos, setAvailableVideos] = useState<Video[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      fetchAvailableVideos();
    }
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

  const handleVideoSelection = (videoId: string) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.includes(videoId)
        ? prev.videos.filter(id => id !== videoId)
        : [...prev.videos, videoId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/playlists", formData);
      setPlaylists(prev => [response.data.data, ...prev]);
      setModalOpen(false);
      setFormData({
        title: "",
        description: "",
        thumbnailUrl: "",
        category: "",
        tags: [],
        isPublic: true,
        videos: [],
        featured: false,
      });
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Failed to create playlist");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black md:pl-72.5 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Playlist</h2>
          <button
            onClick={() => setModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags.join(", ")}
              onChange={handleTagsChange}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Image *
            </label>
            <div className="flex flex-col gap-2">
              {formData.thumbnailUrl && (
                <Image
                  width={80}
                  height={60}
                  src={formData.thumbnailUrl}
                  alt="Thumbnail Preview"
                  className="w-40 h-30 object-cover rounded border border-gray-300 mt-2"
                />
              )}
              <UploadButton
                className="bg-primary flex w-fit px-2 rounded-2xl"
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
            <label className="text-sm font-medium text-gray-700">
              Featured
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Videos ({formData.videos.length} selected)
            </label>
            {isLoadingVideos ? (
              <div className="text-center py-4">Loading videos...</div>
            ) : availableVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                {availableVideos.map((video) => (
                  <div
                    key={video._id}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                      formData.videos.includes(video._id || "")
                        ? "bg-primary/10 border border-primary"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => handleVideoSelection(video._id || "")}
                  >
                    <input
                    onClick={(e)=>e.stopPropagation()}
                      type="checkbox"
                      checked={formData.videos.includes(video._id || "")}
                      onChange={() => handleVideoSelection(video._id || "")}
                      className="mr-2"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{video.title}</p>
                      {video.playlistHint && <p className="text-sm text-gray-900 truncate">({video.playlistHint})</p>}


                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No videos available. Please create some videos first.
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
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
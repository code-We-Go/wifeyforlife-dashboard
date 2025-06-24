"use client";
import React, { useState } from "react";
import { Playlist, Video } from "@/interfaces/interfaces";
import axios from "axios";
import Image from "next/image";

interface PlaylistComponentProps {
  playlist: Playlist;
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
}

const PlaylistComponent: React.FC<PlaylistComponentProps> = ({ playlist, setPlaylists }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: playlist.title,
    description: playlist.description || "",
    thumbnailUrl: playlist.thumbnailUrl,
    category: playlist.category || "",
    tags: playlist.tags || [],
    isPublic: playlist.isPublic,
    videos: playlist.videos,
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
      const response = await axios.put(`/api/playlists?playlistID=${playlist._id}`, formData);
      setPlaylists(prev => prev.map(p => p._id === playlist._id ? response.data.data : p));
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
      await axios.delete("/api/playlists", { data: { playlistID: playlist._id } });
      setPlaylists(prev => prev.filter(p => p._id !== playlist._id));
    } catch (error) {
      console.error("Error deleting playlist:", error);
      alert("Failed to delete playlist");
    } finally {
      setIsDeleting(false);
    }
  };

  const getVideoCount = () => {
    if (Array.isArray(playlist.videos)) {
      return playlist.videos.length;
    }
    return 0;
  };

  const getVideos = (): Video[] => {
    if (Array.isArray(playlist.videos)) {
      return playlist.videos.filter(video => typeof video === 'object' && video !== null) as Video[];
    }
    return [];
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl-lg shadow-md p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-creamey/90 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-creamey/90 mb-2">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-creamey/90 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
{/* 
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-creamey/90 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags.join(", ")}
              onChange={handleTagsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div> */}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-creamey/90 mb-2">
              Thumbnail URL
            </label>
            <input
              type="url"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2 flex items-center">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-creamey/90">
              Public Playlist
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-creamey/90 border border-gray-300 rounded-2xl-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-2xl-md hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary text-creamey rounded-2xl w-full shadow-md p-6 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-48 h-32 flex-shrink-0">
          <Image
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            fill
            className="object-cover rounded-2xl"
          />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-2xl">
            {getVideoCount()} videos
          </div>
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-creamey">{playlist.title}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm bg-creamey text-primary rounded-2xl hover:bg-creamey/90"
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

          {playlist.description && (
            <p className="text-creamey/90 mb-2">{playlist.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-creamey/90">Category:</span>
              <span className="ml-1 text-creamey/90">{playlist.category || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium text-creamey/90">Status:</span>
              <span className={`ml-1 ${playlist.isPublic ? "text-green-600" : "text-yellow-600"}`}>
                {playlist.isPublic ? "Public" : "Private"}
              </span>
            </div>
            <div>
              <span className="font-medium text-creamey/90">Videos:</span>
              <span className="ml-1 text-creamey/90">{getVideoCount()}</span>
            </div>
            <div>
              <span className="font-medium text-creamey/90">Tags:</span>
              <span className="ml-1 text-creamey/90">{playlist.tags?.length || 0} tags</span>
            </div>
          </div>

          {playlist.tags && playlist.tags.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium text-creamey/90">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {playlist.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-creamey/90 text-xs rounded-2xl"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {getVideos().length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-creamey/90 mb-2">Videos in this playlist:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {getVideos().slice(0, 6).map((video, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-2xl">
                    <div className="relative w-12 h-8 flex-shrink-0">
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover rounded-2xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary">{video.title}</p>

                    </div>
                  </div>
                ))}
                {getVideos().length > 6 && (
                  <div className="flex items-center justify-center p-2 bg-gray-50 rounded-2xl">
                    <span className="text-xs text-gray-500">
                      +{getVideos().length - 6} more videos
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-2 text-xs text-creamey/80">
            Created: {new Date(playlist.createdAt).toLocaleDateString()}
            {playlist.updatedAt && playlist.updatedAt !== playlist.createdAt && (
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
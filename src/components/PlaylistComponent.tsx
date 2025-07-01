"use client";
import React, { useState, useEffect } from "react";
import { Playlist, Video } from "@/interfaces/interfaces";
import axios from "axios";
import Image from "next/image";
import { UploadButton } from "@/utils/uploadthing";
import { useDrag, useDrop } from "react-dnd";

interface PlaylistComponentProps {
  playlist: Playlist;
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
}

const PlaylistComponent: React.FC<PlaylistComponentProps> = ({ playlist, setPlaylists }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
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
    videos: Array.isArray(playlist.videos)
      ? playlist.videos.map((v) => (typeof v === "object" && v !== null ? v._id : v))
      : [],
    featured: typeof playlist.featured === 'boolean' ? playlist.featured : false,
  });
  const [availableVideos, setAvailableVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchAvailableVideos();
    }
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

  const handleVideoSelection = (videoId: string) => {
    setFormData(prev => ({
      ...prev,
      videos: (prev.videos as string[]).includes(videoId)
        ? (prev.videos as string[]).filter((id) => id !== videoId)
        : [...(prev.videos as string[]), videoId]
    }));
  };

  // Drag-and-drop item type
  const ItemTypes = { VIDEO: "video" };

  // Helper to get selected video objects in order
  const selectedVideoObjects = (formData.videos as string[])
    .map((id) => availableVideos.find((v) => v._id === id))
    .filter(Boolean) as Video[];

  // Drag-and-drop logic for selected videos
  const moveVideo = (from: number, to: number) => {
    setFormData((prev) => {
      const updated = [...(prev.videos as string[])];
      const [removed] = updated.splice(from, 1);
      updated.splice(to, 0, removed);
      return { ...prev, videos: updated };
    });
  };

  const DraggableVideo = ({ video, index }: { video: Video; index: number }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
      accept: ItemTypes.VIDEO,
      hover(item: { index: number }) {
        if (item.index !== index) {
          moveVideo(item.index, index);
          item.index = index;
        }
      },
    });
    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.VIDEO,
      item: { index },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });
    drag(drop(ref));
    return (
      <div
        ref={ref}
        className={`flex items-center space-x-2 p-2 rounded bg-white border border-gray-200 cursor-move mb-1 ${isDragging ? "opacity-50" : ""}`}
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        <input
          type="checkbox"
          checked={true}
          onChange={() => handleVideoSelection(video._id || "")}
          className="mr-2"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 truncate">{video.title}</p>
        </div>
        <button
          type="button"
          className="text-xs text-red-500 ml-2"
          onClick={() => handleVideoSelection(video._id || "")}
        >
          Remove
        </button>
      </div>
    );
  };

  if (isEditing) {
    return (
     <div
     onClick={()=>setIsEditing(false)}
     className="fixed md:pl-72.5 bg-black/30 inset-0 z-20 w-full h-full flex justify-center items-center">

      
      <div 
      onClick={(e)=>e.stopPropagation() }
      className="bg-white max-h-[90vh] overflow-y-scroll rounded-md shadow-md p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-2">
              Description Points
            </label>
            {formData.description.map((point, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={point}
                  onChange={e => {
                    const newDesc = [...formData.description];
                    newDesc[idx] = e.target.value;
                    setFormData(prev => ({ ...prev, description: newDesc }));
                  }}
                  className="flex-1 px-2 py-1 border rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      description: prev.description.filter((_, i) => i !== idx)
                    }));
                  }}
                  className="text-xs text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                description: [...prev.description, ""]
              }))}
              className="mt-2 px-2 py-1 bg-primary text-white rounded"
            >
              Add Point
            </button>
          </div>

          {/* Thumbnail upload and preview */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-2">
              Thumbnail Image
            </label>
            <div className="flex flex-col gap-2">

              {formData.thumbnailUrl && (
                <Image
                width={80}
                height={60}
                  src={formData.thumbnailUrl}
                  alt="Thumbnail Preview"
                  className=" w-40 h-30 object-cover rounded border border-gray-300 mt-2"
                />
              )}
                            <UploadButton
                            className="bg-primary flex w-fit px-2 rounded-md"
                endpoint="mediaUploader"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    setFormData(prev => ({ ...prev, thumbnailUrl: res[0].url }));
                  }
                }}
                onUploadError={(error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
            </div>
          </div>

          <div className="md:col-span-2 flex items-center">
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

          {/* Video selection UI */}
          <div className="md:col-span-2 mt-4">
            <label className="block text-sm font-medium text-secondary mb-2">
              Select Videos ({formData.videos.length} selected)
            </label>
            {/* Drag-and-drop list for selected videos */}
            {selectedVideoObjects.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto border border-primary/30 rounded-md p-2 bg-primary/5">
                {selectedVideoObjects.map((video, idx) => (
                  <DraggableVideo key={video._id} video={video} index={idx} />
                ))}
              </div>
            )}
            {/* Available videos grid for selection */}
            {isLoadingVideos ? (
              <div className="text-center py-4">Loading videos...</div>
            ) : availableVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                {availableVideos.map((video) => (
                  <div
                    key={video._id}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                      (formData.videos as string[]).includes(video._id || "")
                        ? "bg-primary/10 border border-primary"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => handleVideoSelection(video._id || "")}
                  >
                    <input
                      type="checkbox"
                      onClick={(e)=>e.stopPropagation()}
                      checked={(formData.videos as string[]).includes(video._id || "")}
                      onChange={() => handleVideoSelection(video._id || "")}
                      className="mr-2"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{video.title}</p>
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
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-primary border border-primary rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary text-creamey rounded-md w-full shadow-md p-6 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-48 h-32 flex-shrink-0">
          <Image
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            fill
            className="object-cover rounded-md"
          />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-md">
            {getVideoCount()} videos
          </div>
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-creamey">{playlist.title}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm bg-creamey text-primary rounded-md hover:bg-creamey/90"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          {/* {playlist.description && playlist.description.length > 0 && (
            <ul className="mb-2 list-disc pl-5">
              {playlist.description.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          )} */}

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
            {/* <div>
              <span className="font-medium text-creamey/90">Tags:</span>
              <span className="ml-1 text-creamey/90">{playlist.tags?.length || 0} tags</span>
            </div> */}
            <div>
              <span className="font-medium text-creamey/90">Featured:</span>
              <span className={`ml-1 ${playlist.featured ? "text-green-600" : "text-yellow-600"}`}>
                {playlist.featured ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {playlist.tags && playlist.tags.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium text-creamey/90">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {playlist.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-creamey/90 text-xs rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* {getVideos().length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-creamey/90 mb-2">Videos in this playlist:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {getVideos().slice(0, 6).map((video, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                    <div className="relative w-12 h-8 flex-shrink-0">
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary">{video.title}</p>

                    </div>
                  </div>
                ))}
                {getVideos().length > 6 && (
                  <div className="flex items-center justify-center p-2 bg-gray-50 rounded-md">
                    <span className="text-xs text-gray-500">
                      +{getVideos().length - 6} more videos
                    </span>
                  </div>
                )}
              </div>
            </div>
          )} */}

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
"use client";
import AddVideoModal from "@/components/AddVideoModal";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import VideoComponent from "@/components/VideoComponent";
import { Video, PLAYLIST_CATEGORIES, Playlist } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";

const VideosPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [addModalisOpen, setAddModalisOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState("");

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch dynamic pages of 12 videos with category and playlist filter
      const res = await axios.get(
        `/api/videos?page=${page}&limit=12&search=${searchQuery}&category=${selectedCategory}&playlist=${selectedPlaylist}&includeDetails=true`,
      );
      console.log("Videos data:", res.data);
      if (page === 1) {
        setVideos(res.data.data);
      } else {
        setVideos((prev) => [...prev, ...res.data.data]);
      }
      setHasMore(res.data.currentPage < res.data.totalPages);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, selectedCategory, selectedPlaylist]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Fetch all playlists once on mount
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await axios.get("/api/playlists");
        setPlaylists(res.data.data);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      }
    };
    fetchPlaylists();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-between gap-4 overflow-hidden bg-backgroundColor px-2 py-2 md:px-4  md:py-4">
        <div className="flex h-full w-full flex-col items-center space-y-4">
          <div className="flex w-full flex-col-reverse items-center justify-between gap-4 md:flex-row">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="w-full sm:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedPlaylist(""); // Reset playlist selection when category changes
                    setPage(1);
                  }}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {PLAYLIST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-64">
                <select
                  value={selectedPlaylist}
                  onChange={(e) => {
                    setSelectedPlaylist(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="">All Playlists</option>
                  {(selectedCategory
                    ? playlists.filter((p) => p.category === selectedCategory)
                    : playlists
                  ).map((pl) => (
                    <option key={pl._id} value={pl._id}>
                      {pl.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex w-full flex-col gap-2 text-primary underline md:w-auto md:flex-row md:items-center md:justify-end md:gap-4">
              <button
                className="rounded-2xl bg-primary px-4 py-2 text-sm text-creamey hover:cursor-pointer transition duration-200 hover:bg-primary/95"
                onClick={() => setAddModalisOpen(true)}
              >
                ADD NEW VIDEO
              </button>
            </div>
          </div>

          {isLoading && page === 1 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Loading videos...</div>
            </div>
          ) : videos.length > 0 ? (
            <div className="flex flex-col w-full items-center gap-6">
              <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {videos.map((video) => (
                  <VideoComponent
                    key={video._id}
                    setVideos={setVideos}
                    video={video}
                    viewMode="grid"
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-4 flex justify-center w-full">
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={isLoading}
                    className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-creamey hover:cursor-pointer transition duration-200 hover:bg-primary/95 shadow-md disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : "LOAD MORE"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <h1 className="text-lg text-gray-500">No videos found</h1>
            </div>
          )}
        </div>

        <AddVideoModal
          isModalOpen={addModalisOpen}
          setModalOpen={setAddModalisOpen}
          setVideos={setVideos}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
        />


      </div>
    </DefaultLayout>
  );
};

export default VideosPage;

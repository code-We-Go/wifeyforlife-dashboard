"use client";
import AddPlaylistModal from "@/components/AddPlaylistModal";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import PlaylistComponent from "@/components/PlaylistComponent";
import { Playlist } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";

const PlaylistsPage = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addModalisOpen, setAddModalisOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPlaylists = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `/api/playlists?page=${page}&search=${searchQuery}`,
      );
      console.log("Playlists data:", res.data);
      setPlaylists(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    // Only reset to first page when search query changes
    if (searchQuery) {
      setPage(1);
    }
    fetchPlaylists();
  }, [fetchPlaylists, searchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto px-2 md:px-4 min-h-screen w-full flex-col items-center justify-between gap-4 overflow-hidden bg-backgroundColor  md:py-4">
        <div className="flex h-full w-full flex-col items-center space-y-4">
          <div className="flex w-full flex-col-reverse items-center justify-between gap-4 md:flex-row">
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Search playlists..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex w-full justify-end text-primary underline md:w-auto">
              <button
                className="hover:cursor-pointer rounded-2xl px-4 bg-primary text-creamey py-2 text-sm"
                onClick={() => setAddModalisOpen(true)}
              >
                ADD NEW PLAYLIST
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Loading playlists...</div>
            </div>
          ) : playlists.length > 0 ? (
            playlists.map((playlist) => (
              <PlaylistComponent
                key={playlist._id}
                setPlaylists={setPlaylists}
                playlist={playlist}
              />
            ))
          ) : (
            <div className="flex items-center justify-center py-8">
              <h1 className="text-lg text-gray-500">No playlists found</h1>
            </div>
          )}
        </div>
        
        <AddPlaylistModal
          isModalOpen={addModalisOpen}
          setModalOpen={setAddModalisOpen}
          setPlaylists={setPlaylists}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center gap-4">
            <button
              className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isLoading}
            >
              Previous
            </button>

            <span className="text-lg">
              Page {page} of {totalPages}
            </span>

            <button
              className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || isLoading}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default PlaylistsPage;
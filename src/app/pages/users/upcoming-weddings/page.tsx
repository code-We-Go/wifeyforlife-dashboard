"use client";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { IUser } from "@/app/models/userModel";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const UpcomingWeddingsPage = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [limit] = useState(10); // Default limit per page

  // Fetch users when page changes
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const apiUrl = `/api/users/upcoming-weddings?page=${page}&limit=${limit}`;
        const res = await axios.get(apiUrl);
        
        setUsers(res.data.data.users);
        setTotalPages(res.data.data.pagination.totalPages);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, limit]);

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        <div className="flex w-[97%] items-center justify-between text-primary">
          <h1 className="text-2xl font-bold">Upcoming Weddings</h1>
          <Link
            href="/pages/users"
            className="rounded-2xl bg-secondary px-4 py-2 text-sm text-creamey hover:cursor-pointer"
          >
            Back to Users
          </Link>
        </div>

        {/* Table */}
        <div className="w-[97%] overflow-x-auto">
          <table className="w-full rounded border border-gray-300 text-left">
            <thead className="bg-secondary text-sm text-white">
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2">Wedding Date</th>
                <th className="border p-2">Username</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Role</th>
                <th className="border p-2">Subscription</th>
                <th className="border p-2">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="border p-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span className="text-gray-600">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user._id} className="text-sm hover:bg-gray-50">
                    <td className="border p-2">{(page - 1) * limit + index + 1}</td>
                    <td className="border p-2 font-bold text-accent">
                      {user.weddingDate
                        ? new Date(user.weddingDate).toLocaleDateString("en-EG", {
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric'
                          })
                        : "N/A"}
                    </td>
                    <td className="border p-2">
                      <Link
                        href={`/pages/users/${user._id}`}
                        className=" hover:underline"
                      >
                        <div className="flex items-center gap-2">
                          {user.imageURL && user.imageURL.trim() !== "" ? (
                            <img
                              src={user.imageURL}
                              alt={user.username}
                              className="h-8 w-8 rounded-full border object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-gray-300 text-base font-bold text-gray-700">
                              {user.username
                                ? user.username
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                : "?"}
                            </div>
                          )}
                          <span>{user.username}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="border p-2">{user.email}</td>
                    <td className="border p-2 capitalize">{user.role}</td>
                    <td className="border p-2">
                       <span className="font-bold">
                        {(() => {
                           if (!user.subscription?.subscribed) return <span className="text-red-500">Not Subscribed</span>;
                           const pkg = user.subscription.packageID as any;
                           if (pkg?.name?.toLowerCase().includes("mini")) return <span className="text-orange-500">Mini Experience</span>;
                           return <span className="text-success">Full Experience</span>;
                        })()}
                      </span>
                    </td>
                    <td className="border p-2">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="border p-8 text-center">
                    <div className="text-gray-600">
                      No users found with upcoming weddings.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && totalPages > 1 && (
          <div className="mt-4 flex items-center gap-4">
            <button
              className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-lg">
              Page {page} of {totalPages}
            </span>
            <button
              className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default UpcomingWeddingsPage;

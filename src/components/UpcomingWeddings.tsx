"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { thirdFont } from "@/app/lib/fonts";
import { IUser } from "@/app/models/userModel";
import { IoMenuSharp } from "react-icons/io5";

const UpcomingWeddings = () => {
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`/api/users/upcoming-weddings?limit=5`);
        setUsers(res.data.data.users);
      } catch (error) {
        console.error("Error fetching upcoming weddings:", error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="h-auto col-span-12 bg-white flex flex-col gap-3 rounded-2xl md:gap-6 justify-start items-center border border-primary w-full py-4 my-8">
      <h2 className={`${thirdFont.className} text-2xl tracking-normal font-semibold text-primary`}>
        Upcoming Weddings
      </h2>
      <div className="flex flex-col h-auto w-full gap-4 items-center">
        {users.length > 0 ? (
          users.map((user, index) => (
            <UserWeddingComponent key={user._id || index} user={user} />
          ))
        ) : (
          <h1>No Upcoming Weddings</h1>
        )}
      </div>
      <Link className="mb-6" href={"/pages/users/upcoming-weddings"}>
        <h2 className="text-primary underline">VIEW ALL</h2>
      </Link>
    </div>
  );
};

const UserWeddingComponent = ({ user }: { user: IUser }) => {
  const [optionsModalIsOpen, setOptionsModal] = useState(false);
  const [isDetailsModalOpen, setDetailsModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setOptionsModal(false);
      }
    }

    if (optionsModalIsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsModalIsOpen]);

  // Handle body scroll locking
  useEffect(() => {
    if (isDetailsModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDetailsModalOpen]);

  return (
    <div className="relative min-h-6 w-[97%] rounded-2xl border border-secondary  bg-pink-200 px-4 py-8 text-sm text-primary">
      <div className="flex w-full justify-between border-b border-white pb-1 text-sm">
        <div className="flex gap-2">
          <h1>Username :</h1>
          <p>{user.username}</p>
        </div>

        {/* Clickable Icon to Open Modal */}
        <div className="relative">
          <IoMenuSharp
            onClick={() => setOptionsModal(true)}
            className="cursor-pointer text-xl"
          />

          {/* Options Modal */}
          {optionsModalIsOpen && (
            <div
              ref={modalRef}
              className="absolute right-0 top-0 z-30 flex h-auto w-auto flex-col gap-2 bg-backgroundColor p-2 px-2 py-2 text-primary shadow-xl rounded"
            >
              <p
                onClick={() => {
                  setDetailsModal(true);
                  setOptionsModal(false);
                }}
                className="flex items-center justify-center border-b border-primary px-4 pt-3 hover:cursor-pointer whitespace-nowrap"
              >
                DETAILS
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Details Preview */}
      <div className="flex w-full flex-nowrap items-center justify-between pt-1">
        <div className="flex flex-nowrap items-center justify-center gap-2">
           <p className="font-semibold">Date:</p>
          <p>
            {user.weddingDate
              ? new Date(user.weddingDate).toLocaleDateString("en-EG")
              : "N/A"}
          </p>
        </div>
          <div className="flex items-center justify-center gap-2">
          <p className="font-semibold">Email:</p>
          <p>{user.email}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
            <p className="font-semibold">Subscribed:</p>
          <p className="font-bold">
             {(() => {
                if (!user.subscription?.subscribed) return <span className="text-red-500">Not Subscribed</span>;
                const pkg = user.subscription.packageID as any;
                if (pkg?.name?.toLowerCase().includes("mini")) return <span className="text-orange-500">Mini Experience</span>;
                return <span className="text-success">Full Experience</span>;
             })()}
          </p>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && (
        <div
          onClick={() => setDetailsModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 text-primary lg:ml-[290px] lg:w-[calc(100vw-290px)]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-auto max-h-[90%] w-[90%] max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 text-secondary shadow-lg relative"
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setDetailsModal(false)}
            >
              ✕
            </button>
            <h2 className="mb-4 text-xl font-bold bg-secondary text-white p-2 rounded text-center">
              USER DETAILS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="p-3 border rounded bg-gray-50">
                <p className="font-semibold text-gray-600">Username</p>
                <p className="text-lg">{user.username}</p>
              </div>
              <div className="p-3 border rounded bg-gray-50">
                <p className="font-semibold text-gray-600">Full Name</p>
                <p className="text-lg">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div className="p-3 border rounded bg-gray-50">
                <p className="font-semibold text-gray-600">Email</p>
                <p className="text-lg break-all">{user.email}</p>
              </div>
              <div className="p-3 border rounded bg-gray-50">
                 <p className="font-semibold text-gray-600">Wedding Date</p>
                 <p className="text-lg font-bold text-accent">
                  {user.weddingDate
                    ? new Date(user.weddingDate).toLocaleDateString("en-EG", {
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })
                    : "Not set"}
                </p>
              </div>
              <div className="p-3 border rounded bg-gray-50">
                <p className="font-semibold text-gray-600">Role</p>
                <p className="text-lg capitalize">{user.role}</p>
              </div>
              <div className="p-3 border rounded bg-gray-50">
                <p className="font-semibold text-gray-600">Created At</p>
                <p className="text-lg">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 border rounded bg-gray-50">
                <p className="font-semibold text-gray-600">Subscription Status</p>
                <p className="text-lg font-bold">
                   {(() => {
                      if (!user.subscription?.subscribed) return <span className="text-red-500">Not Subscribed</span>;
                      const pkg = user.subscription.packageID as any;
                      if (pkg?.name?.toLowerCase().includes("mini")) return <span className="text-orange-500">Mini Experience</span>;
                      return <span className="text-success">Full Experience</span>;
                   })()}
                </p>
              </div>
              {/* Add more fields here as needed */}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="px-6 py-2 bg-secondary text-white rounded hover:bg-opacity-90"
                onClick={() => setDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingWeddings;

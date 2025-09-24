"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ILogin } from "@/app/models/loginsModel";

export default function LoginsPage() {
  const [logins, setLogins] = useState<ILogin[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month"); // 'month', 'week', 'today', 'all'
  const [suspicious, setSuspicious] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchLogins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("period", period);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      if (suspicious) {
        params.append("suspicious", "true");
      }

      if (searchEmail) {
        params.append("email", searchEmail);
      }

      const response = await axios.get(`/api/logins?${params.toString()}`);
      setLogins(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching logins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogins();
  }, [period, suspicious, pagination.page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogins();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM dd, yyyy HH:mm:ss");
  };

  const getDeviceInfo = (login: ILogin) => {
    const parts = [];
    if (login.deviceType) parts.push(login.deviceType);
    if (login.deviceBrand) parts.push(login.deviceBrand);
    if (login.deviceModel) parts.push(login.deviceModel);
    return parts.join(" ");
  };

  const getBrowserInfo = (login: ILogin) => {
    const parts = [];
    if (login.browserName) parts.push(login.browserName);
    if (login.browserVersion) parts.push(login.browserVersion);
    return parts.join(" ");
  };

  return (
    <DefaultLayout>
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6 flex flex-wrap gap-3 sm:gap-5">
          {/* Period Filter */}
          <div className="flex items-center">
            <label className="mr-2 text-black dark:text-white">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-1.5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="month">Last Month</option>
              <option value="10days">Last 10 Days</option>
              <option value="week">Last Week</option>
              <option value="today">Today</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Suspicious Filter */}
          <div className="flex items-center">
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={suspicious}
                onChange={() => setSuspicious(!suspicious)}
                className="mr-2 h-5 w-5 cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
              <span className="text-black dark:text-white">
                Suspicious Logins
              </span>
            </label>
          </div>

          {/* Email Search */}
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="text"
              placeholder="Search by email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-1.5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
            <button
              type="submit"
              className="ml-2 rounded-lg bg-primary px-4 py-1.5 text-white transition hover:bg-opacity-90"
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-300 text-left dark:bg-meta-4">
                    <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                      Email
                    </th>
                    <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                      Time
                    </th>
                    <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                      Status
                    </th>
                    {/* <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                      IP Address
                    </th> */}
                    <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                      Device
                    </th>
                    <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                      Browser
                    </th>
                    <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
                      OS
                    </th>
                    <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
                      Fingerprint
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logins.length > 0 ? (
                    logins.map((login, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0 ? "bg-white " : "bg-gray-100 "
                        }
                      >
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {login.email}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {formatDate(login.timestamp)}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${login.success ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"}`}
                          >
                            {login.success ? "Success" : "Failed"}
                          </span>
                        </td>
                        {/* <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {login.ipAddress || "-"}
                          </p>
                        </td> */}
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {getDeviceInfo(login) || "-"}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {getBrowserInfo(login) || "-"}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {login.osName
                              ? `${login.osName} ${login.osVersion || ""}`
                              : "-"}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {login.fingerprint ? login.fingerprint : "-"}
                          </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="border-b border-[#eee] px-4 py-5 text-center dark:border-strokedark"
                      >
                        <p className="text-black dark:text-white">
                          No login records found
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-black dark:text-white">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border border-stroke ${pagination.page === 1 ? "cursor-not-allowed opacity-50" : "hover:border-primary hover:bg-primary hover:text-white"} dark:border-strokedark`}
                  >
                    <svg
                      className="fill-current"
                      width="8"
                      height="14"
                      viewBox="0 0 8 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 1L1 7L7 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {Array.from(
                    { length: Math.min(5, pagination.pages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className={`flex h-9 w-9 items-center justify-center rounded-md border ${pagination.page === pageNum ? "border-primary bg-primary text-white" : "border-stroke hover:border-primary hover:bg-primary hover:text-white dark:border-strokedark"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border border-stroke ${pagination.page === pagination.pages ? "cursor-not-allowed opacity-50" : "hover:border-primary hover:bg-primary hover:text-white"} dark:border-strokedark`}
                  >
                    <svg
                      className="fill-current"
                      width="8"
                      height="14"
                      viewBox="0 0 8 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 1L7 7L1 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DefaultLayout>
  );
}

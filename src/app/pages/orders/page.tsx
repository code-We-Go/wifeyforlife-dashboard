"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import OrderComponent from "@/components/OrderComponent";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { IOrder } from "@/interfaces/interfaces";

const OrdersPage = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.append("search", search);
      if (discountCode) params.append("discountCode", discountCode);
      if (orderDate) params.append("orderDate", orderDate);
      const res = await axios.get(`/api/orders?${params.toString()}`);
      setOrders(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, discountCode, orderDate]);

  useEffect(() => {
    fetchOrders();
  }, [page, search, discountCode, orderDate]);

  useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [search, discountCode, orderDate]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-center gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        <div className="mb-4 flex w-full flex-col items-center justify-between gap-4 md:flex-row">
          <input
            type="text"
            placeholder="Search by order ID or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent md:w-64"
          />
          <input
            type="text"
            placeholder="Search by discount code..."
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent md:w-64"
          />
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        {isLoading ? (
          <div>Loading...</div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <OrderComponent
              setOrders={setOrders}
              key={order._id}
              order={order}
            />
          ))
        ) : (
          <h1>No Orders</h1>
        )}

        {/* Pagination Controls */}
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
      </div>
    </DefaultLayout>
  );
};

export default OrdersPage;

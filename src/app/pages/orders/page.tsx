"use client";
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import OrderComponent from '@/components/OrderComponent';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { IOrder } from '@/interfaces/interfaces';

const OrdersPage = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`/api/orders?page=${page}`);
        setOrders(res.data.data);
        setTotalPages(res.data.totalPages);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    fetchOrders();
  }, [page,setOrders]); // Re-fetch when page changes

  return (
    <DefaultLayout>
      <div className="px-1 overflow-hidden md:px-2 py-2 md:py-4 w-full h-auto min-h-screen flex flex-col justify-center items-center gap-4 bg-backgroundColor">
        {orders.length > 0 ? (
          orders.map((order, index) => <OrderComponent setOrders={setOrders} key={index} order={order} />)
        ) : (
          <h1>No Orders</h1>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center gap-4 mt-4">
          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>

          <span className="text-lg">Page {page} of {totalPages}</span>

          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OrdersPage;

"use client";
import { IOrder } from "@/interfaces/interfaces";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { CgDetailsMore } from "react-icons/cg";
import Swal from "sweetalert2";
import { IoMenuSharp } from "react-icons/io5";
import CartItemSmall from "./CartItemSmall";

const OrderComponent = ({
  order,
  setOrders,
}: {
  order: IOrder;
  setOrders: React.Dispatch<React.SetStateAction<IOrder[]>>;
}) => {
  const [status, setStatus] = useState(order.status);
  const [payment, setPayment] = useState(order.payment);
  const updateOrder = async (field: keyof IOrder, value: string) => {
    if (!order) return;

    try {
      // Update local state optimistically
      const updateOdrder: IOrder = { ...order, [field]: value };

      // Send update request to backend
      const updatedOrder = await axios.put(`/api/orders?orderID=${order._id}`, {
        [field]: value,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o._id === updatedOrder.data._id ? updatedOrder.data! : o,
        ),
      );

      Swal.fire({
        background: "#FFFFF",
        color: "black",
        toast: false,
        iconColor: "#473728",
        position: "bottom-right",
        text: "ORDER HAS BEEN UPDATED",
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: "no-rounded-corners small-popup",
        },
      });
    } catch (error) {
      console.error("Error updating order:", error);
      Swal.fire({
        background: "#FFFFF",
        color: "black",
        toast: false,
        iconColor: "#473728",
        position: "bottom-right",
        text: "UPDATE FAILED",
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: "no-rounded-corners small-popup",
        },
      });
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [optionsModalIsOpen, setOptionsModal] = useState(false);
  const [isDetailsModalOpen, setDetailsModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Add effect to handle body scroll when modals are open
  useEffect(() => {
    if (isModalOpen || isDetailsModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isDetailsModalOpen]);

  const deleteOrder = async () => {
    setIsModalOpen(false);
    try {
      const res = await axios.delete(`/api/orders`, {
        data: { orderID: order._id },
      });
      if (res.status === 200) {
        setOrders((prev) => prev.filter((o) => o._id !== order._id));
        // fetchOrders();
        Swal.fire({
          background: "#FFFFF",
          color: "black",
          toast: false,
          iconColor: "#473728",
          position: "bottom-right",
          text: "ORDER HAS BEEN DELETED",
          showConfirmButton: false,
          timer: 2000,
          customClass: {
            popup: "no-rounded-corners small-popup",
          },
        });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

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

  return (
    <div className="relative min-h-6 w-[97%] rounded-2xl border border-secondary bg-backgroundColor/25 bg-secondary px-4 py-8 text-sm text-creamey">
      <div className="flex w-full justify-between border-b border-white pb-1 text-sm">
        <div className="flex gap-2">
          <h1>ORDER ID :</h1>
          <p>{order._id}</p>
        </div>

        {/* Clickable Icon to Open Modal */}
        <div className="relative">
          <IoMenuSharp
            onClick={() => setOptionsModal(true)}
            className="cursor-pointer"
          />

          {/* Options Modal */}
          {optionsModalIsOpen && (
            <div
              ref={modalRef}
              className="absolute right-0 top-0 z-30 flex h-auto w-auto flex-col gap-2 bg-backgroundColor p-2 px-2 py-2 text-primary shadow-xl"
            >
              <p
                onClick={() => {
                  setDetailsModal(true);
                  setOptionsModal(false);
                }}
                className="flex items-center justify-center border-b border-primary px-4 pt-3 hover:cursor-pointer"
              >
                DETAILS
              </p>
              <p
                onClick={() => {
                  setIsModalOpen(true);
                  setOptionsModal(false);
                }}
                className="flex items-center justify-center border-b border-primary px-4 pt-3 hover:cursor-pointer"
              >
                DELETE
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Other Order Details */}
      <div className="flex w-full  flex-nowrap items-center justify-between pt-1">
        <div className="flex flex-nowrap items-center justify-center gap-2">
          <p>
            {new Date(order.createdAt!).toLocaleString("en-EG", {
              timeZone: "Africa/Cairo",
            })}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <p>
            {order.firstName} {order.lastName}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <p>{order.total} LE</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <p>{order.state}</p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black  bg-opacity-50 text-primary"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-4/5 rounded-2xl bg-white p-6 text-center shadow-lg md:w-1/3"
          >
            <h2 className="mb-4 text-lg font-bold">CONFIRM DELETION</h2>
            <p className="mb-6">
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className="flex justify-around">
              <button
                className="rounded-2xl border-[1px] border-primary px-4 py-2 text-primary  "
                onClick={deleteOrder}
              >
                Yes, Delete
              </button>
              <button
                className="rounded-2xl bg-accent px-4 py-2 text-white "
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && (
        <div
          onClick={() => setDetailsModal(false)}
          className="fixed   inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 text-primary lg:ml-[290px] lg:w-[calc(100vw-290px)]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-[95%] w-[90%] max-w-3xl overflow-y-scroll rounded-2xl bg-creamey p-6 text-center text-secondary shadow-lg"
          >
            <div className="mb-2 flex w-full items-center justify-end">
              <span
                className="hover:cursor-pointer"
                onClick={() => setDetailsModal(false)}
              >
                x
              </span>
            </div>
            <h2 className="mb-4 text-lg font-bold">ORDER DETAILS</h2>

            {/* Order Info */}
            <div className="space-y-2  text-left">
              <p>
                <strong>Order ID:</strong> {order._id || "N/A"}
              </p>

              <p>
                <strong>Email:</strong> {order.email}
              </p>
              <p>
                <strong>Customer:</strong> {order.firstName} {order.lastName}
              </p>
              <p>
                <strong>Cart:</strong>
              </p>

              <div className="flex flex-col gap-2">
                {order.cart?.map((item, index) => (
                  <CartItemSmall key={index} item={item} wishListBool={false} />
                ))}
              </div>
              <p>
                <strong>Phone:</strong> {order.phone || "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {order.address}, {order.city},{" "}
                {order.state}, {order.country}
              </p>
              <p>
                <strong>Postal Code:</strong> {order.postalZip || "N/A"}
              </p>

              {/* Order Info */}

              {/* Status Dropdown */}
              <label className="mt-4 block font-semibold">Status:</label>
              <select
                className="w-full border bg-creamey p-2"
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as
                    | "pending"
                    | "confirmed"
                    | "shipped"
                    | "delivered"
                    | "cancelled";
                  setStatus(newStatus);
                  updateOrder("status", newStatus);
                }}
              >
                {[
                  "pending",
                  "confirmed",
                  "shipped",
                  "delivered",
                  "cancelled",
                ].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <label className="mt-4 block font-semibold">Payment Method: {order.cash=== "cash" ? "Cash on delivery" : "card"} </label>
              {/* Payment Dropdown */}
              <label className="mt-4 block font-semibold">Payment:</label>
              <select
                className="w-full border bg-creamey p-2"
                value={payment}
                onChange={(e) => {
                  const newPayment = e.target.value as
                    | "pending"
                    | "failed"
                    | "confirmed";
                  setPayment(newPayment);
                  updateOrder("payment", e.target.value);
                }}
              >
                {["pending", "failed", "confirmed"].map((payment) => (
                  <option key={payment} value={payment}>
                    {payment}
                  </option>
                ))}
              </select>
              <p>
                <strong>Sub-Total:</strong> {order.subTotal?.toFixed(2)} LE
              </p>
              <p>
                <strong>Shipping:</strong> {order.shipping?.toFixed(2)} LE
              </p>
              {order.appliedDiscount && (
                <p>
                  <strong>Discount ({order.appliedDiscount.code}):</strong> -
                  {order.appliedDiscountAmount?.toFixed(2)} LE
                </p>
              )}
              <p>
                <strong>Total:</strong> {order.total?.toFixed(2)} LE
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(order.createdAt!).toLocaleString("en-EG", {
                  timeZone: "Africa/Cairo",
                })}
              </p>
            </div>

            {/* Buttons */}
            {/* <div className="flex justify-around mt-6">
        <button
          className="px-4 py-2 text-primary border-[1px] border-primary"
          onClick={deleteOrder}
        >
          Yes, Delete
        </button>
        <button
          className="px-4 py-2 text-white bg-primary"
          onClick={() => setDetailsModal(false)}
        >
          Close
        </button>
      </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderComponent;

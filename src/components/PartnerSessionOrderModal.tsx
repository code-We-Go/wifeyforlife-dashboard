"use client";

import React from "react";

type OrderStatus = "pending" | "paid" | "cancelled";

interface PartnerSession {
  _id: string;
  title: string;
  partnerName: string;
  partnerEmail: string;
  whatsappNumber: string;
  price: number;
  subscriptionDiscountPercentage?: number;
  profitPercentage: number;
}

interface PartnerSessionOrder {
  _id?: string;
  sessionId: string;
  sessionTitle: string;
  partnerName: string;
  partnerEmail: string;
  whatsappNumber: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  appliedDiscountCode?: string;
  basePrice: number;
  finalPrice: number;
  subscriptionDiscountAmount?: number;
  profitPercentage: number;
  ourProfitAmount: number;
  paymentID?: string;
  status: OrderStatus;
  createdAt?: string;
}

interface PartnerSessionOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: PartnerSessionOrder;
  setForm: React.Dispatch<React.SetStateAction<PartnerSessionOrder>>;
  sessions: PartnerSession[];
  editing: PartnerSessionOrder | null;
  onSelectSession: (sessionId: string) => void;
  recomputeProfit: (finalPrice: number, profitPercentage: number) => number;
  handleCreate: () => Promise<void>;
  handleUpdate: () => Promise<void>;
}

const PartnerSessionOrderModal: React.FC<PartnerSessionOrderModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  sessions,
  editing,
  onSelectSession,
  recomputeProfit,
  handleCreate,
  handleUpdate,
}) => {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:pl-72.5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-lg"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {editing ? "Edit Order" : "Add New Order"}
            </h2>
            <button
              onClick={onClose}
              className="text-2xl text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Session
                </label>
                <select
                  className="w-full rounded border p-2"
                  value={form.sessionId}
                  onChange={(e) => onSelectSession(e.target.value)}
                >
                  <option value="">Select a session</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title} — {s.partnerName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client First Name
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.clientFirstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientFirstName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client Last Name
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.clientLastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientLastName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client Email
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.clientEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientEmail: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client Phone
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.clientPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientPhone: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Applied Discount Code
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.appliedDiscountCode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      appliedDiscountCode: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Base Price
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      basePrice: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Final Price
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.finalPrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      finalPrice: parseFloat(e.target.value) || 0,
                      ourProfitAmount: recomputeProfit(
                        parseFloat(e.target.value) || 0,
                        f.profitPercentage,
                      ),
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Subscription Discount Amount
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.subscriptionDiscountAmount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      subscriptionDiscountAmount:
                        parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Profit %
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.profitPercentage}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      profitPercentage: parseFloat(e.target.value) || 0,
                      ourProfitAmount: recomputeProfit(
                        f.finalPrice,
                        parseFloat(e.target.value) || 0,
                      ),
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Our Profit Amount
                </label>
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  value={form.ourProfitAmount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ourProfitAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment ID
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.paymentID}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentID: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Date</label>
                <input
                  type="date"
                  className="w-full rounded border p-2"
                  value={form.createdAt || new Date().toISOString().split('T')[0]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, createdAt: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  className="w-full rounded border p-2"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as OrderStatus,
                    }))
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded bg-gray-200 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-primary px-4 py-2 text-white"
              >
                {editing ? "Save Changes" : "Create Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartnerSessionOrderModal;

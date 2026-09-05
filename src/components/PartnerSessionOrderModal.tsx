"use client";

import React from "react";
import { CldUploadWidget, CldImage } from "next-cloudinary";

type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "instapay_review";
type PaymentMethod = "card" | "instapay";

interface PartnerSessionVariant {
  title: string;
  description: string;
  price: number;
  duration: number;
}

interface PartnerSession {
  _id: string;
  title: string;
  partnerName: string;
  partnerEmail: string;
  whatsappNumber: string;
  price: number;
  subscriptionDiscountPercentage?: number;
  profitPercentage: number;
  variants?: PartnerSessionVariant[];
}

export interface PartnerSessionOrder {
  _id?: string;
  sessionId: string;
  sessionTitle: string;
  variantTitle?: string;
  variantDuration?: number;
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
  paymentMethod?: PaymentMethod;
  instapayReceipt?: string;
  link?: string;
  meetingLink?: string;
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
  onSelectVariant: (variantTitle: string) => void;
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
  onSelectVariant,
  recomputeProfit,
  handleCreate,
  handleUpdate,
}) => {
  if (!isOpen) return null;

  const selectedSession = sessions.find((s) => s._id === form.sessionId);

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
              <div className={selectedSession?.variants && selectedSession.variants.length > 0 ? "md:col-span-1" : "md:col-span-2"}>
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
                      {s.title} — {s.partnerName} {s.variants && s.variants.length > 0 ? `(${s.variants.length} variants)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSession?.variants && selectedSession.variants.length > 0 && (
                <div className="md:col-span-1">
                  <label className="mb-1 block text-sm font-medium">
                    Session Variant
                  </label>
                  <select
                    className="w-full rounded border p-2"
                    value={form.variantTitle || ""}
                    onChange={(e) => onSelectVariant(e.target.value)}
                  >
                    <option value="">Select a variant</option>
                    {selectedSession.variants.map((v, idx) => (
                      <option key={idx} value={v.title}>
                        {v.title} ({v.duration} min) — {v.price} EGP
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                  required
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
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client Email
                </label>
                <input
                  type="email"
                  className="w-full rounded border p-2"
                  value={form.clientEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientEmail: e.target.value }))
                  }
                  required
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
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Applied Discount Code
                </label>
                <input
                  className="w-full rounded border p-2"
                  value={form.appliedDiscountCode || ""}
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
                  Base Price (EGP)
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
                  Final Price (EGP)
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
                  value={form.subscriptionDiscountAmount || 0}
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
                  Payment Method
                </label>
                <select
                  className="w-full rounded border p-2"
                  value={form.paymentMethod || "card"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      paymentMethod: e.target.value as PaymentMethod,
                    }))
                  }
                >
                  <option value="card">Card</option>
                  <option value="instapay">Instapay</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment ID
                </label>
                <input
                  className="w-full rounded border p-2"
                  placeholder="Order / Payment ID from gateway"
                  value={form.paymentID || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentID: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Meeting Link (Zoom / Google Meet)
                </label>
                <input
                  type="url"
                  className="w-full rounded border p-2"
                  placeholder="https://meet.google.com/... or zoom link"
                  value={form.meetingLink || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, meetingLink: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Session / External Link
                </label>
                <input
                  type="url"
                  className="w-full rounded border p-2"
                  placeholder="https://..."
                  value={form.link || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link: e.target.value }))
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
                  <option value="instapay_review">Instapay Review</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Instapay Receipt Section */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Instapay Receipt
                </label>
                <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4">
                  {form.instapayReceipt ? (
                    <div className="relative h-48 w-full max-w-sm overflow-hidden rounded-lg border bg-gray-50">
                      {form.instapayReceipt.startsWith("http") ? (
                        <CldImage
                          width="400"
                          height="300"
                          src={form.instapayReceipt}
                          alt="Instapay Receipt"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-500 break-all p-2">
                          {form.instapayReceipt}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, instapayReceipt: "" })}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 shadow"
                        title="Remove Receipt"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
                      No receipt uploaded
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={(result: any) => {
                        setForm({ ...form, instapayReceipt: result.info.secure_url });
                      }}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="rounded bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-opacity-90"
                        >
                          {form.instapayReceipt ? "Change Uploaded Receipt" : "Upload Receipt"}
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                  <input
                    type="url"
                    className="w-full rounded border p-2 text-sm"
                    placeholder="Or enter receipt image URL directly..."
                    value={form.instapayReceipt || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, instapayReceipt: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-primary px-4 py-2 text-white hover:bg-opacity-90"
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


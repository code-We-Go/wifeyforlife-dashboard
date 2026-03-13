"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { CldImage, CldUploadWidget } from "next-cloudinary";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoterUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

interface Review {
  _id: string;
  userId?: string;
  userName: string;
  resolvedUser?: VoterUser | null;
  rating: number;
  comment?: string;
  images?: string[];
  helpful: VoterUser[] | number;
  notHelpful: VoterUser[] | number;
  createdAt: string;
}

interface BrandReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  brandName: string;
  onReviewsChanged?: () => void; // called after mutations so parent can refresh brand stats
}

// ─── Star helpers ─────────────────────────────────────────────────────────────

const StarInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={(hover || value) >= s ? "text-amber-400" : "text-gray-300"}>
            ★
          </span>
        </button>
      ))}
      <span className="ml-2 text-sm font-semibold text-gray-600">
        {value > 0 ? `${value} / 5` : "Select rating"}
      </span>
    </div>
  );
};

const StarDisplay = ({ value }: { value: number }) => (
  <span className="text-sm leading-none tracking-wider">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= Math.round(value) ? "text-amber-400" : "text-gray-300"}>
        ★
      </span>
    ))}
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────

const BrandReviewsModal = ({
  isOpen,
  onClose,
  brandId,
  brandName,
  onReviewsChanged,
}: BrandReviewsModalProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add form
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  // Voter popover: { reviewId, type }
  const [voterPopover, setVoterPopover] = useState<{ reviewId: string; type: "helpful" | "notHelpful" } | null>(null);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ images: string[], currentIndex: number } | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && lightbox && lightbox.currentIndex < lightbox.images.length - 1) {
      setLightbox({ ...lightbox, currentIndex: lightbox.currentIndex + 1 });
    }
    if (isRightSwipe && lightbox && lightbox.currentIndex > 0) {
      setLightbox({ ...lightbox, currentIndex: lightbox.currentIndex - 1 });
    }
  };

  const handleNextLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightbox && lightbox.currentIndex < lightbox.images.length - 1) {
      setLightbox({...lightbox, currentIndex: lightbox.currentIndex + 1});
    }
  };

  const handlePrevLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightbox && lightbox.currentIndex > 0) {
      setLightbox({...lightbox, currentIndex: lightbox.currentIndex - 1});
    }
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchReviews = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`/api/shopping-bestie/reviews?brandId=${brandId}`);
      setReviews(res.data.data.reviews ?? []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    if (isOpen) {
      fetchReviews();
      setAddMode(false);
      setEditId(null);
      setVoterPopover(null);
      setError("");
    }
  }, [isOpen, fetchReviews]);

  // ── Add ────────────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setError("Reviewer name is required"); return; }
    if (newRating === 0) { setError("Please select a rating"); return; }
    setAddLoading(true);
    setError("");
    try {
      await axios.post("/api/shopping-bestie/reviews", {
        brandId,
        userName: newName,
        rating: newRating,
        comment: newComment,
        images: newImages,
      });
      setNewName("");
      setNewRating(0);
      setNewComment("");
      setNewImages([]);
      setAddMode(false);
      await fetchReviews();
      onReviewsChanged?.();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add review");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const startEdit = (r: Review) => {
    setEditId(r._id);
    setEditName(r.userName);
    setEditRating(r.rating);
    setEditComment(r.comment || "");
    setEditImages(r.images || []);
    setAddMode(false);
    setError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) { setError("Reviewer name is required"); return; }
    if (editRating === 0) { setError("Please select a rating"); return; }
    setEditLoading(true);
    setError("");
    try {
      await axios.put("/api/shopping-bestie/reviews", {
        brandId,
        reviewId: editId,
        userName: editName,
        rating: editRating,
        comment: editComment,
        images: editImages,
      });
      setEditId(null);
      await fetchReviews();
      onReviewsChanged?.();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update review");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Delete this review?")) return;
    setError("");
    try {
      await axios.delete(
        `/api/shopping-bestie/reviews?brandId=${brandId}&reviewId=${reviewId}`
      );
      await fetchReviews();
      onReviewsChanged?.();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete review");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl max-h-[92vh]">
        {/* ── Header ── */}
        <div className="flex items-center justify-between bg-primary px-6 py-4 rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Reviews</h2>
            <p className="text-xs text-white/60 mt-0.5 truncate max-w-[300px]">{brandName}</p>
          </div>
          <div className="flex items-center gap-3">
            {!addMode && editId === null && (
              <button
                onClick={() => { setAddMode(true); setEditId(null); setError(""); setNewImages([]); }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30 transition-colors"
              >
                + Add Review
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-3 shrink-0">✕</button>
            </div>
          )}

          {/* ── Add Form ── */}
          {addMode && (
            <form
              onSubmit={handleAdd}
              className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3"
            >
              <h3 className="text-sm font-bold text-primary">New Review</h3>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reviewer Name *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sarah M."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rating *</label>
                <StarInput value={newRating} onChange={setNewRating} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Comment</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  placeholder="Share thoughts about this brand…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newImages.map((img, idx) => (
                    <div key={idx} className="relative h-16 w-16 group rounded overflow-hidden border border-gray-200">
                      <CldImage width="100" height="100" src={img} alt="Review Image" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset"}
                      onSuccess={(result: any) => {
                        if (result.info && result.info.secure_url) {
                          setNewImages((prev) => [...prev, result.info.secure_url]);
                        }
                      }}
                    >
                      {({ open }) => (
                        <button type="button" onClick={() => open()} className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-xl pb-1" title="Upload Image">
                          +
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setAddMode(false); setError(""); }}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-opacity-90 disabled:opacity-60"
                >
                  {addLoading ? "Adding…" : "Add Review"}
                </button>
              </div>
            </form>
          )}

          {/* ── Reviews List ── */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Loading reviews…</span>
            </div>
          ) : reviews.length === 0 && !addMode ? (
            <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
              <span className="text-4xl">⭐</span>
              <p className="text-sm">No reviews yet for this brand.</p>
              <button
                onClick={() => setAddMode(true)}
                className="mt-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
              >
                Add First Review
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) =>
                editId === review._id ? (
                  /* ── Inline Edit Form ── */
                  <form
                    key={review._id}
                    onSubmit={handleEdit}
                    className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 space-y-3"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wide text-blue-600">Editing Review</h4>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Reviewer Name *</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Rating *</label>
                      <StarInput value={editRating} onChange={setEditRating} />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Comment</label>
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Images</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editImages.map((img, idx) => (
                          <div key={idx} className="relative h-16 w-16 group rounded overflow-hidden border border-gray-200">
                            <CldImage width="100" height="100" src={img} alt="Review Image" className="object-cover w-full h-full" />
                            <button
                              type="button"
                              onClick={() => setEditImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors">
                          <CldUploadWidget
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset"}
                            onSuccess={(result: any) => {
                              if (result.info && result.info.secure_url) {
                                setEditImages((prev) => [...prev, result.info.secure_url]);
                              }
                            }}
                          >
                            {({ open }) => (
                              <button type="button" onClick={() => open()} className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-xl pb-1" title="Upload Image">
                                +
                              </button>
                            )}
                          </CldUploadWidget>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setEditId(null); setError(""); }}
                        className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editLoading}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                      >
                        {editLoading ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ── Review Card ── */
                  <div
                    key={review._id}
                    className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    {(() => {
                      const u = review.resolvedUser;
                      const displayName = u?.firstName || u?.lastName
                        ? `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim()
                        : (review.userName ?? "?");
                      const helpfulCount = Array.isArray(review.helpful) ? review.helpful.length : (review.helpful ?? 0);
                      const notHelpfulCount = Array.isArray(review.notHelpful) ? review.notHelpful.length : (review.notHelpful ?? 0);
                      return (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            {/* Left: avatar + name + stars */}
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary uppercase">
                                {(displayName[0] ?? "?").toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm truncate">{displayName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <StarDisplay value={review.rating} />
                                  <span className="text-xs text-gray-400">
                                    {new Date(review.createdAt).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: action buttons */}
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">

                              <button
                                onClick={() => handleDelete(review._id)}
                                title="Delete"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Comment */}
                          {review.comment && (
                            <p className="mt-2.5 text-sm text-gray-600 leading-relaxed pl-12 flex-wrap break-words">
                              {review.comment}
                            </p>
                          )}

                          {/* Images */}
                          {review.images && review.images.length > 0 && (
                            <div className="mt-3 pl-12 flex gap-2 flex-wrap">
                              {review.images.map((img, idx) => (
                                <button 
                                  key={idx} 
                                  type="button"
                                  onClick={() => setLightbox({ images: review.images!, currentIndex: idx })} 
                                  className="block h-20 w-20 overflow-hidden rounded-lg border border-gray-200 hover:ring-2 hover:ring-primary hover:opacity-90 transition-all focus:outline-none"
                                >
                                  <CldImage width="150" height="150" src={img} alt={`Review Image ${idx + 1}`} className="object-cover h-full w-full" />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Helpful / Not Helpful — clickable voter popovers */}
                          <div className="mt-3 flex items-center gap-2 pl-12">
                            {([
                              { key: "helpful" as const, emoji: "👍", label: "helpful", voters: Array.isArray(review.helpful) ? review.helpful : [], count: helpfulCount, color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
                              { key: "notHelpful" as const, emoji: "👎", label: "not helpful", voters: Array.isArray(review.notHelpful) ? review.notHelpful : [], count: notHelpfulCount, color: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" },
                            ] as const).map(({ key, emoji, label, voters, count, color }) => {
                              const isPopoverOpen = voterPopover?.reviewId === review._id && voterPopover?.type === key;
                              return (
                                <div key={key} className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setVoterPopover(isPopoverOpen ? null : { reviewId: review._id, type: key })}
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${color}`}
                                  >
                                    {emoji} {count} {label}
                                  </button>
                                  {isPopoverOpen && (
                                    <div className="absolute bottom-full left-0 mb-1.5 z-50 min-w-[170px] rounded-xl border border-gray-200 bg-white shadow-xl p-2">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                                        {emoji} {label} ({count})
                                      </p>
                                      {voters.length === 0 ? (
                                        <p className="text-xs text-gray-400 px-1">No votes yet</p>
                                      ) : (
                                        <ul className="space-y-1">
                                          {voters.map((v: any, i: number) => {
                                            const name =
                                              v?.firstName || v?.lastName
                                                ? `${v?.firstName ?? ""} ${v?.lastName ?? ""}`.trim()
                                                : v?.username ?? String(v?._id ?? v);
                                            return (
                                              <li key={i} className="flex items-center gap-1.5 px-1 py-0.5 rounded-lg hover:bg-gray-50">
                                                <div className="h-5 w-5 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                  {(name[0] ?? "?").toUpperCase()}
                                                </div>
                                                <span className="text-xs text-gray-700 truncate">{name}</span>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* ── Footer summary ── */}
        {reviews.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50 rounded-b-2xl">
            <span className="text-sm text-gray-500">
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <StarDisplay
                value={
                  reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                }
              />
              <span className="text-sm font-bold text-gray-700">
                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Lightbox Modal ── */}
      {lightbox && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={() => setLightbox(null)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndHandler}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center transition-all z-50 text-xl font-bold"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
          >
            ✕
          </button>
          
          {lightbox.currentIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 rounded-full h-12 w-12 flex items-center justify-center transition-all z-50 text-3xl pb-1"
              onClick={handlePrevLightbox}
            >
              ‹
            </button>
          )}

          <div
            className="relative w-full h-full max-w-6xl max-h-[95vh] flex items-center justify-center p-4 lg:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* The image itself */}
            <CldImage 
              width="1200"
              height="1200"
              src={lightbox.images[lightbox.currentIndex]} 
              alt={`Review attachment ${lightbox.currentIndex + 1}`} 
              className="max-w-full max-h-full object-contain select-none drop-shadow-2xl rounded-sm"
              preserveTransformations
            />
          </div>

          {lightbox.currentIndex < lightbox.images.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 rounded-full h-12 w-12 flex items-center justify-center transition-all z-50 text-3xl pb-1"
              onClick={handleNextLightbox}
            >
              ›
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-white/10 px-4 py-1.5 rounded-full text-sm font-semibold z-50 tracking-widest backdrop-blur-sm">
            {lightbox.currentIndex + 1} / {lightbox.images.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandReviewsModal;

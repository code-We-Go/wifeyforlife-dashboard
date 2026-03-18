"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { IShoppingBrand } from "@/app/models/shoppingBestieModel";
import UploadCategoryImageButton from "./UploadCategoryImageButton";

export interface ShoppingCategoryOption {
  _id: string;
  name: string;
  slug: string;
}

export interface ShoppingSubcategoryOption {
  _id: string;
  name: string;
  slug: string;
  categoryId: string | { _id: string; name: string };
}

interface ShoppingBestieModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand?: (IShoppingBrand & { _id: string }) | null;
  type: "add" | "edit" | "view";
  onSuccess: () => void;
  categories: ShoppingCategoryOption[];
  subcategories: ShoppingSubcategoryOption[];
}

const emptyForm = {
  name: "",
  logo: "",
  /**
   * subCategoryIds  – ObjectIds sent to the API (the only thing stored in DB)
   * subCategoryObjs – populated sub-cat objects { _id, name, categoryId: { _id, name } }
   * categoryIds / categories are derived from subCategoryObjs for the UI only
   */
  subCategoryIds:  [] as string[],
  subCategoryObjs: [] as Array<{ _id: string; name: string; categoryId: { _id: string; name: string } }>,
  categoryIds:     [] as string[], // derived – used to filter the sub-cat dropdown
  description: "",
  link: "",
  tags: "",
  isFeatured: false,
  isActive: true,
};

const ShoppingBestieModal = ({
  isOpen,
  onClose,
  brand,
  type,
  onSuccess,
  categories,
  subcategories,
}: ShoppingBestieModalProps) => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  // { reviewId, type: 'helpful' | 'notHelpful' } | null
  const [voterPopover, setVoterPopover] = useState<{ reviewId: string; type: "helpful" | "notHelpful" } | null>(null);

  // Subcategories available for currently selected categories (only unselected ones shown)
  const filteredSubs = subcategories.filter((s) => {
    const catId = typeof s.categoryId === "object" ? s.categoryId._id : s.categoryId;
    return form.categoryIds.includes(catId) && !form.subCategoryIds.includes(s._id);
  });

  // Derive category chips from the populated subCategoryObjs
  const selectedCategories = Array.from(
    new Map(
      form.subCategoryObjs.map((s) => [s.categoryId._id, s.categoryId])
    ).values()
  );

  useEffect(() => {
    if (brand && (type === "edit" || type === "view")) {
      // brand.subCategories is already populated by the API
      const populatedSubs: Array<{ _id: string; name: string; categoryId: { _id: string; name: string } }> =
        ((brand as any).subCategories ?? []).map((s: any) =>
          typeof s === "object" && s !== null
            ? {
                _id: String(s._id ?? s),
                name: s.name ?? "",
                categoryId: typeof s.categoryId === "object"
                  ? { _id: String(s.categoryId._id), name: s.categoryId.name ?? "" }
                  : { _id: String(s.categoryId), name: "" },
              }
            : { _id: String(s), name: "", categoryId: { _id: "", name: "" } }
        );

      const catIds = Array.from(new Set(populatedSubs.map((s) => s.categoryId._id)));

      setForm({
        name: brand.name || "",
        logo: brand.logo || "",
        subCategoryIds:  populatedSubs.map((s) => s._id),
        subCategoryObjs: populatedSubs,
        categoryIds:     catIds,
        description: brand.description || "",
        link: brand.link || "",
        tags: Array.isArray(brand.tags) ? brand.tags.join(", ") : "",
        isFeatured: brand.isFeatured || false,
        isActive: brand.isActive !== undefined ? brand.isActive : true,
      });
    } else {
      setForm(emptyForm);
    }
    setError("");
    setLocalReviews((brand?.reviews as any[]) ?? []);
    if (type === "view" && brand) {
      axios
        .get(`/api/shopping-bestie/reviews?brandId=${(brand as any)._id}`)
        .then((res) => setLocalReviews(res.data?.data?.reviews ?? []))
        .catch(() => { /* keep raw reviews on error */ });
    }
  }, [brand, type, isOpen, categories, subcategories]);

  // ── Category multi-select helpers ──────────────────────────────────────────
  const toggleCategory = (catId: string) => {
    const isSelected = form.categoryIds.includes(catId);
    if (isSelected) {
      // de-select category → remove its sub-cats from the selection
      setForm((prev) => ({
        ...prev,
        categoryIds: prev.categoryIds.filter((id) => id !== catId),
        subCategoryIds: prev.subCategoryIds.filter(
          (id) => !prev.subCategoryObjs.find((s) => s._id === id && s.categoryId._id === catId)
        ),
        subCategoryObjs: prev.subCategoryObjs.filter((s) => s.categoryId._id !== catId),
      }));
    } else {
      setForm((prev) => ({ ...prev, categoryIds: [...prev.categoryIds, catId] }));
    }
  };

  const toggleSubCategory = (subId: string) => {
    const sub = subcategories.find((s) => s._id === subId);
    if (!sub) return;
    const catId = typeof sub.categoryId === "object" ? sub.categoryId._id : sub.categoryId;
    const catName = categories.find((c) => c._id === catId)?.name ?? "";
    const isSelected = form.subCategoryIds.includes(subId);
    setForm((prev) => ({
      ...prev,
      subCategoryIds: isSelected
        ? prev.subCategoryIds.filter((id) => id !== subId)
        : [...prev.subCategoryIds, subId],
      subCategoryObjs: isSelected
        ? prev.subCategoryObjs.filter((s) => s._id !== subId)
        : [
            ...prev.subCategoryObjs,
            { _id: subId, name: sub.name, categoryId: { _id: catId, name: catName } },
          ],
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type: inputType } = e.target;
    if (inputType === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!brand || !window.confirm("Delete this review?")) return;
    setDeletingReviewId(reviewId);
    try {
      await axios.delete(
        `/api/shopping-bestie?id=${(brand as any)._id}&reviewId=${reviewId}`,
      );
      setLocalReviews((prev) => prev.filter((r: any) => r._id !== reviewId));
      onSuccess(); // refresh parent table
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.subCategoryIds.length === 0) { setError("Please select at least one sub-category"); return; }
    setLoading(true);
    setError("");
    try {
      const payload = {
        name:        form.name,
        logo:        form.logo,
        subCategories: form.subCategoryIds, // only ObjectIds stored in DB
        description: form.description,
        link:        form.link,
        tags:        form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        isFeatured:  form.isFeatured,
        isActive:    form.isActive,
      };

      if (type === "add") {
        await axios.post("/api/shopping-bestie", payload);
      } else if (type === "edit" && brand) {
        await axios.put("/api/shopping-bestie", { _id: (brand as any)._id, ...payload });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isView = type === "view";
  const title =
    type === "add" ? "Add New Brand" : type === "edit" ? "Edit Brand" : "Brand Details";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-primary px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ── Logo Upload ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Brand Logo
            </label>
            <div className="flex flex-col items-start gap-3">
              {form.logo ? (
                <div className="relative rounded-xl border-2 border-gray-200 bg-gray-50 p-2 flex items-center gap-3">
                  <div className="relative h-16 w-24 overflow-hidden rounded-lg">
                    <Image
                      src={form.logo}
                      alt="Brand logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  {!isView && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, logo: "" }))}
                      className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex h-16 w-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-2xl">
                  🛍️
                </div>
              )}
              {!isView && (
                <UploadCategoryImageButton
                  imageUrl={form.logo}
                  updateImageUrl={(url) => setForm((prev) => ({ ...prev, logo: url }))}
                />
              )}
            </div>
          </div>

          {/* ── Brand Name ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={isView}
              required
              placeholder="e.g. Zara, H&M, ASOS"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* ── Categories / Sub-categories ── */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Categories *</label>
              {isView ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCategories.length === 0
                    ? <span className="text-sm text-gray-400">—</span>
                    : selectedCategories.map((c) => (
                        <span key={c._id} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{c.name}</span>
                      ))}
                </div>
              ) : (
                <>
                  {/* chip row for selected categories */}
                  {form.categoryIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.categoryIds.map((catId) => {
                        const cat = categories.find((c) => c._id === catId);
                        return cat ? (
                          <span key={catId} className="inline-flex items-center gap-1 rounded-full bg-primary/10 pl-2.5 pr-1.5 py-0.5 text-xs font-medium text-primary">
                            {cat.name}
                            <button
                              type="button"
                              onClick={() => toggleCategory(catId)}
                              className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary/20 hover:bg-primary/40 text-primary leading-none"
                            >×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) toggleCategory(e.target.value); }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    <option value="">+ Add category…</option>
                    {categories
                      .filter((c) => !form.categoryIds.includes(c._id))
                      .map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                  </select>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sub-Categories *</label>
              {isView ? (
                <div className="flex flex-wrap gap-1.5">
                  {form.subCategoryObjs.length === 0
                    ? <span className="text-sm text-gray-400">—</span>
                    : form.subCategoryObjs.map((s) => (
                        <span key={s._id} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{s.name}</span>
                      ))}
                </div>
              ) : (
                <>
                  {/* chip row for selected sub-categories */}
                  {form.subCategoryIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.subCategoryObjs.map((s) => (
                        <span key={s._id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 pl-2.5 pr-1.5 py-0.5 text-xs font-medium text-gray-700">
                          {s.name}
                          <button
                            type="button"
                            onClick={() => toggleSubCategory(s._id)}
                            className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 leading-none"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  {form.categoryIds.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">⚠️ Select at least one category first</p>
                  ) : filteredSubs.length === 0 ? (
                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">No sub-categories for selected categories</p>
                  ) : (
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) toggleSubCategory(e.target.value); }}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                    >
                      <option value="">+ Add sub-category…</option>
                      {filteredSubs.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={isView}
              
              rows={3}
              placeholder="Tell brides what this brand offers..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
            />
          </div>

          {/* ── Link ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Link *</label>
            <input
              name="link"
              value={form.link}
              onChange={handleChange}
              disabled={isView}
              required
              type="url"
              placeholder="https://brandwebsite.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* ── Tags ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tags <span className="font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              disabled={isView}
              placeholder="bridal, luxury, affordable"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* ── Toggles ── */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                disabled={isView}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-gray-700">Featured Brand</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                disabled={isView}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          {/* ── View-only stats ── */}
          {isView && brand && (() => {
            const total = localReviews.length;
            const avg = total > 0 ? localReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / total : 0;
            return (
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{(brand as any).clicks ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Clicks</p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <p className="text-2xl font-bold text-amber-500">{avg.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Avg Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{total}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Reviews</p>
                </div>
              </div>
            );
          })()}

          {/* ── Reviews list (view mode) ── */}
          {isView && brand && (
            <div className="mt-2">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest">⭐ Reviews</h3>
              {localReviews.length === 0 ? (
                <p className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                  No reviews yet
                </p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {localReviews.map((r: any) => {
                    const u = r.resolvedUser;
                    const displayName = u?.firstName || u?.lastName
                      ? `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim()
                      : (r.userName ?? "?");
                    return (
                    <div key={r._id} className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-2 shadow-sm">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                            {(displayName[0] ?? "?").toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 leading-tight">{displayName}</p>
                            <p className="text-[10px] text-gray-400">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <svg key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r._id)}
                            disabled={deletingReviewId === r._id}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                            title="Delete review"
                          >
                            {deletingReviewId === r._id ? (
                              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                      {/* Helpful / Not-helpful pills */}
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                        {(
                          [
                            { key: "helpful" as const, emoji: "👍", label: "helpful", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
                            { key: "notHelpful" as const, emoji: "👎", label: "not helpful", color: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" },
                          ] as const
                        ).map(({ key, emoji, label, color }) => {
                          const voters: any[] = Array.isArray(r[key]) ? r[key] : [];
                          const isOpen = voterPopover?.reviewId === r._id && voterPopover?.type === key;
                          return (
                            <div key={key} className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setVoterPopover(isOpen ? null : { reviewId: r._id, type: key })
                                }
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${color}`}
                              >
                                {emoji} {voters.length} {label}
                              </button>
                              {isOpen && (
                                <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[160px] rounded-xl border border-gray-200 bg-white shadow-xl p-2">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                                    {emoji} {label} ({voters.length})
                                  </p>
                                  {voters.length === 0 ? (
                                    <p className="text-xs text-gray-400 px-1">No votes yet</p>
                                  ) : (
                                    <ul className="space-y-1">
                                      {voters.map((v: any, i: number) => {
                                        const displayName =
                                          v?.firstName || v?.lastName
                                            ? `${v?.firstName ?? ""} ${v?.lastName ?? ""}`.trim()
                                            : v?.username ?? String(v);
                                        return (
                                          <li key={i} className="flex items-center gap-1.5 px-1 py-0.5 rounded-lg hover:bg-gray-50">
                                            <div className="h-5 w-5 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                              {(displayName[0] ?? "?").toUpperCase()}
                                            </div>
                                            <span className="text-xs text-gray-700 truncate">{displayName}</span>
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
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Actions ── */}
          {!isView && (
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-60"
              >
                {loading ? "Saving…" : type === "add" ? "Add Brand" : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ShoppingBestieModal;

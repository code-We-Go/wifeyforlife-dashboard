"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import { IShoppingBrand } from "@/app/models/shoppingBestieModel";
import ShoppingBestieModal, {
  ShoppingCategoryOption,
  ShoppingSubcategoryOption,
} from "./ShoppingBestieModal";
import UploadCategoryImageButton from "./UploadCategoryImageButton";
import BrandReviewsModal from "./BrandReviewsModal";

type Brand = IShoppingBrand & { _id: string };

interface AnalyticsData {
  totalBrands: number;
  activeBrands: number;
  totalClicks: number;
  avgRating: number;
  totalReviews: number;
  topByClicks: Brand[];
  topByRating: Brand[];
  categoryStats: { _id: string; count: number; totalClicks: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const StarRating = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        className={`h-3.5 w-3.5 ${s <= Math.round(value) ? "text-amber-400" : "text-gray-300"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const StatCard = ({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) => (
  <div className={`rounded-2xl p-5 ${color} flex flex-col gap-1 shadow-sm`}>
    <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</p>
    <p className="text-3xl font-extrabold">{value}</p>
    {sub && <p className="text-xs opacity-60">{sub}</p>}
  </div>
);

// ─── Category/Sub-category inline modal ──────────────────────────────────────

interface CatModalState {
  open: boolean;
  mode: "add-cat" | "edit-cat" | "add-sub" | "edit-sub";
  cat?: ShoppingCategoryOption;
  sub?: ShoppingSubcategoryOption;
}

const CatModal = ({
  state,
  categories,
  onClose,
  onSuccess,
}: {
  state: CatModalState;
  categories: ShoppingCategoryOption[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [name, setName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.mode === "edit-cat" && state.cat) {
      setName(state.cat.name);
      setIsActive((state.cat as any).isActive !== false);
    } else if (state.mode === "edit-sub" && state.sub) {
      setName(state.sub.name);
      const catId =
        typeof state.sub.categoryId === "object"
          ? state.sub.categoryId._id
          : state.sub.categoryId;
      setSelectedCatId(catId);
      setIsActive((state.sub as any).isActive !== false);
    } else {
      setName("");
      setSelectedCatId(categories[0]?._id || "");
      setIsActive(true);
    }
    setError("");
  }, [state, categories]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    if ((state.mode === "add-sub" || state.mode === "edit-sub") && !selectedCatId) {
      setError("Please select a parent category");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (state.mode === "add-cat") {
        await axios.post("/api/shopping-categories", { name: name.trim(), isActive });
      } else if (state.mode === "edit-cat" && state.cat) {
        await axios.put("/api/shopping-categories", {
          _id: state.cat._id,
          name: name.trim(),
          isActive,
        });
      } else if (state.mode === "add-sub") {
        await axios.post("/api/shopping-subcategories", {
          name: name.trim(),
          categoryId: selectedCatId,
          isActive,
        });
      } else if (state.mode === "edit-sub" && state.sub) {
        await axios.put("/api/shopping-subcategories", {
          _id: state.sub._id,
          name: name.trim(),
          categoryId: selectedCatId,
          isActive,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!state.open) return null;

  const isCat = state.mode === "add-cat" || state.mode === "edit-cat";
  const title =
    state.mode === "add-cat"
      ? "Add Category"
      : state.mode === "edit-cat"
      ? "Edit Category"
      : state.mode === "add-sub"
      ? "Add Sub-Category"
      : "Edit Sub-Category";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCat ? "e.g. Fashion" : "e.g. Dresses"}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Parent category (sub only) */}
          {!isCat && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Parent Category *
              </label>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}


          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-opacity-90 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ShoppingBestieComponent = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"brands" | "analytics" | "categories">("brands");

  // Brand modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view">("add");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Category/sub data
  const [shoppingCategories, setShoppingCategories] = useState<ShoppingCategoryOption[]>([]);
  const [shoppingSubcategories, setShoppingSubcategories] = useState<ShoppingSubcategoryOption[]>([]);
  const [catModalState, setCatModalState] = useState<CatModalState>({
    open: false,
    mode: "add-cat",
  });

  // Reviews modal
  const [reviewsModal, setReviewsModal] = useState<{
    open: boolean;
    brandId: string;
    brandName: string;
  }>({ open: false, brandId: "", brandName: "" });

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/shopping-bestie");
      setBrands(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await axios.get("/api/shopping-bestie?analytics=true");
      setAnalytics(res.data.data);
    } catch { /* silently fail */ } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        axios.get("/api/shopping-categories"),
        axios.get("/api/shopping-subcategories"),
      ]);
      setShoppingCategories(catRes.data.data);
      setShoppingSubcategories(subRes.data.data);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    fetchBrands();
    fetchAnalytics();
    fetchCategories();
  }, [fetchBrands, fetchAnalytics, fetchCategories]);

  const handleBrandSuccess = () => { fetchBrands(); fetchAnalytics(); };

  // ── Brand CRUD ──────────────────────────────────────────────────────────────

  const handleDeleteBrand = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;
    try {
      await axios.delete(`/api/shopping-bestie?id=${id}`);
      fetchBrands();
      fetchAnalytics();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete brand");
    }
  };

  const openBrandModal = (type: "add" | "edit" | "view", brand?: Brand) => {
    setModalType(type);
    setSelectedBrand(brand || null);
    setModalOpen(true);
  };

  // ── Category CRUD ───────────────────────────────────────────────────────────

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await axios.delete(`/api/shopping-categories?id=${id}`);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete category");
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!window.confirm("Delete this sub-category?")) return;
    try {
      await axios.delete(`/api/shopping-subcategories?id=${id}`);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete sub-category");
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────────

  const filteredBrands = brands.filter((b) => {
    const matchSearch =
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.tags || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = categoryFilter ? b.category === categoryFilter : true;
    return matchSearch && matchCat;
  });

  const uniqueCategories = Array.from(new Set(brands.map((b) => b.category).filter(Boolean)));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full bg-gray-50 pb-10">
      {/* ── Page Header ── */}
      <div className="bg-primary px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                🛍️ Shopping Bestie
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Manage curated brands, categories &amp; engagement analytics
              </p>
            </div>
            {activeTab === "brands" && (
              <button
                onClick={() => openBrandModal("add")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>+</span> Add Brand
              </button>
            )}
          </div>

          {/* Tab navigation */}
          <div className="mt-6 flex gap-2 flex-wrap">
            {(["brands", "analytics", "categories"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-white text-primary shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {tab === "brands" ? "📋 Brands" : tab === "analytics" ? "📊 Analytics" : "🗂️ Categories"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-6">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-4">✕</button>
          </div>
        )}

        {/* ══════════ BRANDS TAB ══════════ */}
        {activeTab === "brands" && (
          <>
            <div className="mb-5 flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search brands, tags…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-[200px] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="px-4 py-3.5 text-left font-semibold">Logo</th>
                      <th className="px-4 py-3.5 text-left font-semibold">Brand</th>
                      <th className="px-4 py-3.5 text-left font-semibold">Category</th>
                      <th className="px-4 py-3.5 text-left font-semibold">Sub-Category</th>
                      <th className="px-4 py-3.5 text-center font-semibold">Clicks</th>
                      <th className="px-4 py-3.5 text-center font-semibold">Rating</th>
                      <th className="px-4 py-3.5 text-center font-semibold">Reviews</th>
                      <th className="px-4 py-3.5 text-center font-semibold">Status</th>
                      <th className="px-4 py-3.5 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <span className="text-sm">Loading brands…</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredBrands.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-gray-400">
                          No brands found
                        </td>
                      </tr>
                    ) : (
                      filteredBrands.map((brand) => (
                        <tr
                          key={brand._id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            {brand.logo ? (
                              <div className="relative h-10 w-16">
                                <Image
                                  src={brand.logo}
                                  alt={brand.name}
                                  fill
                                  className="object-contain rounded-lg border border-gray-100 bg-white p-0.5"
                                />
                              </div>
                            ) : (
                              <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-gray-100 text-lg">
                                🛍️
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800">{brand.name}</p>
                            {brand.isFeatured && (
                              <span className="inline-block mt-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                                ⭐ FEATURED
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{brand.category}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{brand.subCategory}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                              👆 {brand.clicks ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {(() => {
                              const reviews = brand.reviews ?? [];
                              const total = reviews.length;
                              const avg = total > 0 ? reviews.reduce((s, r) => s + (r as any).rating, 0) / total : 0;
                              return total > 0 ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <StarRating value={avg} />
                                  <span className="text-[10px] text-gray-400">
                                    {avg.toFixed(1)} ({total})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300">No reviews</span>
                              );
                            })()}
                          </td>
                          {/* Reviews button */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() =>
                                setReviewsModal({ open: true, brandId: brand._id, brandName: brand.name })
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                            >
                              ⭐ {(brand.reviews ?? []).length}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${brand.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                              {brand.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openBrandModal("view", brand)} title="View" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                              </button>
                              <button onClick={() => openBrandModal("edit", brand)} title="Edit" className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </button>
                              <button onClick={() => handleDeleteBrand(brand._id)} title="Delete" className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══════════ ANALYTICS TAB ══════════ */}
        {activeTab === "analytics" && (
          <>
            {analyticsLoading ? (
              <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm">Loading analytics…</span>
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <StatCard label="Total Brands" value={analytics.totalBrands} color="bg-primary text-white" />
                  <StatCard label="Active Brands" value={analytics.activeBrands} color="bg-green-500 text-white" />
                  <StatCard label="Total Clicks" value={analytics.totalClicks.toLocaleString()} sub="across all brands" color="bg-blue-500 text-white" />
                  <StatCard label="Total Reviews" value={analytics.totalReviews.toLocaleString()} sub="across all brands" color="bg-purple-500 text-white" />
                  <StatCard label="Avg Rating" value={analytics.avgRating.toFixed(2)} sub="out of 5 stars" color="bg-amber-400 text-white" />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold text-gray-700 uppercase tracking-widest">👆 Top Brands by Clicks</h3>
                    {analytics.topByClicks.length === 0 ? <p className="text-sm text-gray-400">No data yet</p> : (
                      <div className="space-y-3">
                        {analytics.topByClicks.map((b, idx) => (
                          <div key={(b as any)._id} className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                            {b.logo ? (
                              <div className="relative h-7 w-12 shrink-0">
                                <Image src={b.logo} alt={b.name} fill className="object-contain rounded" />
                              </div>
                            ) : (
                              <div className="flex h-7 w-12 shrink-0 items-center justify-center rounded bg-gray-100 text-base">🛍️</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-800">{b.name}</p>
                              <p className="text-xs text-gray-400">{b.category}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{(b as any).clicks ?? 0} clicks</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold text-gray-700 uppercase tracking-widest">⭐ Top Brands by Rating</h3>
                    {analytics.topByRating.length === 0 ? <p className="text-sm text-gray-400">No ratings yet</p> : (
                      <div className="space-y-3">
                        {analytics.topByRating.map((b, idx) => (
                          <div key={(b as any)._id} className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">{idx + 1}</span>
                            {b.logo ? (
                              <div className="relative h-7 w-12 shrink-0">
                                <Image src={b.logo} alt={b.name} fill className="object-contain rounded" />
                              </div>
                            ) : (
                              <div className="flex h-7 w-12 shrink-0 items-center justify-center rounded bg-gray-100 text-base">🛍️</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-800">{b.name}</p>
                              <StarRating value={(b as any).averageRating} />
                            </div>
                            <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{((b as any).averageRating as number).toFixed(1)} ★</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-gray-700 uppercase tracking-widest">📂 Clicks by Category</h3>
                  {analytics.categoryStats.length === 0 ? <p className="text-sm text-gray-400">No data yet</p> : (
                    <div className="space-y-3">
                      {analytics.categoryStats.map((cat) => {
                        const pct = analytics.totalClicks > 0 ? Math.round((cat.totalClicks / analytics.totalClicks) * 100) : 0;
                        return (
                          <div key={cat._id}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-700">{cat._id || "Uncategorised"}</span>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{cat.count} brand{cat.count !== 1 ? "s" : ""}</span>
                                <span className="font-bold text-primary">{cat.totalClicks} clicks</span>
                              </div>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400 py-10">No analytics available</p>
            )}
          </>
        )}

        {/* ══════════ CATEGORIES TAB ══════════ */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            {/* ─ Categories ─ */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Categories</h2>
                <button
                  onClick={() => setCatModalState({ open: true, mode: "add-cat" })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-opacity-90 transition-all"
                >
                  + Add Category
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">Name</th>
                      <th className="px-5 py-3 text-left">Slug</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shoppingCategories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                          No categories yet — add one!
                        </td>
                      </tr>
                    ) : (
                      shoppingCategories.map((cat) => (
                        <tr key={cat._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-gray-800">{cat.name}</td>
                          <td className="px-5 py-3 text-gray-400 font-mono text-xs">{cat.slug}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${(cat as any).isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                              {(cat as any).isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => setCatModalState({ open: true, mode: "edit-cat", cat })} className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </button>
                              <button onClick={() => handleDeleteCategory(cat._id)} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─ Sub-categories ─ */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Sub-Categories</h2>
                <button
                  onClick={() => setCatModalState({ open: true, mode: "add-sub" })}
                  disabled={shoppingCategories.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Sub-Category
                </button>
              </div>
              {shoppingCategories.length === 0 && (
                <p className="px-5 py-3 text-xs text-amber-600 bg-amber-50">
                  ⚠️ Add at least one category first before creating sub-categories.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">Name</th>
                      <th className="px-5 py-3 text-left">Parent Category</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shoppingSubcategories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                          No sub-categories yet
                        </td>
                      </tr>
                    ) : (
                      shoppingSubcategories.map((sub) => {
                        const parentName =
                          typeof sub.categoryId === "object"
                            ? (sub.categoryId as any).name
                            : shoppingCategories.find((c) => c._id === sub.categoryId)?.name || "—";
                        return (
                          <tr key={sub._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-semibold text-gray-800">{sub.name}</td>
                            <td className="px-5 py-3">
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{parentName}</span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${(sub as any).isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                {(sub as any).isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setCatModalState({ open: true, mode: "edit-sub", sub })} className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                </button>
                                <button onClick={() => handleDeleteSubcategory(sub._id)} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Brand Modal ── */}
      <ShoppingBestieModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        brand={selectedBrand}
        type={modalType}
        onSuccess={handleBrandSuccess}
        categories={shoppingCategories}
        subcategories={shoppingSubcategories}
      />

      {/* ── Category/Sub Modal ── */}
      <CatModal
        state={catModalState}
        categories={shoppingCategories}
        onClose={() => setCatModalState((s) => ({ ...s, open: false }))}
        onSuccess={fetchCategories}
      />

      {/* ── Brand Reviews Modal ── */}
      <BrandReviewsModal
        isOpen={reviewsModal.open}
        onClose={() => setReviewsModal((s) => ({ ...s, open: false }))}
        brandId={reviewsModal.brandId}
        brandName={reviewsModal.brandName}
        onReviewsChanged={() => { fetchBrands(); fetchAnalytics(); }}
      />
    </div>
  );
};

export default ShoppingBestieComponent;

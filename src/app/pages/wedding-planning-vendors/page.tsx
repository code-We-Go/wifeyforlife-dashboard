"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { CldUploadWidget, CldImage } from "next-cloudinary";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { WeddingPlanningVendor, Category, SubCategory } from "@/interfaces/interfaces";
import VendorModal from "@/components/VendorModal";
import { thirdFont } from "@/app/lib/fonts";

const WeddingPlanningVendorsPage = () => {
  const [vendors, setVendors] = useState<WeddingPlanningVendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
  
  const [filterCategoryID, setFilterCategoryID] = useState<string>("all");
  const [filterSubCategoryID, setFilterSubCategoryID] = useState<string>("all");
  
  const [modalType, setModalType] = useState<"edit" | "delete" | "add" | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<WeddingPlanningVendor | undefined>(undefined);
  const [savingVendorId, setSavingVendorId] = useState<string | null>(null);

  const fetchVendors = async () => {
    try {
      let url = "/api/wedding-planning-vendors?";
      if (filterSubCategoryID !== "all") {
        url += `subCategoryID=${filterSubCategoryID}`;
      } else if (filterCategoryID !== "all") {
        url += `categoryID=${filterCategoryID}`;
      }
      const res = await axios.get(url);
      setVendors(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories?type=wedding-planning&all=true");
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllSubCategories = async () => {
    try {
      const res = await axios.get("/api/subcategories");
      setAllSubCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubCategories = async (catID: string) => {
    try {
      if (catID === "all") {
        setSubCategories([]);
        return;
      }
      const res = await axios.get(`/api/subcategories?categoryID=${catID}`);
      setSubCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [filterSubCategoryID, filterCategoryID]);

  useEffect(() => {
    fetchCategories();
    fetchAllSubCategories();
  }, []);

  useEffect(() => {
    fetchSubCategories(filterCategoryID);
    setFilterSubCategoryID("all");
  }, [filterCategoryID]);

  const openModal = (type: "edit" | "delete" | "add", vendor?: WeddingPlanningVendor) => {
    setSelectedVendor(vendor);
    setModalType(type);
  };

  const handleCellChange = (vendorId: string, field: keyof WeddingPlanningVendor, value: any) => {
    setVendors((prev) =>
      prev.map((v) => (v._id === vendorId ? { ...v, [field]: value } : v))
    );
  };

  const saveVendorRow = async (vendor: WeddingPlanningVendor) => {
    setSavingVendorId(vendor._id);
    try {
      const payload = {
        name: vendor.name,
        fromPrice: vendor.fromPrice ?? null,
        toPrice: vendor.toPrice ?? null,
        link: vendor.link || "",
        images: vendor.images || [],
        coverImage: vendor.coverImage || "",
        package: vendor.package || "",
        notes: vendor.notes || "",
        subCategoryID: vendor.subCategoryID?._id || vendor.subCategoryID,
        active: vendor.active !== false,
      };
      await axios.put(`/api/wedding-planning-vendors?vendorID=${vendor._id}`, payload);
    } catch (err) {
      console.error("Failed to auto-save vendor:", err);
    } finally {
      setSavingVendorId(null);
    }
  };

  const addImageToVendor = (vendor: WeddingPlanningVendor, newUrl: string) => {
    const updatedImages = [...(vendor.images || []), newUrl];
    const updated = { ...vendor, images: updatedImages };
    setVendors((prev) => prev.map((v) => (v._id === vendor._id ? updated : v)));
    saveVendorRow(updated);
  };

  const removeImageFromVendor = (vendor: WeddingPlanningVendor, index: number) => {
    const updatedImages = (vendor.images || []).filter((_, i) => i !== index);
    const updated = { ...vendor, images: updatedImages };
    setVendors((prev) => prev.map((v) => (v._id === vendor._id ? updated : v)));
    saveVendorRow(updated);
  };

  const updateCoverImage = (vendor: WeddingPlanningVendor, url: string) => {
    const updated = { ...vendor, coverImage: url };
    setVendors((prev) => prev.map((v) => (v._id === vendor._id ? updated : v)));
    saveVendorRow(updated);
  };

  const handleSubCategoryChange = (vendor: WeddingPlanningVendor, subCatId: string) => {
    const foundSub = allSubCategories.find((s) => s._id === subCatId);
    const updated = {
      ...vendor,
      subCategoryID: foundSub || ({ _id: subCatId } as SubCategory),
    };
    setVendors((prev) => prev.map((v) => (v._id === vendor._id ? updated : v)));
    saveVendorRow(updated);
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        
        <div className="flex w-[97%] flex-col gap-4 md:flex-row md:items-center md:justify-between text-primary">
          <div>
            <h1 className={`${thirdFont.className} text-3xl font-bold text-secondary`}>
              Wedding Planning Vendors
            </h1>
            <p className="text-xs text-gray-500 mt-1">Excel-like editable table: click on any cell to edit directly.</p>
          </div>
          <button
            className="rounded-2xl bg-secondary px-6 py-2 text-sm text-creamey hover:opacity-90 transition-opacity"
            onClick={() => openModal("add")}
          >
            + ADD NEW VENDOR
          </button>
        </div>

        {/* Filters */}
        <div className="flex w-[97%] flex-wrap gap-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Category:</span>
            <select
              value={filterCategoryID}
              onChange={(e) => setFilterCategoryID(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-secondary bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Subcategory:</span>
            <select
              value={filterSubCategoryID}
              onChange={(e) => setFilterSubCategoryID(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-secondary bg-white"
              disabled={filterCategoryID === "all"}
            >
              <option value="all">All Subcategories</option>
              {subCategories.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.subCategoryName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Excel-like Editable Vendors Table */}
        <div className="w-[97%] overflow-x-auto border border-gray-300 rounded shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-secondary text-creamey text-xs sticky top-0 z-10 select-none">
              <tr>
                <th className="border p-2 min-w-[120px]">Cover Image</th>
                <th className="border p-2 min-w-[160px]">Gallery Images</th>
                <th className="border p-2 min-w-[150px]">Name</th>
                <th className="border p-2 min-w-[180px]">Subcategory</th>
                <th className="border p-2 min-w-[90px]">From Price</th>
                <th className="border p-2 min-w-[90px]">To Price</th>
                <th className="border p-2 min-w-[140px]">Link</th>
                <th className="border p-2 min-w-[160px]">Package</th>
                <th className="border p-2 min-w-[160px]">Notes</th>
                <th className="border p-2 min-w-[80px]">Active</th>
                <th className="border p-2 min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-blue-50/30 transition-colors">
                    
                    {/* Cover Image Cell */}
                    <td className="border p-1.5 align-middle">
                      <div className="flex flex-col items-center gap-1">
                        {vendor.coverImage ? (
                          <div className="relative h-12 w-12 group overflow-hidden rounded border border-gray-200">
                            <Image src={vendor.coverImage} alt="Cover" fill className="object-cover" />
                            <button
                              onClick={() => updateCoverImage(vendor, "")}
                              className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <CldUploadWidget
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset"}
                            onSuccess={(result: any) => {
                              if (result.info && result.info.secure_url) {
                                updateCoverImage(vendor, result.info.secure_url);
                              }
                            }}
                          >
                            {({ open }) => (
                              <button
                                onClick={() => open()}
                                className="h-10 w-12 border border-dashed border-gray-300 rounded text-gray-400 hover:text-secondary hover:border-secondary flex items-center justify-center text-xs font-semibold"
                                title="Upload Cover Image"
                              >
                                + Cover
                              </button>
                            )}
                          </CldUploadWidget>
                        )}
                      </div>
                    </td>

                    {/* Gallery Images Cell */}
                    <td className="border p-1.5 align-middle">
                      <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                        {(vendor.images || []).map((img, idx) => (
                          <div key={idx} className="relative h-9 w-9 group overflow-hidden rounded border border-gray-200">
                            <Image src={img} alt={`Img ${idx}`} fill className="object-cover" />
                            <button
                              onClick={() => removeImageFromVendor(vendor, idx)}
                              className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <CldUploadWidget
                          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset"}
                          onSuccess={(result: any) => {
                            if (result.info && result.info.secure_url) {
                              addImageToVendor(vendor, result.info.secure_url);
                            }
                          }}
                        >
                          {({ open }) => (
                            <button
                              onClick={() => open()}
                              className="h-9 w-9 border border-dashed border-gray-300 rounded text-gray-400 hover:text-secondary hover:border-secondary flex items-center justify-center text-xs font-bold"
                              title="Add Gallery Image"
                            >
                              +
                            </button>
                          )}
                        </CldUploadWidget>
                      </div>
                    </td>

                    {/* Name Cell */}
                    <td className="border p-1 align-middle">
                      <input
                        type="text"
                        value={vendor.name || ""}
                        onChange={(e) => handleCellChange(vendor._id, "name", e.target.value)}
                        onBlur={() => saveVendorRow(vendor)}
                        onKeyDown={(e) => e.key === "Enter" && saveVendorRow(vendor)}
                        className="w-full bg-transparent p-1 font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary rounded"
                      />
                    </td>

                    {/* Subcategory Cell */}
                    <td className="border p-1 align-middle">
                      <select
                        value={vendor.subCategoryID?._id || ""}
                        onChange={(e) => handleSubCategoryChange(vendor, e.target.value)}
                        className="w-full bg-transparent p-1 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary rounded"
                      >
                        <option value="" disabled>Select Subcategory</option>
                        {allSubCategories.map((sub) => (
                          <option key={sub._id} value={sub._id}>
                            {sub.categoryID?.categoryName ? `${sub.categoryID.categoryName} > ` : ""}{sub.subCategoryName}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* From Price Cell */}
                    <td className="border p-1 align-middle">
                      <input
                        type="number"
                        value={vendor.fromPrice ?? ""}
                        placeholder="0"
                        onChange={(e) => handleCellChange(vendor._id, "fromPrice", e.target.value === "" ? undefined : Number(e.target.value))}
                        onBlur={() => saveVendorRow(vendor)}
                        onKeyDown={(e) => e.key === "Enter" && saveVendorRow(vendor)}
                        className="w-full bg-transparent p-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary rounded"
                      />
                    </td>

                    {/* To Price Cell */}
                    <td className="border p-1 align-middle">
                      <input
                        type="number"
                        value={vendor.toPrice ?? ""}
                        placeholder="0"
                        onChange={(e) => handleCellChange(vendor._id, "toPrice", e.target.value === "" ? undefined : Number(e.target.value))}
                        onBlur={() => saveVendorRow(vendor)}
                        onKeyDown={(e) => e.key === "Enter" && saveVendorRow(vendor)}
                        className="w-full bg-transparent p-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary rounded"
                      />
                    </td>

                    {/* Link Cell */}
                    <td className="border p-1 align-middle">
                      <input
                        type="text"
                        value={vendor.link || ""}
                        placeholder="http://..."
                        onChange={(e) => handleCellChange(vendor._id, "link", e.target.value)}
                        onBlur={() => saveVendorRow(vendor)}
                        onKeyDown={(e) => e.key === "Enter" && saveVendorRow(vendor)}
                        className="w-full bg-transparent p-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary rounded text-blue-600 truncate"
                      />
                    </td>

                    {/* Package Cell */}
                    <td className="border p-1 align-middle">
                      <textarea
                        rows={1}
                        value={vendor.package || ""}
                        placeholder="Package info..."
                        onChange={(e) => handleCellChange(vendor._id, "package", e.target.value)}
                        onBlur={() => saveVendorRow(vendor)}
                        className="w-full bg-transparent p-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary rounded resize-none"
                      />
                    </td>

                    {/* Notes Cell */}
                    <td className="border p-1 align-middle">
                      <textarea
                        rows={1}
                        value={vendor.notes || ""}
                        placeholder="Notes..."
                        onChange={(e) => handleCellChange(vendor._id, "notes", e.target.value)}
                        onBlur={() => saveVendorRow(vendor)}
                        className="w-full bg-transparent p-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary rounded resize-none"
                      />
                    </td>

                    {/* Active Cell */}
                    <td className="border p-1 align-middle text-center">
                      <input
                        type="checkbox"
                        checked={vendor.active !== false}
                        onChange={(e) => {
                          const updated = { ...vendor, active: e.target.checked };
                          setVendors((prev) => prev.map((v) => (v._id === vendor._id ? updated : v)));
                          saveVendorRow(updated);
                        }}
                        className="h-4 w-4 rounded accent-secondary cursor-pointer"
                      />
                    </td>

                    {/* Actions Cell */}
                    <td className="border p-2 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        {savingVendorId === vendor._id ? (
                          <span className="text-[10px] text-gray-400 font-semibold animate-pulse">Saving...</span>
                        ) : (
                          <>
                            <button
                              onClick={() => openModal("edit", vendor)}
                              className="text-blue-600 hover:underline font-medium"
                              title="Full Modal Edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openModal("delete", vendor)}
                              className="text-red-600 hover:underline font-medium"
                              title="Delete Vendor"
                            >
                              Del
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-gray-500">No vendors found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {modalType && (
          <VendorModal
            type={modalType}
            vendor={selectedVendor}
            closeModal={() => setModalType(null)}
            refreshData={fetchVendors}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default WeddingPlanningVendorsPage;

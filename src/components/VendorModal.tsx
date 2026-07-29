import React, { useEffect, useState } from "react";
import axios from "axios";
import { Category, SubCategory, WeddingPlanningVendor } from "@/interfaces/interfaces";
import { CldImage, CldUploadWidget } from "next-cloudinary";

interface Props {
  type: "edit" | "delete" | "add";
  vendor?: WeddingPlanningVendor;
  closeModal: () => void;
  refreshData: () => void;
}

const VendorModal = ({ type, vendor, closeModal, refreshData }: Props) => {
  const initialSubs: SubCategory[] = Array.isArray(vendor?.subCategoryID)
    ? vendor.subCategoryID
    : vendor?.subCategoryID
      ? [vendor.subCategoryID as any]
      : [];

  const [name, setName] = useState(vendor?.name || "");
  const [fromPrice, setFromPrice] = useState<number | "">(vendor?.fromPrice !== undefined ? vendor.fromPrice : "");
  const [toPrice, setToPrice] = useState<number | "">(vendor?.toPrice !== undefined ? vendor.toPrice : "");
  const [links, setLinks] = useState<string[]>(
    Array.isArray(vendor?.link) ? vendor.link : vendor?.link ? [vendor.link] : [""]
  );
  const [images, setImages] = useState<string[]>(vendor?.images || []);
  const [coverImage, setCoverImage] = useState<string>(vendor?.coverImage || "");
  const [packageName, setPackageName] = useState(vendor?.package || "");
  const [notes, setNotes] = useState(vendor?.notes || "");
  const [selectedSubCategories, setSelectedSubCategories] = useState<SubCategory[]>(initialSubs);
  const [active, setActive] = useState(vendor?.active !== false);
  const [request, setRequest] = useState<boolean>(vendor?.request !== undefined ? vendor.request : false);
  const [requestStatus, setRequestStatus] = useState<string>(vendor?.requestStatus || "Approved");
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [previewCover, setPreviewCover] = useState<boolean>(false);

  useEffect(() => {
    if (activeImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
      } else if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      } else if (e.key === "Escape") {
        setActiveImageIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, images.length]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialSubs[0]?.categoryID?._id || ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWeddingCategories = async () => {
      try {
        const res = await axios.get("/api/categories?type=wedding-planning");
        setCategories(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWeddingCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const fetchSubCategories = async () => {
        try {
          const res = await axios.get(`/api/subcategories?categoryID=${selectedCategory}`);
          setSubCategories(res.data.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchSubCategories();
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory]);

  const handleAddSubCategory = (subId: string) => {
    if (!subId) return;
    if (selectedSubCategories.some(sc => sc._id === subId)) return;
    const sub = subCategories.find(s => s._id === subId);
    if (sub) {
      setSelectedSubCategories([...selectedSubCategories, sub]);
    }
  };

  const handleRemoveSubCategory = (subId: string) => {
    setSelectedSubCategories(selectedSubCategories.filter(sc => sc._id !== subId));
  };

  const handleSave = async () => {
    setLoading(true);
    const data = {
      name,
      fromPrice: fromPrice !== "" ? Number(fromPrice) : undefined,
      toPrice: toPrice !== "" ? Number(toPrice) : undefined,
      link: links.map(l => l.trim()).filter(Boolean),
      images,
      coverImage: coverImage || undefined,
      package: packageName,
      notes,
      subCategoryID: selectedSubCategories.map(sc => sc._id),
      active,
      request,
      requestStatus,
    };

    try {
      if (type === "edit") {
        await axios.put(`/api/wedding-planning-vendors?vendorID=${vendor?._id}`, data);
      } else if (type === "add") {
        await axios.post("/api/wedding-planning-vendors", data);
      }
      refreshData();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete("/api/wedding-planning-vendors", {
        data: { vendorID: vendor?._id },
      });
      refreshData();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[95vh] w-full max-w-2xl overflow-y-scroll rounded-2xl bg-white p-6"
      >
        <h2 className="mb-4 text-xl font-bold">
          {type === "edit" ? "Edit Vendor" : type === "add" ? "Add Vendor" : "Delete Vendor"}
        </h2>

        {type === "delete" ? (
          <div>
            <p className="mb-4">Are you sure you want to delete <strong>{vendor?.name}</strong>?</p>
            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="rounded-2xl border px-4 py-2">Cancel</button>
              <button onClick={handleDelete} className="rounded-2xl bg-red-600 px-4 py-2 text-white" disabled={loading}>Delete</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Links</label>
                <div className="space-y-2">
                  {links.map((lnk, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={lnk}
                        onChange={(e) => {
                          const newLinks = [...links];
                          newLinks[idx] = e.target.value;
                          setLinks(newLinks);
                        }}
                        className="w-full rounded border px-3 py-2 text-sm"
                        placeholder="https://..."
                      />
                      {links.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLinks([...links, ""])}
                    className="text-secondary text-xs font-bold transition-opacity hover:opacity-85 block"
                  >
                    + Add Another Link
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">From Price (EGP)</label>
                <input
                  type="number"
                  value={fromPrice}
                  onChange={(e) => setFromPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="e.g. 500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">To Price (EGP)</label>
                <input
                  type="number"
                  value={toPrice}
                  onChange={(e) => setToPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="e.g. 1500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Add Subcategory</label>
                <select
                  value=""
                  onChange={(e) => handleAddSubCategory(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  disabled={!selectedCategory}
                >
                  <option value="">Select Subcategory to Add</option>
                  {subCategories.map((sub) => (
                    <option key={sub._id} value={sub._id}>{sub.subCategoryName}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="vendorActive"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  <label htmlFor="vendorActive" className="text-sm font-medium">Active</label>
                </div>
              </div>
            </div>

            {request && (
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Request Status</label>
                  <select
                    value={requestStatus}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRequestStatus(val);
                      if (val === "Approved") {
                        setActive(true);
                      } else {
                        setActive(false);
                      }
                    }}
                    className="w-full rounded border px-3 py-2 text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            )}

            {/* Selected Subcategories Chips */}
            {selectedSubCategories.length > 0 && (
              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Selected Subcategories</label>
                <div className="flex flex-wrap gap-2">
                  {selectedSubCategories.map((sub) => (
                    <div
                      key={sub._id}
                      className="flex items-center gap-1.5 bg-secondary/15 text-secondary text-xs font-semibold px-2.5 py-1 rounded-full border border-secondary/25"
                    >
                      <span>{sub.subCategoryName} ({sub.categoryID?.categoryName || "N/A"})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubCategory(sub._id)}
                        className="font-bold text-secondary hover:text-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Package (String) */}
            <div>
              <label className="mb-1 block text-sm font-medium">Package</label>
              <textarea
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                rows={4}
                placeholder="Enter package details..."
              />
            </div>

            {/* Notes (String) */}
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                rows={3}
                placeholder="Enter additional notes..."
              />
            </div>

            {/* Cover Image Upload (Cloudinary) */}
            <div className="border-t pt-4">
              <label className="mb-2 block text-sm font-medium">Cover Image</label>
              <div className="flex items-start gap-4">
                {coverImage ? (
                  <div className="relative h-28 w-48 group rounded overflow-hidden border bg-gray-50 cursor-pointer">
                    <div onClick={() => setPreviewCover(true)} className="w-full h-full">
                      <CldImage
                        width="400"
                        height="240"
                        src={coverImage}
                        alt="Cover Image"
                        className="object-cover w-full h-full hover:scale-102 transition-transform"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverImage("");
                      }}
                      className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity shadow"
                      title="Remove Cover Image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-28 w-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset"}
                      onSuccess={(result: any) => {
                        if (result.info && result.info.secure_url) {
                          setCoverImage(result.info.secure_url);
                        }
                      }}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="h-full w-full flex flex-col items-center justify-center text-gray-400 text-xs"
                        >
                          <span className="text-xl">+</span>
                          <span>Upload Cover Image</span>
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                )}
              </div>
            </div>

            {/* Cloudinary Images */}
            <div className="border-t pt-4">
              <label className="mb-2 block text-sm font-medium">Gallery Images </label>
              <div className="flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative h-20 w-20 group rounded overflow-hidden border bg-gray-50 cursor-pointer">
                    <div onClick={() => setActiveImageIndex(index)} className="w-full h-full">
                      <CldImage
                        width="200"
                        height="200"
                        src={img}
                        alt="Vendor Image"
                        className="object-cover w-full h-full hover:scale-105 transition-transform"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity shadow"
                      title="Remove Image"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <CldUploadWidget
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset"}
                    onSuccess={(result: any) => {
                      if (result.info && result.info.secure_url) {
                        setImages((prev) => [...prev, result.info.secure_url]);
                      }
                    }}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="h-full w-full flex items-center justify-center text-gray-400 text-2xl"
                        title="Upload Image"
                      >
                        +
                      </button>
                    )}
                  </CldUploadWidget>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button onClick={closeModal} className="rounded-2xl border px-4 py-2 text-sm font-medium">Cancel</button>
              <button
                onClick={handleSave}
                className="rounded-2xl bg-secondary px-8 py-2 text-creamey text-sm font-bold"
                disabled={loading}
              >
                {loading ? "Saving..." : type === "edit" ? "Update Vendor" : "Add Vendor"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox for Gallery Images */}
      {activeImageIndex !== null && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/95 select-none"
          onClick={() => setActiveImageIndex(null)}
        >
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white text-4xl font-light hover:opacity-75 transition-opacity z-[999999] p-2"
            title="Close"
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0));
              }}
              className="absolute left-4 md:left-10 text-white text-5xl hover:opacity-75 transition-opacity bg-black/40 w-14 h-14 rounded-full flex items-center justify-center z-[999999] cursor-pointer"
              title="Previous"
            >
              ‹
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[85vw] max-h-[80vh] flex flex-col items-center justify-center"
          >
            <img
              src={images[activeImageIndex]}
              alt={`Gallery Image ${activeImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl"
            />
            <div className="absolute bottom-[-2.5rem] text-white/80 text-sm font-medium">
              {activeImageIndex + 1} / {images.length}
            </div>
          </div>

          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
              }}
              className="absolute right-4 md:right-10 text-white text-5xl hover:opacity-75 transition-opacity bg-black/40 w-14 h-14 rounded-full flex items-center justify-center z-[999999] cursor-pointer"
              title="Next"
            >
              ›
            </button>
          )}
        </div>
      )}

      {/* Lightbox for Cover Image */}
      {previewCover && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/95 select-none"
          onClick={() => setPreviewCover(false)}
        >
          <button
            onClick={() => setPreviewCover(false)}
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white text-4xl font-light hover:opacity-75 z-[999999] p-2"
            title="Close"
          >
            ×
          </button>
          <img
            src={coverImage}
            alt="Cover Image Preview"
            className="max-w-[85vw] max-h-[80vh] object-contain rounded shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default VendorModal;

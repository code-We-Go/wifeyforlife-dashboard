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
  const [name, setName] = useState(vendor?.name || "");
  const [price, setPrice] = useState(vendor?.price || "");
  const [link, setLink] = useState(vendor?.link || "");
  const [images, setImages] = useState<string[]>(vendor?.images || []);
  const [packageName, setPackageName] = useState(vendor?.package || "");
  const [notes, setNotes] = useState(vendor?.notes || "");
  const [subCategoryID, setSubCategoryID] = useState(vendor?.subCategoryID?._id || "");
  const [active, setActive] = useState(vendor?.active !== false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(vendor?.subCategoryID?.categoryID?._id || "");
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

  const handleSave = async () => {
    setLoading(true);
    const data = {
      name,
      price,
      link,
      images,
      package: packageName,
      notes,
      subCategoryID,
      active,
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
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Link</label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Price</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="e.g. 500 EGP"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded border px-3 py-2"
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
                <label className="mb-1 block text-sm font-medium">Subcategory</label>
                <select
                  value={subCategoryID}
                  onChange={(e) => setSubCategoryID(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  disabled={!selectedCategory}
                >
                  <option value="">Select Subcategory</option>
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

            {/* Cloudinary Images */}
            <div>
              <label className="mb-2 block text-sm font-medium">Images (Cloudinary)</label>
              <div className="mb-4 flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative h-20 w-20 group rounded overflow-hidden border">
                    <CldImage
                      width="200"
                      height="200"
                      src={img}
                      alt="Vendor Image"
                      className="object-cover w-full h-full"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
                    >
                      Remove
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
    </div>
  );
};

export default VendorModal;

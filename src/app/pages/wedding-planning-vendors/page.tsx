"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { WeddingPlanningVendor, Category, SubCategory } from "@/interfaces/interfaces";
import VendorModal from "@/components/VendorModal";
import { thirdFont } from "@/app/lib/fonts";

const WeddingPlanningVendorsPage = () => {
  const [vendors, setVendors] = useState<WeddingPlanningVendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  
  const [filterCategoryID, setFilterCategoryID] = useState<string>("all");
  const [filterSubCategoryID, setFilterSubCategoryID] = useState<string>("all");
  
  const [modalType, setModalType] = useState<"edit" | "delete" | "add" | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<WeddingPlanningVendor | undefined>(undefined);

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
      const res = await axios.get("/api/categories?type=wedding-planning");
      setCategories(res.data.data);
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
  }, []);

  useEffect(() => {
    fetchSubCategories(filterCategoryID);
    setFilterSubCategoryID("all");
  }, [filterCategoryID]);

  const openModal = (type: "edit" | "delete" | "add", vendor?: WeddingPlanningVendor) => {
    setSelectedVendor(vendor);
    setModalType(type);
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        
        <div className="flex w-[97%] flex-col gap-4 md:flex-row md:items-center md:justify-between text-primary">
          <h1 className={`${thirdFont.className} text-3xl font-bold text-secondary`}>
            Wedding Planning Vendors
          </h1>
          <button
            className="rounded-2xl bg-secondary px-6 py-2 text-sm text-creamey"
            onClick={() => openModal("add")}
          >
            ADD NEW VENDOR
          </button>
        </div>

        {/* Filters */}
        <div className="flex w-[97%] flex-wrap gap-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Category:</span>
            <select
              value={filterCategoryID}
              onChange={(e) => setFilterCategoryID(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-secondary"
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
              className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-secondary"
              disabled={filterCategoryID === "all"}
            >
              <option value="all">All Subcategories</option>
              {subCategories.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.subCategoryName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="w-[97%] overflow-x-auto">
          <table className="w-full rounded border border-gray-300 text-left">
            <thead className="bg-secondary text-creamey text-sm">
              <tr>
                <th className="border p-2">Image</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Category / Sub</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Package</th>
                <th className="border p-2">Active</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor._id} className="text-sm hover:bg-gray-50">
                    <td className="border p-2">
                      {vendor.images && vendor.images.length > 0 ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded">
                          <Image src={vendor.images[0]} alt={vendor.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No Image</span>
                      )}
                    </td>
                    <td className="border p-2 font-medium">{vendor.name}</td>
                    <td className="border p-2 text-xs">
                      <div className="font-semibold text-secondary">
                        {vendor.subCategoryID?.categoryID?.categoryName || "N/A"}
                      </div>
                      <div className="text-gray-500">
                        {vendor.subCategoryID?.subCategoryName || "N/A"}
                      </div>
                    </td>
                    <td className="border p-2 text-xs">
                      {vendor.price || "N/A"}
                    </td>
                    <td className="border p-2 text-xs">
                        <div className="max-w-[150px] truncate">
                            {vendor.package || "N/A"}
                        </div>
                    </td>
                    <td className="border p-2">
                      <span className={`rounded px-2 py-1 text-xs ${vendor.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {vendor.active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="space-x-2 border p-2 text-xs">
                      <button onClick={() => openModal("edit", vendor)} className="text-blue-600 underline">Edit</button>
                      <button onClick={() => openModal("delete", vendor)} className="text-red-600 underline">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">No vendors found.</td>
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

"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { WeddingPlanningVendor, Category, SubCategory } from "@/interfaces/interfaces";
import VendorModal from "@/components/VendorModal";
import { thirdFont } from "@/app/lib/fonts";
import * as XLSX from "xlsx";

const WeddingPlanningVendorsPage = () => {
  const [vendors, setVendors] = useState<WeddingPlanningVendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  
  const [filterCategoryID, setFilterCategoryID] = useState<string>("all");
  const [filterSubCategoryID, setFilterSubCategoryID] = useState<string>("all");
  const [searchName, setSearchName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"vendors" | "requests">("vendors");

  const updateRequestStatus = async (id: string, status: "Approved" | "Rejected" | "Archived") => {
    try {
      await axios.put(`/api/wedding-planning-vendors?vendorID=${id}`, {
        requestStatus: status,
        active: status === "Approved"
      });
      fetchVendors();
    } catch (err) {
      console.error("Error updating request status:", err);
    }
  };

  const handleApproveAll = async (mode: "all" | "pending") => {
    const confirmMsg = mode === "pending"
      ? "Are you sure you want to approve and activate all pending requests?"
      : "Are you sure you want to approve and activate all vendors in the database?";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await axios.patch(`/api/wedding-planning-vendors?mode=${mode}`);
      alert(res.data.message);
      fetchVendors();
    } catch (err: any) {
      alert("Failed to update vendors: " + (err.response?.data?.error || err.message));
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    vendor && vendor.name && vendor.name.toLowerCase().includes(searchName.toLowerCase())
  );

  const managedVendors = filteredVendors.filter(v => v && (v.request === false || !v.request || v.requestStatus === "Approved"));
  const requestVendors = filteredVendors.filter(v => v && v.request === true && v.requestStatus === "Pending");
  const displayVendors = activeTab === "vendors" ? managedVendors : requestVendors;

  const vendorsCount = vendors.filter(v => v && (v.request === false || !v.request || v.requestStatus === "Approved")).length;
  const pendingCount = vendors.filter(v => v && v.request === true && v.requestStatus === "Pending").length;
  
  const [modalType, setModalType] = useState<"edit" | "delete" | "add" | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<WeddingPlanningVendor | undefined>(undefined);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ message: string; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ── Export to Excel ──
  const exportToExcel = () => {
    const exportData = vendors.map((vendor) => {
      const subCategoryIDs = Array.isArray(vendor.subCategoryID)
        ? vendor.subCategoryID.map(sc => sc?._id).filter(Boolean).join(", ")
        : (vendor.subCategoryID as any)?._id || "";
      const subCategoryNames = Array.isArray(vendor.subCategoryID)
        ? vendor.subCategoryID.map(sc => sc?.subCategoryName).filter(Boolean).join(", ")
        : (vendor.subCategoryID as any)?.subCategoryName || "";
      const categoryNames = Array.isArray(vendor.subCategoryID)
        ? Array.from(new Set(vendor.subCategoryID.map(sc => sc?.categoryID?.categoryName).filter(Boolean))).join(", ")
        : (vendor.subCategoryID as any)?.categoryID?.categoryName || "";

      return {
        name: vendor.name,
        fromPrice: vendor.fromPrice || "",
        toPrice: vendor.toPrice || "",
        link: Array.isArray(vendor.link) ? vendor.link.join(", ") : vendor.link || "",
        package: vendor.package || "",
        notes: vendor.notes || "",
        subCategoryID: subCategoryIDs,
        subCategoryName: subCategoryNames,
        categoryName: categoryNames,
        images: vendor.images?.join(", ") || "",
        coverImage: vendor.coverImage || "",
        active: vendor.active ? "true" : "false",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");
    XLSX.writeFile(workbook, "wedding-planning-vendors.xlsx");
  };

  // ── Import from Excel ──
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

      // Map Excel columns to vendor fields
      const vendors = jsonData.map((row) => ({
        name: row["name"] || row["Name"] || "",
        price: row["price"] || row["Price"] || "",
        fromPrice: row["fromPrice"] || row["FromPrice"] || row["fromprice"] || "",
        toPrice: row["toPrice"] || row["ToPrice"] || row["toprice"] || "",
        link: row["link"] || row["Link"] || "",
        package: row["package"] || row["Package"] || "",
        notes: row["notes"] || row["Notes"] || "",
        subCategoryID: row["subCategoryID"] || row["SubCategoryID"] || row["subcategoryid"] || "",
        images: row["images"] || row["Images"] || "",
        coverImage: row["coverImage"] || row["CoverImage"] || row["coverimage"] || "",
        active: row["active"] || row["Active"] || "true",
      }));

      const res = await axios.post("/api/wedding-planning-vendors/import", { vendors });
      setImportResult({
        message: res.data.message,
        errors: res.data.errors || [],
      });
      fetchVendors();
    } catch (err: any) {
      setImportResult({
        message: "Import failed: " + (err.response?.data?.error || err.message),
        errors: [],
      });
    } finally {
      setImporting(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        
        <div className="flex w-[97%] flex-col gap-4 md:flex-row md:items-center md:justify-between text-primary">
          <h1 className={`${thirdFont.className} text-3xl font-bold text-secondary`}>
            Wedding Planning Vendors
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-2xl bg-green-700 px-5 py-2 text-sm text-white transition-opacity hover:opacity-90"
              onClick={exportToExcel}
              title="Export current vendors to Excel"
            >
              ↓ Export Excel
            </button>
            <button
              className="rounded-2xl bg-blue-700 px-5 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              onClick={handleImportClick}
              disabled={importing}
              title="Import vendors from an Excel file"
            >
              {importing ? "Importing…" : "↑ Import Excel"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              className="rounded-2xl bg-secondary px-6 py-2 text-sm text-creamey"
              onClick={() => openModal("add")}
            >
              ADD NEW VENDOR
            </button>
          </div>
        </div>

        {/* Import Result Banner */}
        {importResult && (
          <div className={`w-[97%] rounded-lg p-4 text-sm ${importResult.errors.length > 0 ? "bg-yellow-50 border border-yellow-300 text-yellow-800" : "bg-green-50 border border-green-300 text-green-800"}`}>
            <div className="flex items-center justify-between">
              <p className="font-semibold">{importResult.message}</p>
              <button
                onClick={() => setImportResult(null)}
                className="ml-4 text-lg font-bold leading-none hover:opacity-70"
              >
                ×
              </button>
            </div>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs">
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 w-[97%] mt-2 mb-2">
          <button
            onClick={() => setActiveTab("vendors")}
            className={`py-2 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "vendors"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-500 hover:text-secondary"
            }`}
          >
            Manage Vendors ({vendorsCount})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`py-2 px-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "requests"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-500 hover:text-secondary"
            }`}
          >
            Website Requests
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white rounded-full text-[10px] font-bold px-1.5 py-0.5 min-w-4 h-4 flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="flex w-[97%] flex-wrap gap-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Search:</span>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search by name..."
              className="rounded border border-gray-300 px-3 py-1 text-sm outline-none focus:border-secondary"
            />
          </div>

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
                <th className="border p-2">{activeTab === "requests" ? "Request Status" : "Active"}</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {displayVendors.length > 0 ? (
                displayVendors.map((vendor) => (
                  <tr key={vendor._id} className="text-sm hover:bg-gray-50">
                    <td className="border p-2">
                      {vendor.coverImage ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded border border-secondary">
                          <Image src={vendor.coverImage} alt={vendor.name} fill className="object-cover" />
                        </div>
                      ) : vendor.images && vendor.images.length > 0 ? (
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
                        {Array.isArray(vendor.subCategoryID)
                          ? Array.from(
                              new Set(
                                vendor.subCategoryID
                                  .map((sc) => sc?.categoryID?.categoryName)
                                  .filter(Boolean)
                              )
                            ).join(", ") || "N/A"
                          : (vendor.subCategoryID as any)?.categoryID?.categoryName || "N/A"}
                      </div>
                      <div className="text-gray-500">
                        {Array.isArray(vendor.subCategoryID)
                          ? vendor.subCategoryID
                              .map((sc) => sc?.subCategoryName)
                              .filter(Boolean)
                              .join(", ") || "N/A"
                          : (vendor.subCategoryID as any)?.subCategoryName || "N/A"}
                      </div>
                    </td>
                    <td className="border p-2 text-xs">
                      {(() => {
                        if (vendor.fromPrice !== undefined && vendor.toPrice !== undefined) {
                          return `${vendor.fromPrice} - ${vendor.toPrice} EGP`;
                        } else if (vendor.fromPrice !== undefined) {
                          return `From ${vendor.fromPrice} EGP`;
                        } else if (vendor.toPrice !== undefined) {
                          return `Up to ${vendor.toPrice} EGP`;
                        }
                        return "N/A";
                      })()}
                    </td>
                    <td className="border p-2 text-xs">
                        <div className="max-w-[150px] truncate">
                            {vendor.package || "N/A"}
                        </div>
                    </td>
                    {activeTab === "requests" ? (
                      <td className="border p-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          vendor.requestStatus === "Approved" ? "bg-green-100 text-green-800" :
                          vendor.requestStatus === "Rejected" ? "bg-red-100 text-red-800" :
                          vendor.requestStatus === "Archived" ? "bg-gray-100 text-gray-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {vendor.requestStatus || "Pending"}
                        </span>
                      </td>
                    ) : (
                      <td className="border p-2">
                        <span className={`rounded px-2 py-1 text-xs ${vendor.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {vendor.active ? "Yes" : "No"}
                        </span>
                      </td>
                    )}
                    <td className="space-x-2 border p-2 text-xs whitespace-nowrap">
                      {activeTab === "requests" && (
                        <>
                          {vendor.requestStatus === "Pending" ? (
                            <>
                              <button onClick={() => updateRequestStatus(vendor._id, "Approved")} className="text-green-600 font-bold hover:underline mr-1">Approve</button>
                              <button onClick={() => updateRequestStatus(vendor._id, "Rejected")} className="text-red-600 font-bold hover:underline mr-1">Reject</button>
                              <button onClick={() => updateRequestStatus(vendor._id, "Archived")} className="text-gray-600 hover:underline mr-2">Archive</button>
                            </>
                          ) : (
                            <span className="text-gray-400 italic mr-2 text-[10px]">Processed</span>
                          )}
                        </>
                      )}
                      <button onClick={() => openModal("edit", vendor)} className="text-blue-600 underline mr-1">Edit</button>
                      <button onClick={() => openModal("delete", vendor)} className="text-red-600 underline">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">No vendors found.</td>
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

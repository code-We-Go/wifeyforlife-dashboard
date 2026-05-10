"use client";
import { thirdFont } from "@/app/lib/fonts";
import Image from "next/image";
import CategoryModal from "@/components/CategoryModal";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Category, SubCategory } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState } from "react";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<"categories" | "subcategories">("categories");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategoryID, setFilterCategoryID] = useState<string>("all");

  const [modalType, setModalType] = useState<
    "edit" | "delete" | "add" | "addSub" | "editSub" | "deleteSub" | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>({
    _id: "",
    categoryName: "",
    description: "",
    image: "",
    HomePage: false,
    active: true,
  });
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory>({
    _id: "",
    subCategoryName: "",
    description: "",
    image: "",
    HomePage: false,
    active: true,
    categoryID: {} as Category,
  });

  const fetchData = async () => {
    try {
      let categoriesUrl = `/api/categories?page=${page}`;
      if (filterType !== "all") {
        categoriesUrl += `&type=${filterType}`;
      }

      let subCategoriesUrl = `/api/subcategories`;
      if (filterCategoryID !== "all") {
        subCategoriesUrl += `?categoryID=${filterCategoryID}`;
      }

      const [categoriesRes, subCategoriesRes] = await Promise.all([
        axios.get(categoriesUrl),
        axios.get(subCategoriesUrl),
      ]);
      setCategories(categoriesRes.data.data);
      setTotalPages(categoriesRes.data.totalPages || 1);
      setSubCategories(subCategoriesRes.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filterType, filterCategoryID]);

  const openModal = (
    type: "edit" | "delete" | "add" | "addSub" | "editSub" | "deleteSub",
    category?: Category,
    subCategory?: SubCategory,
  ) => {
    setModalType(type);
    if (category) {
      setSelectedCategory(category);
    }
    if (subCategory) {
      setSelectedSubCategory(subCategory);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        
        {/* Header and Add Buttons */}
        <div className="flex w-[97%] flex-col gap-4 md:flex-row md:items-center md:justify-between text-primary">
          <div className="flex gap-4">
            <button
              className={`rounded-2xl border-[1px] px-6 py-2 text-sm transition-all ${
                activeTab === "categories"
                  ? "bg-secondary text-creamey"
                  : "bg-white text-secondary border-secondary"
              }`}
              onClick={() => setActiveTab("categories")}
            >
              CATEGORIES
            </button>
            <button
              className={`rounded-2xl border-[1px] px-6 py-2 text-sm transition-all ${
                activeTab === "subcategories"
                  ? "bg-secondary text-creamey"
                  : "bg-white text-secondary border-secondary"
              }`}
              onClick={() => setActiveTab("subcategories")}
            >
              SUBCATEGORIES
            </button>
          </div>

          <div className="flex gap-2">
            {activeTab === "categories" ? (
              <button
                className="rounded-2xl border-[1px] bg-secondary px-4 py-2 text-sm text-creamey"
                onClick={() => openModal("add")}
              >
                ADD NEW CATEGORY
              </button>
            ) : (
              <button
                className="rounded-2xl border-[1px] bg-secondary px-4 py-2 text-sm text-creamey"
                onClick={() => openModal("addSub")}
              >
                ADD NEW SUBCATEGORY
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex w-[97%] justify-start gap-4 py-2">
          {activeTab === "categories" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Filter by Type:</span>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-secondary"
              >
                <option value="all">All Types</option>
                <option value="product">Product</option>
                <option value="wedding-planning">Wedding Planning</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Filter by Category:</span>
              <select
                value={filterCategoryID}
                onChange={(e) => setFilterCategoryID(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-secondary"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Categories Tab Content */}
        {activeTab === "categories" && (
          <div className="w-[97%] text-center pt-4">
            <h2 className={`${thirdFont.className} text-secondary mb-4 text-3xl font-semibold`}>
              Categories
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full rounded border border-gray-300 text-left">
                <thead className="bg-secondary text-creamey text-sm">
                  <tr>
                    <th className="border p-2">#</th>
                    <th className="border p-2">Image</th>
                    <th className="border p-2">Home Page</th>
                    <th className="border p-2">Active</th>
                    <th className="border p-2">Category Name</th>
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {categories.length > 0 ? (
                    categories.map((category, index) => (
                      <tr key={category._id} className="text-sm hover:bg-gray-50">
                        <td className="border p-2">
                          {(page - 1) * 10 + index + 1}
                        </td>
                        <td className="border p-2">
                          {category.image || category.imageURL ? (
                            <div className="relative h-12 w-12 overflow-hidden rounded">
                              <Image
                                src={category.image || category.imageURL || ""}
                                alt={category.categoryName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-400">No Image</span>
                          )}
                        </td>
                        <td className="border p-2">
                          {category.HomePage ? (
                            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                              No
                            </span>
                          )}
                        </td>
                        <td className="border p-2">
                          {category.active !== false ? (
                            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                              No
                            </span>
                          )}
                        </td>
                        <td className="border p-2">{category.categoryName}</td>
                        <td className="border p-2">
                          <span className={`rounded px-2 py-1 text-xs ${category.type === "wedding-planning" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                            {category.type || "product"}
                          </span>
                        </td>
                        <td className="border p-2">{category.description}</td>
                        <td className="space-x-2 border p-2">
                          <button
                            onClick={() => openModal("edit", category)}
                            className="text-blue-600 underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openModal("delete", category)}
                            className="text-red-600 underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500">
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination (Only for Categories) */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-lg">
                Page {page} of {totalPages}
              </span>
              <button
                className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Subcategories Tab Content */}
        {activeTab === "subcategories" && (
          <div className="w-[97%] text-center pt-4">
            <h2 className={`${thirdFont.className} text-secondary mb-4 text-3xl font-semibold`}>
              Subcategories
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full rounded border border-gray-300 text-left">
                <thead className="bg-secondary text-creamey text-sm">
                  <tr>
                    <th className="border p-2">#</th>
                    <th className="border p-2">Image</th>
                    <th className="border p-2">Home Page</th>
                    <th className="border p-2">Active</th>
                    <th className="border p-2">Subcategory Name</th>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Category</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {subCategories.length > 0 ? (
                    subCategories.map((subCategory, index) => (
                      <tr key={subCategory._id} className="text-sm hover:bg-gray-50">
                        <td className="border p-2">{index + 1}</td>
                        <td className="border p-2">
                          {subCategory.image ? (
                            <div className="relative h-12 w-12 overflow-hidden rounded">
                              <Image
                                src={subCategory.image}
                                alt={subCategory.subCategoryName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-400">No Image</span>
                          )}
                        </td>
                        <td className="border p-2">
                          {subCategory.HomePage ? (
                            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                              No
                            </span>
                          )}
                        </td>
                        <td className="border p-2">
                          {subCategory.active ? (
                            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                              No
                            </span>
                          )}
                        </td>
                        <td className="border p-2">
                          {subCategory.subCategoryName}
                        </td>
                        <td className="border p-2">{subCategory.description}</td>
                        <td className="border p-2">
                          {subCategory?.categoryID?._id
                            ? categories.find(
                                (cat) => cat._id === subCategory.categoryID._id,
                              )?.categoryName || subCategory?.categoryID?.categoryName || "N/A"
                            : "Category Deleted"}
                        </td>
                        <td className="space-x-2 border p-2">
                          <button
                            onClick={() =>
                              openModal("editSub", undefined, subCategory)
                            }
                            className="text-blue-600 underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              openModal("deleteSub", undefined, subCategory)
                            }
                            className="text-red-600 underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500">
                        No subcategories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {modalType && (
          <CategoryModal
            type={modalType}
            category={selectedCategory}
            subCategory={selectedSubCategory}
            categories={categories}
            closeModal={() => {
              setModalType(null);
            }}
            refreshData={fetchData}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default CategoriesPage;

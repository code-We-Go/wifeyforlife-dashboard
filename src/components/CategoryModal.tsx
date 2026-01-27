import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import UploadCategoryImageButton from "./UploadCategoryImageButton";
import { Category, SubCategory } from "@/interfaces/interfaces";
import mongoose from "mongoose";

interface Props {
  type: "edit" | "delete" | "add" | "addSub" | "editSub" | "deleteSub";
  category?: Category;
  subCategory?: SubCategory;
  categories: Category[];
  closeModal: () => void;
  refreshData: () => void;
}

const CategoryModal = ({
  type,
  category,
  subCategory,
  categories,
  closeModal,
  refreshData,
}: Props) => {
  const [name, setName] = useState(
    category?.categoryName || subCategory?.subCategoryName || "",
  );
  const [description, setDescription] = useState(
    category?.description || subCategory?.description || "",
  );
  const [categoryID, setCategoryID] = useState(
    subCategory?.categoryID._id || "",
  );
  const [image, setImage] = useState(
    category?.image || category?.imageURL || subCategory?.image || ""
  );
  const [homePage, setHomePage] = useState(
    category?.HomePage || subCategory?.HomePage || false
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (type === "edit") {
        await axios.put(`/api/categories?categoryID=${category?._id}`, {
          categoryName: name,
          description: description,
          image: image,
          HomePage: homePage,
        });
      } else if (type === "editSub") {
        await axios.put(
          `/api/subcategories?subCategoryID=${subCategory?._id}`,
          {
            subCategoryName: name,
            description: description,
            categoryID: categoryID,
            image: image,
            HomePage: homePage,
          },
        );
      }
      refreshData();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      if (type === "add") {
        await axios.post(`/api/categories`, {
          categoryName: name,
          description: description,
          image: image,
          HomePage: homePage,
        });
      } else if (type === "addSub") {
        const categoryObjectId = new mongoose.Types.ObjectId(categoryID);
        await axios.post(`/api/subcategories`, {
          subCategoryName: name,
          description: description,
          categoryID: categoryObjectId,
          image: image,
          HomePage: homePage,
        });
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
      if (type === "delete") {
        await axios.delete(`/api/categories/`, {
          data: { categoryID: category?._id },
        });
      } else if (type === "deleteSub") {
        await axios.delete(`/api/subcategories/`, {
          data: { subCategoryID: subCategory?._id },
        });
      }
      refreshData();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "edit":
        return "Edit Category";
      case "add":
        return "Add Category";
      case "delete":
        return "Delete Category";
      case "editSub":
        return "Edit Subcategory";
      case "addSub":
        return "Add Subcategory";
      case "deleteSub":
        return "Delete Subcategory";
      default:
        return "";
    }
  };

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[95vh] overflow-y-scroll w-full max-w-lg rounded-2xl bg-white p-6"
      >
        <h2 className="mb-4 text-lg font-bold">{getTitle()}</h2>
        {type === "edit" ||
        type === "add" ||
        type === "editSub" ||
        type === "addSub" ? (
          <>
            <label className="mb-2 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-4 w-full rounded border px-3 py-2"
            />
            <label className="mb-2 block">Description</label>
            <textarea
              className="mb-4 w-full rounded border px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
             <label className="mb-2 block">Image</label>
             <div className="mb-4 flex flex-col items-center gap-4">
              {image && (
                <div className="relative h-40 w-40 overflow-hidden rounded-lg border">
                  <Image
                    src={image}
                    alt="Category Image"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <UploadCategoryImageButton
                imageUrl={image}
                updateImageUrl={(url) => setImage(url)}
              />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="homePage"
                checked={homePage}
                onChange={(e) => setHomePage(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="homePage" className="text-sm font-medium">Show on Home Page</label>
            </div>
            {(type === "editSub" || type === "addSub") && (
              <>
                <label className="mb-2 block">Category</label>
                <select
                  value={categoryID.toString()}
                  onChange={(e) => setCategoryID(e.target.value)}
                  className="mb-4 w-full rounded border px-3 py-2"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </>
            )}
            <button
              onClick={type.includes("edit") ? handleSave : handleAdd}
              disabled={loading}
              className="mr-2 rounded-2xl bg-accent px-4 py-2 text-white"
            >
              {type.includes("edit") ? "Save" : "Add"}
            </button>
          </>
        ) : (
          <>
            <p>
              Are you sure you want to delete{" "}
              <strong>
                {type === "delete"
                  ? category?.categoryName
                  : subCategory?.subCategoryName}
              </strong>
              ?
            </p>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="mt-4 rounded-2xl bg-red-600 px-4 py-2 text-white"
            >
              Delete
            </button>
          </>
        )}
        <button
          onClick={closeModal}
          className="ml-2 mt-4 rounded-2xl border-[1px] border-primary px-4 py-2 text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CategoryModal;

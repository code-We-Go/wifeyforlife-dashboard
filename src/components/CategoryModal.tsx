import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from "next/image";
import UploadProductsImagesButton from "./UploadProductImagesButton";
import { Category, SubCategory } from '@/interfaces/interfaces';

interface Props {
  type: 'edit' | 'delete' | 'add' | 'addSub' | 'editSub' | 'deleteSub';
  category?: Category;
  subCategory?: SubCategory;
  categories: Category[];
  closeModal: () => void;
  refreshData: () => void;
}

const CategoryModal = ({ type, category, subCategory, categories, closeModal, refreshData }: Props) => {
  const [name, setName] = useState(category?.categoryName || subCategory?.SubCategoryName || '');
  const [description, setDescription] = useState(category?.description || subCategory?.description || '');
  const [categoryID, setCategoryID] = useState(subCategory?.categoryID || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (type === 'edit') {
        await axios.put(`/api/categories?categoryID=${category?._id}`, {
          "categoryName": name,
          "description": description
        });
      } else if (type === 'editSub') {
        await axios.put(`/api/subcategories?subCategoryID=${subCategory?._id}`, {
          "SubCategoryName": name,
          "description": description,
          "categoryID": categoryID
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

  const handleAdd = async () => {
    setLoading(true);
    try {
      if (type === 'add') {
        await axios.post(`/api/categories`, {
          "categoryName": name,
          "description": description
        });
      } else if (type === 'addSub') {
        await axios.post(`/api/subcategories`, {
          "SubCategoryName": name,
          "description": description,
          "categoryID": categoryID
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
      if (type === 'delete') {
        await axios.delete(`/api/categories/`, {
          data: { categoryID: category?._id },
        });
      } else if (type === 'deleteSub') {
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
      case 'edit':
        return 'Edit Category';
      case 'add':
        return 'Add Category';
      case 'delete':
        return 'Delete Category';
      case 'editSub':
        return 'Edit Subcategory';
      case 'addSub':
        return 'Add Subcategory';
      case 'deleteSub':
        return 'Delete Subcategory';
      default:
        return '';
    }
  };

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-h-[95vh] w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">{getTitle()}</h2>
        {(type === 'edit' || type === 'add' || type === 'editSub' || type === 'addSub') ? (
          <>
            <label className="block mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            <label className="block mb-2">Description</label>
            <textarea
              className="w-full border px-3 py-2 rounded mb-4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {(type === 'editSub' || type === 'addSub') && (
              <>
                <label className="block mb-2">Category</label>
                <select
                  value={categoryID.toString()}
                  onChange={(e) => setCategoryID(e.target.value)}
                  className="w-full border px-3 py-2 rounded mb-4"
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
              onClick={type.includes('edit') ? handleSave : handleAdd}
              disabled={loading}
              className="bg-accent text-white px-4 py-2 rounded-2xl mr-2"
            >
              {type.includes('edit') ? 'Save' : 'Add'}
            </button>
          </>
        ) : (
          <>
            <p>Are you sure you want to delete <strong>{type === 'delete' ? category?.categoryName : subCategory?.SubCategoryName}</strong>?</p>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-2xl mt-4"
            >
              Delete
            </button>
          </>
        )}
        <button
          onClick={closeModal}
          className="ml-2 mt-4 text-primary rounded-2xl border-[1px] border-primary px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CategoryModal;

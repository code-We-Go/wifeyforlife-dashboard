'use client'
import CategoryModal from '@/components/CategoryModal';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { Category, SubCategory } from '@/interfaces/interfaces';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalType, setModalType] = useState<'edit' | 'delete' | 'add' | 'addSub' | 'editSub' | 'deleteSub' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>({ _id: '', categoryName: '', description: "", imageURL: "" });
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory>({ 
    _id: '', 
    SubCategoryName: '', 
    description: '',
    categoryID: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, subCategoriesRes] = await Promise.all([
          axios.get(`/api/categories`),
          axios.get(`/api/subcategories`)
        ]);
        setCategories(categoriesRes.data.data);
        setSubCategories(subCategoriesRes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [page]);

  const openModal = (type: 'edit' | 'delete' | 'add' | 'addSub' | 'editSub' | 'deleteSub', category?: Category, subCategory?: SubCategory) => {
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
      <div className="px-1 overflow-hidden md:px-2 py-2 md:py-4 w-full h-auto min-h-screen flex flex-col justify-start items-center gap-4 bg-backgroundColor">
        <div className="text-primary w-[97%] flex justify-between">
          <h3 className='hover:cursor-pointer' onClick={() => openModal('add')}>ADD NEW CATEGORY</h3>
          <h3 className='hover:cursor-pointer' onClick={() => openModal('addSub')}>ADD NEW SUBCATEGORY</h3>
        </div>

        {/* Categories Table */}
        {categories.length > 0 && (
          <div className="w-[97%]">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <table className="w-full text-left border border-gray-300 rounded">
              <thead className="bg-gray-100 text-sm">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Category Name</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category._id} className="hover:bg-gray-50 text-sm">
                    <td className="p-2 border">{(page - 1) * 10 + index + 1}</td>
                    <td className="p-2 border">{category.categoryName}</td>
                    <td className="p-2 border">{category.description}</td>
                    <td className="p-2 border space-x-2">
                      <button
                        onClick={() => openModal('edit', category)}
                        className="text-blue-600 underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openModal('delete', category)}
                        className="text-red-600 underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Subcategories Table */}
        {subCategories.length > 0 && (
          <div className="w-[97%] mt-8">
            <h2 className="text-xl font-semibold mb-4">Subcategories</h2>
            <table className="w-full text-left border border-gray-300 rounded">
              <thead className="bg-gray-100 text-sm">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Subcategory Name</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Category</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subCategories.map((subCategory, index) => (
                  <tr key={subCategory._id} className="hover:bg-gray-50 text-sm">
                    <td className="p-2 border">{(page - 1) * 10 + index + 1}</td>
                    <td className="p-2 border">{subCategory.SubCategoryName}</td>
                    <td className="p-2 border">{subCategory.description}</td>
                    <td className="p-2 border">
                      {categories.find(cat => cat._id === subCategory.categoryID)?.categoryName || 'N/A'}
                    </td>
                    <td className="p-2 border space-x-2">
                      <button
                        onClick={() => openModal('editSub', undefined, subCategory)}
                        className="text-blue-600 underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openModal('deleteSub', undefined, subCategory)}
                        className="text-red-600 underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center gap-4 mt-4">
          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-lg">Page {page} of {totalPages}</span>
          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>

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
            refreshData={() => {
              Promise.all([
                axios.get(`/api/categories?page=${page}`),
                axios.get(`/api/subcategories?page=${page}`)
              ]).then(([categoriesRes, subCategoriesRes]) => {
                setCategories(categoriesRes.data.data);
                setSubCategories(subCategoriesRes.data.data);
              });
            }}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default CategoriesPage;

'use client'
import CategoryModal from '@/components/CategoryModal';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { Category } from '@/interfaces/interfaces';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalType, setModalType] = useState<'edit' | 'delete' | 'add' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>({ _id: '', categoryName: '',description:"" });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`/api/categories`);
        setCategories(res.data.data);
        // setTotalPages(res.data.totalPages);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };
    fetchCategories();
  }, [page]);

  const openModal = (type: 'edit' | 'delete' | 'add', category?: Category) => {
    setModalType(type);
    setSelectedCategory(category || { _id: '', categoryName: '',description:""});
  };

  return (
    <DefaultLayout>
      <div className="px-1 overflow-hidden md:px-2 py-2 md:py-4 w-full h-auto min-h-screen flex flex-col justify-start items-center gap-4 bg-backgroundColor">
        <div
         
          className="text-primary w-[97%] flex justify-end underline"
        >
          <h3
          className='hover:cursor-pointer'
           onClick={() => openModal('add')}
          >ADD NEW CATEGORY</h3>
        </div>

        {/* Table */}
        {categories.length > 0 ? (
          <table className="w-[97%] text-left border border-gray-300 rounded">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Category Name</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={category._id} className="hover:bg-gray-50 text-sm">
                  <td className="p-2 border">{(page - 1) * 10 + index + 1}</td>
                  <td className="p-2 border">{category.categoryName}</td>
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
        ) : (
          <h1>No categories</h1>
        )}

        {/* Pagination */}
        <div className="flex items-center gap-4 mt-4">
          <button
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-lg">Page {page} of {totalPages}</span>
          <button
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
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
            closeModal={() => {
              setModalType(null);
            }}
            refreshCategories={() => {
              axios.get(`/api/categories?page=${page}`).then(res => {
                setCategories(res.data.data);
              });
            }}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default CategoriesPage;

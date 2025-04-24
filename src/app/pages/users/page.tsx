'use client'

import CollectionModal from '@/components/CategoryModal';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import NewSlettersModal from '@/components/NewSlettersModal';
import { Collection, Newsletters } from '@/interfaces/interfaces';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

const CategoriesPage = () => {
  const [newSletters, setNewSletters] = useState<Newsletters[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalType, setModalType] = useState<'edit' | 'delete' | 'add' | null>(null);
//   const [selectedCollection, setSelectedCollection] = useState<Collection>({ _id: '', collectionName: '' });
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletters>({ _id: '', name: '',number:"" });

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        const res = await axios.get(`/api/newSletters?page=${page}`);
        setNewSletters(res.data.data);
        setTotalPages(res.data.totalPages);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };
    fetchNewsletters();
  }, [page]);

  const openModal = (type: 'edit' | 'delete' | 'add', newSletter?: Newsletters) => {
    setModalType(type);
    setSelectedNewsletter(newSletter || { _id: '', name: '',number: ''});
  };

  return (
    <DefaultLayout>
      <div className="px-1 overflow-hidden md:px-2 py-2 md:py-4 w-full h-auto min-h-screen flex flex-col justify-start items-center gap-4 bg-backgroundColor">
        <div
          className="text-primary w-[97%] flex justify-end underline "
        >
          <h3
          className='hover:cursor-pointer'
          onClick={() => openModal('add')}
          >ADD NEWSLETTER</h3>
        </div>

        {/* Table */}
        {newSletters.length > 0 ? (
          <table className="w-[97%] text-left border border-gray-300 rounded">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Whatsapp</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {newSletters.map((newSletter, index) => (
                <tr key={index} className="hover:bg-gray-50 text-sm">
                  <td className="p-2 border">{(page - 1) * 10 + index + 1}</td>
                  <td className="p-2 border">{newSletter.name}</td>
                  <td className="p-2 border">{newSletter.number}</td>
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() => openModal('edit', newSletter)}
                      className="text-blue-600 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openModal('delete', newSletter)}
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
          <h1>No collections</h1>
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
          <NewSlettersModal
            type={modalType}
            newSletter={selectedNewsletter}
            closeModal={() => {
              setModalType(null);
            }}
            refreshNewsletters={() => {
              axios.get(`/api/newSletters?page=${page}`).then(res => {
                setNewSletters(res.data.data);
              });
            }}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default CategoriesPage;

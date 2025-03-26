import React, { useState } from 'react';
import axios from 'axios';
import { Collection } from '@/interfaces/interfaces';

interface Props {
  type: 'edit' | 'delete' | 'add';
  collection: Collection;
  closeModal: () => void;
  refreshCollections: () => void;
}

const CollectionModal = ({ type, collection, closeModal, refreshCollections }: Props) => {
  const [name, setName] = useState(collection.collectionName);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/collections?collectionID=${collection._id}`, {"collectionName": name });
      refreshCollections();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
const addNewCollection =async()=>{
    setLoading(true);
    try {
      await axios.post(`/api/collections`, { "collectionName": name });
      refreshCollections();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  
}
  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`/api/collections/`,{
        data: { collectionID: collection._id },
      });
      refreshCollections();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">
          {type === 'edit' ? 'Edit Collection' :type==='add'?'Add Collection': 'Delete Collection'}
        </h2>
        {type === 'edit' ? (
          <>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
              Save
            </button>
          </>
        ) :type==='add'?    
        <>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-4"
        />
        <button onClick={addNewCollection} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
          Add
        </button>
      </> :(
          <>
            <p>Are you sure you want to delete <strong>{collection.collectionName}</strong>?</p>
            <button onClick={handleDelete} disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded mt-4">
              Delete
            </button>
          </>
        )}
        <button onClick={closeModal} className="ml-2 mt-4 text-gray-600 underline">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CollectionModal;

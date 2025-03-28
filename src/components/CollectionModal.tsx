import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Collection, SubCollection } from '@/interfaces/interfaces';

interface Props {
  type: 'edit' | 'delete' | 'add';
  collection: Collection;
  closeModal: () => void;
  refreshCollections: () => void;
}

const CollectionModal = ({ type, collection, closeModal, refreshCollections }: Props) => {
  const [name, setName] = useState(collection.collectionName);
  const [description, setdescription] = useState(collection.description);
  const [loading, setLoading] = useState(false);
  const [subcollections,setSubCollections]=useState<SubCollection[]>([])

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/collections?collectionID=${collection._id}`, {"collectionName": name, "description":description});
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
  useEffect(() => {
    const fetchSubCollections = async () => {
      const res = await axios(`/api/subCollections?collectionID=${collection._id}`)
      setSubCollections(res.data)
    }
  fetchSubCollections();

  }, [])
  

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">
          {type === 'edit' ? 'Edit Collection' :type==='add'?'Add Collection': 'Delete Collection'}
        </h2>
        {type === 'edit' ? (
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

            value={description} onChange={(e)=>setdescription(e.target.value)}></textarea>

            <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
              Save
            </button>
          </>
        ) :type==='add'?    
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

            value={description} onChange={(e)=>setdescription(e.target.value)}></textarea>

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

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from "next/image";
import UploadProductsImagesButton from "./UploadProductImagesButton";

import { Category, Collection } from '@/interfaces/interfaces';

interface Props {
  type: 'edit' | 'delete' | 'add';
  category: Category 
  closeModal: () => void;
  refreshCategories: () => void;
}

const CategoryModal = ({ type, category, closeModal, refreshCategories }: Props) => {
 console.log(type)
  const [name, setName] = useState(category.categoryName);
  const [description, setdescription] = useState(category.description);
  const [loading, setLoading] = useState(false);
  // const [subcollections,setSubCollections]=useState<SubCollection[]>([])
 

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/categories?categoryID=${category._id}`, {"categoryName": name, "description":description});
      refreshCategories();
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
      await axios.post(`/api/categories`, { "categoryName": name ,"description":description });
      refreshCategories();
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
      await axios.delete(`/api/categories/`,{
        data: { categoryID: category._id },
      });
      refreshCategories();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div 
    onClick={closeModal}
    className="fixed inset-0 z-50 bg-black bg-opacity-50  flex justify-center items-center">
      <div onClick={(e)=>e.stopPropagation()} className="bg-white p-6 max-h-[95vh] overflow-y-scroll rounded w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">
          {type === 'edit' ? 'Edit Category' :type==='add'?'Add Category': 'Delete Category'}
        </h2>
        {(type === 'edit' || type === 'add') ?
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

<div>

</div>
            <button onClick={type === 'edit' ? handleSave:addNewCollection} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
              {type === 'edit' ? 'Save' : 'Add'}
            </button>
          </>
         :
          <>
            <p>Are you sure you want to delete <strong>{category.categoryName}</strong>?</p>
            <button onClick={handleDelete} disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded mt-4">
              Delete
            </button>
          </>
        }
        <button onClick={closeModal} className="ml-2 mt-4 text-gray-600 underline">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CategoryModal;

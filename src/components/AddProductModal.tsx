"use client";

import { AddProductType, Category, Product } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import ProductVariant from "./ProductVariant";

const AddProductModal = ({
  isModalOpen,
  setProducts,
  setModalOpen,
}: {
  isModalOpen: boolean;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const updateVariant = async (index: number, field: string, value: any) => {
        // Create a copy of the product with the updated variant
        const updatedVariations = [...productState.variations];
        updatedVariations[index] = {
          ...updatedVariations[index],
          [field]: value,
        };
        setProduct((prev)=>({...prev,variations:updatedVariations}))
    };
  const [productState, setProduct] = useState<AddProductType>({
    title: "",
    description: "",
    price: { local: 0 },
    comparePrice: 0,
    variations: [],
    categoryID: "",
    season: "all",
    productDimensions: [],
    productDetails: [],
    productCare: [],
  });

  const [errors, setErrors] = useState<any>({}); // For validation errors
const [categoryID,setCategoryID]=useState<string>(); 
  // Validation function
  const validate = () => {
    const newErrors: any = {};
    if (!productState.title) newErrors.title = "Title is required";
    if (!productState.description) newErrors.description = "Description is required";
    if (productState.price.local <= 0) newErrors.localPrice = "Local price must be greater than 0";
    if (productState.variations.length === 0) newErrors.variations = "At least one variation is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [categoris,setCategories]=useState<Category[]>([])
  
useEffect(() => {
  const fetchCategories = async()=>  {
    try{
      const res = await axios('/api/categories')
      if(res.status===200){
        setCategories(res.data.data)
setCategoryID(res.data.data[0]._id)
        updateField('categoryID', res.data.data[0]._id)
    }
  }
  catch(err){
    console.error(err)
  }
  }

  fetchCategories()
}, [])


  // Create Product Function
  const addProduct = async () => {
    if (!validate()) return; // If validation fails, do not submit

    try {
      const res = await axios.post("/api/products", productState);
      if (res.status === 200) {
          Swal.fire({
              background: "#FFFFF",

          color: "black",
          toast: false,
          iconColor: "#473728",
          position: "bottom-right",
          text: "PRODUCT HAS BEEN ADDED",
          showConfirmButton: false,
          timer: 2000,
          customClass: {
            popup: "no-rounded-corners small-popup",
          },
        });
        console.log('res' +JSON.stringify(res.data.data));
        setProducts((prev) => [...prev, res.data.data]);
        setModalOpen(false); // Close modal on success
      }
    } catch (error) {
      console.error("Error adding product:", error);
      Swal.fire({
        background: "#FFFFF",
        color: "black",
        toast: false,
        iconColor: "#473728",
        position: "bottom-right",
        text: "ERROR! Product could not be added.",
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: "no-rounded-corners small-popup",
        },
      });
    }
  };

  // Update product fields
  const updateField = (field: string, value: any) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  return (
    isModalOpen && (
      <div onClick={() => setModalOpen(false)} className="fixed inset-0 lg:pl-72.5 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div onClick={(e) => e.stopPropagation()} className="bg-white max-lg:mt-16 max-h-[90vh] overflow-y-scroll p-6 shadow-lg w-[90%] text-center">
          <h2 className="text-lg font-bold mb-4">ADD PRODUCT</h2>

          {/* Product Info */}
          <div className="text-left space-y-2">
            {/* Title */}
            <div>
              <label className="block font-semibold">Title:</label>
              <input
                type="text"
                value={productState.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="border p-2 w-full"
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold">Description:</label>
              <textarea
                value={productState.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="border p-2 w-full"
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>
            {/* collections */}
            <div>
              <label className="block font-semibold">Category:</label>
              <select
                value={categoryID}
                onChange={(e) => setCategoryID(e.target.value)}
                className="border p-2 w-full"
              >
                {categoris.map((category,index) => <option key={index} value={category._id}>{category.categoryName}</option>)}
                </select>
              {errors.collection && <p className="text-red-500 text-sm">{errors.collection}</p>}
            </div>
            <div>
            <label className="block font-semibold">Season:</label>
              <div className="flex gap-4">
              <div className='flex gap-2'>
                <label className="block font-semibold">Summer</label>
              <input type='radio' name='season' value='summer' checked={productState.season=== 'summer'} onChange={(e) => updateField("season", e.target.value)}></input>

              </div>
              <div className='flex gap-2'>
                <label className="block font-semibold">Winter</label>
              <input type='radio' name='season'checked={productState.season=== 'winter'} value='winter' onChange={(e) => updateField("season", e.target.value)}></input>

              </div>
              <div className='flex gap-2'>
                <label className="block font-semibold">All</label>
              <input type='radio' name='season' checked={productState.season=== 'all'} value='all' onChange={(e) => updateField("season", e.target.value)}></input>

              </div>
              </div>

              
              {errors.collection && <p className="text-red-500 text-sm">{errors.collection}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block font-semibold">Price  :</label>
              <input
                type="number"
                value={productState.price.local}
                onChange={(e) => updateField("price", { ...productState.price, local: parseFloat(e.target.value) })}
                className="border p-2 w-full"
              />
              {errors.localPrice && <p className="text-red-500 text-sm">{errors.localPrice}</p>}
            </div>

            {/* Compare Price */}
            <div>
              <label className="block font-semibold">Compare Price:</label>
              <input
                type="number"
                value={productState.comparePrice}
                onChange={(e) => updateField("comparePrice", parseFloat(e.target.value))}
                className="border p-2 w-full"
              />
            </div>

            {/* Product Variants */}
            <div>
              <label className="block font-semibold">Product Variants:</label>
              {productState.variations.map((variant, index) => (
                <ProductVariant key={index} index={index} product={{...productState,"_id":""}} variant={variant} updateVariant={updateVariant} onVariantChange={updateVariant} />
              ))}
              {errors.variations && <p className="text-red-500 text-sm">{errors.variations}</p>}
              <button onClick={() => updateField("variations", [...productState.variations, { color: "", size:"",stock: 0, featured: false, images: [] }])} className="underline text-primary px-4 py-2">
                Add Variant
              </button>
            </div>
{/* Product Details */}
<div>
  <label className="block font-semibold">Product Details:</label>
  {productState.productDetails.map((detail, index) => (
    <div key={index} className="flex items-center gap-2 mb-2">
      <input
        type="text"
        value={detail}
        onChange={(e) => {
          const newDetails = [...productState.productDetails];
          newDetails[index] = e.target.value;
          updateField("productDetails", newDetails);
        }}
        className="border p-2 w-full"
      />
      <span 
        className="cursor-pointer text-red-500" 
        onClick={() => {
          const newDetails = productState.productDetails.filter((_, i) => i !== index);
          updateField("productDetails", newDetails);
        }}
      >
        &#10006;
      </span>
    </div>
  ))}
  <button 
    onClick={() => updateField("productDetails", [...productState.productDetails, ""])} 
    className="underline text-primary px-4 py-2"
  >
    Add More
  </button>
</div>


{/* Product Care */}
{/* <div>
  <label className="block font-semibold">Product Care:</label>
  {productState.productCare.map((care, index) => (
    <div key={index} className="flex items-center gap-2 mb-2">
      <input
        type="text"
        value={care}
        onChange={(e) => {
          const newCare = [...productState.productCare];
          newCare[index] = e.target.value;
          updateField("productCare", newCare);
        }}
        className="border p-2 w-full"
      />
      <span 
        className="cursor-pointer text-red-500" 
        onClick={() => {
          const newCare = productState.productCare.filter((_, i) => i !== index);
          updateField("productCare", newCare);
        }}
      >
        &#10006;
      </span>
    </div>
  ))}
  <button 
    onClick={() => updateField("productCare", [...productState.productCare, ""])} 
    className="underline text-primary px-4 py-2"
  >
    Add More
  </button>
</div> */}
          </div>

          {/* Buttons */}
          <div className="flex justify-around mt-6">
            <button className="px-4 py-2 text-primary border-[1px] border-primary" onClick={addProduct}>
              Add Product
            </button>
            <button className="px-4 py-2 text-primary border-[1px] border-primary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default AddProductModal;

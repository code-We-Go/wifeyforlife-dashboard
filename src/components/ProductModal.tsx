import { Collection, Product, SubCollection } from '@/interfaces/interfaces';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import Swal from "sweetalert2";
import Image from "next/image";
import ProductVariant from "./ProductVariant";
import DeleteProductModal from './DeleteProductModal';

const ProductModal = ({isDetailsModalOpen,product,setProducts,setDetailsModal}:{isDetailsModalOpen:boolean,product:Product,
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
    setDetailsModal: React.Dispatch<React.SetStateAction<boolean>>
}) => {
    const [productState,setProduct]=useState<Product>(product)
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
     const [collections,setCollections]=useState<Collection[]>([])
     const [subCollections,setSubCollections]=useState<SubCollection[]>([])

   useEffect(() => {
     const fetchCollections = async()=>  {
       try{
         const res = await axios('/api/collections')
         if(res.status===200){
           setCollections(res.data.data)
         
       }
     }
     catch(err){
       console.error(err)
     }
     }
     fetchCollections()
   }, [])
   useEffect(() => {
    const fetchSubCollections = async()=>  {
     if(productState.collectionID){

       try{
         const res = await axios(`/api/subCollections?collectionID=${productState.collectionID}`)
         if(res.status===200){
           setSubCollections(res.data)
           console.log(res.data[0]._id)
   
           updateFeild('subCollectionID', res.data[0]._id)
       }
     }
     catch(err){
       console.error(err)
     }
     }
  
     }
    fetchSubCollections()
  }, [productState.collectionID])
  
    const updateFeild = async(field:string,value:any)=>{
        setProducts((prevProducts) =>
            prevProducts.map((p) =>
              p._id === product._id ? { ...p, [field]: value } : p
            )
          );
          setProduct((prev)=>({... prev , [field]: value}))
    }
      // Update Product Function
      const updateProduct = async () => {
          console.log('clicked')
        try {
          // Update local state optimistically
    
          // Send update request to backend
          console.log("update"+productState.productDetails)
          const updatedProduct = await axios.put(`/api/products?productID=${product._id}`,  productState );
    
          // Update state with the response from the backend
          setProducts((prevProducts) =>
            prevProducts.map((p) =>
              p._id === updatedProduct.data._id ? updatedProduct.data : p
            )
          );
    
          Swal.fire({
            background: '#FFFFF',
            color: 'black',
            toast: false,
            iconColor: '#473728',
            position: 'bottom-right',
            text: 'PRODUCT HAS BEEN UPDATED',
            showConfirmButton: false,
            timer: 2000,
            customClass: {
              popup: 'no-rounded-corners small-popup',
            },
          });
        } catch (error) {
          console.error("Error updating product:", error);
        
        }
      };
    
      // Update Variant Function
      const updateVariant = async (index: number, field: string, value: any) => {
          // Create a copy of the product with the updated variant
          const updatedVariations = [...product.variations];
          updatedVariations[index] = {
            ...updatedVariations[index],
            [field]: value,
          };
          setProduct((prev)=>({...prev,variations:updatedVariations}))
    
          // Update local state optimistically
          setProducts((prevProducts) =>
            prevProducts.map((p) =>
              p._id === product._id ? { ...p, variations: updatedVariations } : p
            )
          );
      };
    return (
          isDetailsModalOpen && (
        <div onClick={() => setDetailsModal(false)}
         className="fixed inset-0 lg:pl-72.5 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div onClick={(e) => e.stopPropagation()} 
          className="bg-white max-lg:mt-16  max-h-[90vh] overflow-y-scroll p-6 shadow-lg w-[90%] text-center">
            <h2 className="text-lg font-bold mb-4">PRODUCT DETAILS</h2>

            {/* Product Info */}
            <div className="text-left space-y-2">
              {/* Product ID */}
              <div>
                <label className="block font-semibold">Product ID:</label>
                <input
                  type="text"
                  value={product._id}
                  disabled
                  className="border p-2 w-full"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold">Title:</label>
                <input
                  type="text"
                  value={product.title}
                  onChange={(e) => updateFeild("title", e.target.value)}
                  className="border p-2 w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold">Description:</label>
                <textarea
                  value={product.description}
                  onChange={(e) => updateFeild("description", e.target.value)}
                  className="border p-2 w-full"
                />
              </div>
            {/* collections */}
            <div>
              <label className="block font-semibold">Collection:</label>
              <select
                value={productState.collectionID}
                onChange={(e) => updateFeild("collectionID", e.target.value)}
                className="border p-2 w-full"
              >
                {collections.map((collection,index) => <option key={index} value={collection._id}>{collection.collectionName}</option>)}
                </select>
              {/* {errors.collection && <p className="text-red-500 text-sm">{errors.collection}</p>} */}
            </div>
            <div>
              <label className="block font-semibold">Sub-Collection:</label>
              <select
                value={productState.subCollectionID}
                onChange={(e) => updateFeild("subCollectionID", e.target.value)}
                className="border p-2 w-full"
              >
                {subCollections.map((subCollection,index) => <option key={index} value={subCollection._id}>{subCollection.subCollectionName}</option>)}
                </select>
              {/* {errors.collection && <p className="text-red-500 text-sm">{errors.collection}</p>} */}
            </div>
              {/* Price */}
              <div> 
  <label className="block font-semibold">Price  :</label>
  <input
    type="number"
    value={product.price.local}
    onChange={(e) => {
      const newPrice = {
        ...product.price,
        local: parseFloat(e.target.value)
      };
      updateFeild("price", newPrice);
    }}
    className="border p-2 w-full"
  />
</div>

              {/* Variations */}
              <div>
  <label className="block font-semibold">Product Variants:</label>
  {product.variations.map((variant, index) => 
 <ProductVariant key={index} index={index} product={product} variant={variant} updateVariant={updateVariant} onVariantChange={updateVariant}/>
  )}
  <button 
    onClick={() => updateFeild("variations", [...product.variations, { color: "", stock: 0, featured: false, images: [] }])} 
    className="underline text-primary px-4 py-2"
  >
    Add Variant
  </button>
</div>

{/* Product Details */}
<div>
  <label className="block font-semibold">Product Details:</label>
  {product.productDetails.map((detail, index) => (
    <div key={index} className="flex items-center gap-2 mb-2">
      <input
        type="text"
        value={detail}
        onChange={(e) => {
          const newDetails = [...product.productDetails];
          newDetails[index] = e.target.value;
          updateFeild("productDetails", newDetails);
        }}
        className="border p-2 w-full"
      />
      <span 
        className="cursor-pointer text-red-500" 
        onClick={() => {
          const newDetails = product.productDetails.filter((_, i) => i !== index);
          updateFeild("productDetails", newDetails);
        }}
      >
        &#10006;
      </span>
    </div>
  ))}
  <button 
    onClick={() => updateFeild("productDetails", [...product.productDetails, ""])} 
    className="underline text-primary px-4 py-2"
  >
    Add More
  </button>
</div>


{/* Product Care */}
{/* <div>
  <label className="block font-semibold">Product Care:</label>
  {product.productCare.map((care, index) => (
    <div key={index} className="flex items-center gap-2 mb-2">
      <input
        type="text"
        value={care}
        onChange={(e) => {
          const newCare = [...product.productCare];
          newCare[index] = e.target.value;
          updateFeild("productCare", newCare);
        }}
        className="border p-2 w-full"
      />
      <span 
        className="cursor-pointer text-red-500" 
        onClick={() => {
          const newCare = product.productCare.filter((_, i) => i !== index);
          updateFeild("productCare", newCare);
        }}
      >
        &#10006;
      </span>
    </div>
  ))}
  <button 
    onClick={() => updateFeild("productCare", [...product.productCare, ""])} 
    className="underline text-primary px-4 py-2"
  >
    Add More
  </button>
</div> */}
            </div>

            {/* Buttons */}
            <div className="flex w-full justify-end">
              <h3
                className="px-4 py-2 hover:cursor-pointer text-primary underline"
                onClick={()=>setDeleteModalOpen(true)}
              >
                DELETE PRODUCT
              </h3>
              <DeleteProductModal
              setBigModal={setDetailsModal}
                productID={product._id}
                isModalOpen={isDeleteModalOpen}
                setModalOpen={setDeleteModalOpen}
                setProducts={setProducts}/>
            </div>
            <div className="flex justify-around mt-6">
              <button
                className="px-4 py-2 text-primary border-[1px] border-primary"
                onClick={updateProduct}
              >
                Update
              </button>

            </div>
          </div>
        </div>
      )
  )
}
export default ProductModal
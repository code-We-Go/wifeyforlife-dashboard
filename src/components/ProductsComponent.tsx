"use client";
import { Product } from "@/interfaces/interfaces";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { CgDetailsMore } from "react-icons/cg";
import Swal from "sweetalert2";
import Image from "next/image";
// import { ExposureRegular } from "@/app/layout";
import ProductVariant from "./ProductVariant";

const ProductsComponent = ({ product, setProducts }: { product: Product; setProducts: React.Dispatch<React.SetStateAction<Product[]>> }) => {
    async function deleteProductImage(value:string,variantIndex:number) {
        console.log(value)
            try{

             const res =   await axios.delete("/api/uploadthing", {
                  data: {
                    url: value,
                  },
                });
                if (res.status === 200){

                  const imagesAfterDelete = product.variations[variantIndex].images.filter(image => image !== value);
  
                  console.log('images after delete'+imagesAfterDelete.length) 
                  updateVariant(variantIndex, "images", imagesAfterDelete)

                }
                // setProducts((prevProducts) =>
                //   prevProducts.map((p) =>
                //     p._id === product._id ? { ...p, variations[variantIndex].images: imagesAfterDelete } : p
                //   )
                // );                // setImagesUrl(imagesAfterDelete);    
                       }
            catch(err){
            console.log(err);}  
    }

    const [isModalOpen, setIsModalOpen] = useState(false);
  const [optionsModalIsOpen, setOptionsModal] = useState(false);
  const [isDetailsModalOpen, setDetailsModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Delete Product Function
  const deleteProduct = async () => {
    setIsModalOpen(false);
    try {
      const res = await axios.delete(`/api/products`, {
        data: { productID: product._id },
      });
      if (res.status === 200) {
        setProducts((prev) => prev.filter((o) => o._id !== product._id));
        Swal.fire({
          background: '#FFFFF',
          color: 'black',
          toast: false,
          iconColor: '#473728',
          position: 'bottom-right',
          text: 'PRODUCT HAS BEEN DELETED',
          showConfirmButton: false,
          timer: 2000,
          customClass: {
            popup: 'no-rounded-corners small-popup',
          },
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };
const updateFeild = async(field:string,value:any)=>{
    setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === product._id ? { ...p, [field]: value } : p
        )
      );
}
  // Update Product Function
  const updateProduct = async (field: string, value: any) => {
    try {
      // Update local state optimistically
     

      // Send update request to backend
      const updatedProduct = await axios.put(`/api/products?productID=${product._id}`, { [field]: value });

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
    try {
      console.log('hna' + value.length)
      // Create a copy of the product with the updated variant
      const updatedVariations = [...product.variations];
      updatedVariations[index] = {
        ...updatedVariations[index],
        [field]: value,
      };

      // Update local state optimistically
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === product._id ? { ...p, variations: updatedVariations } : p
        )
      );

      // Send update request to backend
 
      const updatedProduct = await axios.put(`/api/products?productID=${product._id}`, {
        variations: updatedVariations,
      });

   if(updatedProduct.status===200){

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
       text: 'VARIANT HAS BEEN UPDATED',
       showConfirmButton: false,
       timer: 2000,
       customClass: {
         popup: 'no-rounded-corners small-popup',
       },
     });
   }   // Update state with the response from the backend
    } catch (error) {
      console.error("Error updating variant:", error);
      Swal.fire({
        background: '#FFFFF',
        color: 'black',
        toast: false,
        iconColor: '#473728',
        position: 'bottom-right',
        text: 'UPDATE FAILED',
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: 'no-rounded-corners small-popup',
        },
      });
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setOptionsModal(false);
      }
    }

    if (optionsModalIsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsModalIsOpen]);

  return (
    <div className="relative w-[97%] min-h-2 px-2 py-1 text-primary bg-backgroundColor/25 border border-primary">
      <div onClick={() => setDetailsModal(true)} className='flex w-full hover:cursor-pointer items-start text-primary mr-28'>
        <div className='flex pb-2 w-full justify-between items-start text-primary'>
          <div className='relative w-[60px] h-[70px] md:w-[100px] md:h-[120px]'>

            <Image fill alt={product.title} src={product.variations[0].images[0]}></Image>
          </div>
          <h2 className={` text-lg`}>{product.title}</h2>
          <p className='text-[12px] lg:text-lg'>{`${product.price.global} USD || ${product.price.local} LE`}</p>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 pl-72.5 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white max-h-[90vh] overflow-y-scroll p-6 shadow-lg w-[90%] text-center">
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

              {/* Price */}
              <div>
                <label className="block font-semibold">Price (Local):</label>
                <input
                  type="number"
                  value={product.price.local}
                  onChange={(e) => updateFeild("price.local", parseFloat(e.target.value))}
                  className="border p-2 w-full"
                />
              </div>

              <div>
                <label className="block font-semibold">Price (Global):</label>
                <input
                  type="number"
                  value={product.price.global}
                  onChange={(e) => updateFeild("price.global", parseFloat(e.target.value))}
                  className="border p-2 w-full"
                />
              </div>

              {/* Variations */}
              {product.variations.map((variant, index) => (
                // <div key={index} className="border p-4 mt-4">
                //   <h3 className="font-semibold">Variant {index + 1}</h3>
                //   <div>
                //     <label className="block font-semibold">Color:</label>
                //     <input
                //       type="text"
                //       value={variant.color}
                //       onChange={(e) => updateVariant(index, "color", e.target.value)}
                //       className="border p-2 w-full"
                //     />
                //   </div>

                //   <div>
                //     <label className="block font-semibold">Images:</label>
                //    <div className="flex gap-2">
                //     {variant.images.map((image, i) => (
                //       <div key={i} className="relative w-16 h-16">
                //                   <span 
                //  onClick={()=>{
                //     console.log(image)
                //     deleteProductImage(image,index)}}
                //  className='rounded-sm z-30 w-4 h-4 bg-red-500 absolute top-2 text-center flex justify-center items-center p-2 cursor-pointer text-white left-2'>x</span>

                //         <Image fill alt={product.title} src={image}></Image>
                //       </div>
                //     ))}
                //     </div>
                //     {/* <input
                //       type="text"
                //       value={variant.images.join(",")}
                //       onChange={(e) => updateVariant(index, "images", e.target.value.split(","))}
                //       className="border p-2 w-full"
                //     /> */}
                //   </div>

                //   <div>
                //     <label className="block font-semibold">Stock:</label>
                //     <input
                //       type="number"
                //       value={variant.stock}
                //       onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value))}
                //       className="border p-2 w-full"
                //     />
                //   </div>

                //   <div>
                //     <label className="block font-semibold">Featured:</label>
                //     <input
                //       type="checkbox"
                //       checked={variant.featured ? true : false}
                //       onChange={(e) => updateVariant(index, "featured", e.target.checked)}
                //       className="border p-2"
                //     />
                //   </div>
                // </div>
                <ProductVariant key={index} product={product} variant={variant} index={index} updateVariant={updateVariant} deleteProductImage={deleteProductImage} /> 
              ))}

              {/* Product Dimensions */}
              <div>
                <label className="block font-semibold">Product Dimensions (comma-separated):</label>
                <input
                  type="text"
                  value={product.productDimensions.join(",")}
                  onChange={(e) => updateFeild("productDimensions", e.target.value.split(","))}
                  className="border p-2 w-full"
                />
              </div>

              {/* Product Details */}
              <div>
                <label className="block font-semibold">Product Details (comma-separated):</label>
                <input
                  type="text"
                  value={product.productDetails.join(",")}
                  onChange={(e) => updateFeild("productDetails", e.target.value.split(","))}
                  className="border p-2 w-full"
                />
              </div>

              {/* Product Care */}
              <div>
                <label className="block font-semibold">Product Care (comma-separated):</label>
                <input
                  type="text"
                  value={product.productCare.join(",")}
                  onChange={(e) => updateFeild("productCare", e.target.value.split(","))}
                  className="border p-2 w-full"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-around mt-6">
              <button
                className="px-4 py-2 text-primary border-[1px] border-primary"
                onClick={deleteProduct}
              >
                Yes, Delete
              </button>
              <button
                className="px-4 py-2 text-white bg-primary"
                onClick={() => setDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsComponent;
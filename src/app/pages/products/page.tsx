'use client'
import AddProductModal from '@/components/AddProductModal';
import DefaultLayout from '@/components/Layouts/DefaultLayout'
import ProductComponent from '@/components/ProductsComponent';
import { Product } from '@/interfaces/interfaces';
import axios from 'axios';
import React, { useEffect, useState } from 'react'

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [addModalisOpen,setAddModalisOpen]=useState(false)
  
    useEffect(() => {
      const fetchproducts = async () => {
        try {
          const res = await axios.get(`/api/products?page=${page}`);
          setProducts(res.data.data);
          setTotalPages(res.data.totalPages);
        } catch (error) {
          console.error("Error fetching products:", error);
        }
      };
      fetchproducts();
    }, [page,setProducts]);
  return (
        <DefaultLayout>
    
    <div className="px-1 overflow-hidden md:px-2 py-2 md:py-4 w-full h-auto min-h-screen flex flex-col justify-start items-center gap-4 bg-backgroundColor">
      <div 
     
      className=' text-primary w-[97%] flex justify-end underline '><h3
      className='hover:cursor-pointer'
      onClick={()=>setAddModalisOpen(true)}>
       ADD NEW PRODUCT </h3></div>
      <AddProductModal isModalOpen={addModalisOpen} setModalOpen={setAddModalisOpen} setProducts={setProducts} />
    {products.length > 0 ? (
          products.map((product, index) => <ProductComponent setProducts={setProducts} key={index} product={product} />)
        ) : (
          <h1>No products</h1>
        )}

        {/* Pagination Controls */}
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
        </div>
    </DefaultLayout>
    
  )
}

export default ProductsPage
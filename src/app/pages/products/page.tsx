'use client'
import AddProductModal from '@/components/AddProductModal';
import DefaultLayout from '@/components/Layouts/DefaultLayout'
import ProductComponent from '@/components/ProductsComponent';
import { Product } from '@/interfaces/interfaces';
import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react'

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [addModalisOpen, setAddModalisOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
  
    const fetchProducts = useCallback(async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/products?page=${page}&search=${searchQuery}`);
        setProducts(res.data.data);
        setTotalPages(res.data.totalPages);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    }, [page, searchQuery]);

    useEffect(() => {
      // Only reset to first page when search query changes
      if (searchQuery) {
        setPage(1);
      }
      fetchProducts();
    }, [fetchProducts, searchQuery]);

    const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    };

  return (
    <DefaultLayout>
      <div className="px-1  overflow-hidden justify-between md:px-2 py-2 md:py-4 w-full h-auto min-h-screen flex flex-col  items-center gap-4 bg-backgroundColor">
      <div className='flex flex-col items-center w-full h-full space-y-4'>
        <div className='w-[97%] flex flex-col-reverse md:flex-row justify-between items-center gap-4'>
        <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className='text-primary w-full md:w-auto flex justify-end underline'>
            <h3 className='hover:cursor-pointer' onClick={() => setAddModalisOpen(true)}>
              ADD NEW PRODUCT
            </h3>
          </div>
          
  
        </div>
        {isLoading ? (
          <div>Loading...</div>
        ) : products.length > 0 ? (
          products.map((product) => (
            <ProductComponent 
              key={product._id} 
              setProducts={setProducts} 
              product={product} 
            />
          ))
        ) : (
          <h1>No products found</h1>
        )}
        </div>
        <AddProductModal 
          isModalOpen={addModalisOpen} 
          setModalOpen={setAddModalisOpen} 
          setProducts={setProducts} 
        />



        {/* Pagination Controls */}
        <div className="flex items-center gap-4 mt-4">
          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
          >
            Previous
          </button>

          <span className="text-lg">Page {page} of {totalPages}</span>

          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || isLoading}
          >
            Next
          </button>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ProductsPage;
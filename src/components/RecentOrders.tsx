'use client'
import { IOrder } from '@/interfaces/interfaces';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import OrderComponent from './OrderComponent';
import Link from 'next/link';

const RecentOrders = () => {
    const [orders, setOrders] = useState<IOrder[]>([]);
      useEffect(() => {
        const fetchOrders = async () => {
          try {
            const res = await axios.get(`/api/orders?page=1`);
            setOrders(res.data.data);
          } catch (error) {
            console.error("Error fetching orders:", error);
          }
        };
        fetchOrders();
      }, []); 
  
  return (
    <div className=' h-auto flex flex-col gap-3 justify-start items-center  w-full border py-4 border-primary'>
      <h2 className='uppercase text-primary'>Recent Orders</h2>
      <div className=' flex flex-col  h-auto w-full    gap-4  items-center  '>

      {orders.length > 0 ? (
  orders.map((order, index) => {
    return index < 7 ? (
      <OrderComponent setOrders={setOrders} key={index} order={order} />
    ) : (
      <div key={index}></div>
    );
  })
) : (
  <h1>No Orders</h1>
)}

      </div>
      <Link className='mb-6' href={'/pages/orders'}>
      <h2 className='text-primary underline'>VIEW ALL</h2>
      </Link>

      </div>
  )
}

export default RecentOrders
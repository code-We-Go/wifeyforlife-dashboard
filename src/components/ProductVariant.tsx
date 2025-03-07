'use client'
import { Variant ,Product} from '@/interfaces/interfaces'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import UploadProductsImagesButton from './UploadProductImagesButton'
import axios from 'axios'

const ProductVariant = ({index ,product,variant,updateVariant,onVariantChange}:{index:number,product:Product,variant:Variant,
    updateVariant:(index: number, field: string, value: any) => Promise<void>,
   onVariantChange: (index: number, field: string, value: any) => void
}) => {
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
  const [imagesUrl,setImagesUrl]=useState<string[]>(variant.images);
  useEffect(() => {
    
  updateVariant(index, "images", imagesUrl)
   
  }
, [setImagesUrl,imagesUrl])

  return (
                    <div key={index} className="border p-4 mt-4">
                      <h3 className="font-semibold">Variant {index + 1}</h3>
                      <div>
                        <label className="block font-semibold">Color:</label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => onVariantChange(index, "color", e.target.value)}
                          className="border p-2 w-full"
                        />
                      </div>
    
                      <div>
                        <label className="block font-semibold">Images:</label>
                       <div className="flex gap-2">
                        {variant.images.map((image, i) => 
                            <div key={i} className="relative w-16 h-16">
                                      <span 
                     onClick={()=>{
                        console.log(image)
                        deleteProductImage(image,index)}}
                     className='rounded-sm z-30 w-4 h-4 bg-red-500 absolute top-2 text-center flex justify-center items-center p-2 cursor-pointer text-white left-2'>x</span>
    
                            <Image fill alt={product.title} src={image}></Image>
                          </div>
                        
                        )}
        <UploadProductsImagesButton imagesUrl={imagesUrl} setImagesUrl={setImagesUrl} />
        </div>

                      </div>
    
                      <div>
                        <label className="block font-semibold">Stock:</label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => onVariantChange(index, "stock", parseInt(e.target.value))}
                          className="border p-2 w-full"
                        />
                      </div>
    
                      <div>
                        <label className="block font-semibold">Featured:</label>
                        <input
                          type="checkbox"
                          checked={variant.featured ? true : false}
                          onChange={(e) => onVariantChange(index, "featured", e.target.checked)}
                          className="border p-2"
                        />
                      </div>
                    </div>
  )
}

export default ProductVariant
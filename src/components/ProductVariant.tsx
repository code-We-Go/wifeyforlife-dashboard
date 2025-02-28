import { Variant ,Product} from '@/interfaces/interfaces'
import React from 'react'
import Image from 'next/image'

const ProductVariant = ({index ,product,variant,updateVariant,deleteProductImage}:{index:number,product:Product,variant:Variant,
    updateVariant:(index: number, field: string, value: any) => Promise<void>,
    deleteProductImage:(value: string, variantIndex: number)=> Promise<void>
}) => {
  return (
                    <div key={index} className="border p-4 mt-4">
                      <h3 className="font-semibold">Variant {index + 1}</h3>
                      <div>
                        <label className="block font-semibold">Color:</label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => updateVariant(index, "color", e.target.value)}
                          className="border p-2 w-full"
                        />
                      </div>
    
                      <div>
                        <label className="block font-semibold">Images:</label>
                       <div className="flex gap-2">
                        {variant.images.map((image, i) => (
                          <div key={i} className="relative w-16 h-16">
                                      <span 
                     onClick={()=>{
                        console.log(image)
                        deleteProductImage(image,index)}}
                     className='rounded-sm z-30 w-4 h-4 bg-red-500 absolute top-2 text-center flex justify-center items-center p-2 cursor-pointer text-white left-2'>x</span>
    
                            <Image fill alt={product.title} src={image}></Image>
                          </div>
                        ))}
                        </div>
                        {/* <input
                          type="text"
                          value={variant.images.join(",")}
                          onChange={(e) => updateVariant(index, "images", e.target.value.split(","))}
                          className="border p-2 w-full"
                        /> */}
                      </div>
    
                      <div>
                        <label className="block font-semibold">Stock:</label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value))}
                          className="border p-2 w-full"
                        />
                      </div>
    
                      <div>
                        <label className="block font-semibold">Featured:</label>
                        <input
                          type="checkbox"
                          checked={variant.featured ? true : false}
                          onChange={(e) => updateVariant(index, "featured", e.target.checked)}
                          className="border p-2"
                        />
                      </div>
                    </div>
  )
}

export default ProductVariant
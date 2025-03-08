"use client";

import { Variant, Product } from "@/interfaces/interfaces";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import UploadProductsImagesButton from "./UploadProductImagesButton";
import axios from "axios";
import { useDrag, useDrop } from "react-dnd";

const ProductVariant = ({
  index,
  product,
  variant,
  updateVariant,
  onVariantChange,
}: {
  index: number;
  product: Product;
  variant: Variant;
  updateVariant: (index: number, field: string, value: any) => Promise<void>;
  onVariantChange: (index: number, field: string, value: any) => void;
}) => {
  const [imagesUrl, setImagesUrl] = useState<string[]>(variant.images);
  const ItemTypes = {
    IMAGE: "image",
  };

  // Handle image deletion
  async function deleteProductImage(value: string, variantIndex: number) {
    try {
      const res = await axios.delete("/api/uploadthing", {
        data: {
          url: value,
        },
      });
      if (res.status === 200) {
        const imagesAfterDelete = product.variations[variantIndex].images.filter(
          (image) => image !== value
        );
        updateVariant(variantIndex, "images", imagesAfterDelete);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Update variant images when imagesUrl state changes
  // useEffect(() => {
  //   updateVariant(index, "images", imagesUrl);
  // }, [imagesUrl, updateVariant, index]);

  useEffect(() => {
    
    updateVariant(index, "images", imagesUrl)
     
    }
  , [setImagesUrl,imagesUrl])

  // Function to move images in local state
  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...imagesUrl];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    setImagesUrl(updatedImages);
    updateVariant(index, "images", updatedImages); // Sync with parent state
  };

  // Drag-and-drop image item
  const ImageItem = ({ image, index }: { image: string; index: number }) => {
    const [, drag] = useDrag({
      type: ItemTypes.IMAGE,
      item: { index },
    });

    const [, drop] = useDrop({
      accept: ItemTypes.IMAGE,
      hover: (item: { index: number }) => {
        if (item.index !== index) {
          moveImage(item.index, index);
          item.index = index;
        }
      },
    });

    return (
      <div
        ref={(node) => {
          drag(node);
          drop(node);
        }}
        className="relative w-28 h-34 cursor-move"
      >
        <span
          onClick={() => {
            deleteProductImage(image, index);
            setImagesUrl(imagesUrl.filter((img) => img !== image)); // Update local state
          }}
          className="rounded-sm z-30 w-4 h-4 bg-red-500 absolute top-2 text-center flex justify-center items-center p-2 cursor-pointer text-white left-2"
        >
          x
        </span>
        <Image fill alt={product.title} src={image} />
      </div>
    );
  };

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
        <div className="flex gap-2 ">
         <div className="flex flex-nowrap gap-2 max-w-[90%] scrollbar-hidden overflow-x-scroll">
           {imagesUrl.map((image, i) => (
            <ImageItem key={i} image={image} index={i} />
          ))}
          </div>
        <UploadProductsImagesButton
          imagesUrl={imagesUrl}
          setImagesUrl={setImagesUrl}
        />
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
  );
};

export default ProductVariant;

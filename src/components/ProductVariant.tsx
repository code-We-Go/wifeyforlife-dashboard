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
  const [sizes, setSizes] = useState<{ name: string; stock: number }[]>(variant.sizes || []);

  useEffect(() => {
    updateVariant(index, "images", imagesUrl);
  }, [imagesUrl]);

  useEffect(() => {
    updateVariant(index, "sizes", sizes);
  }, [sizes]);

  // Handle image deletion
  async function deleteProductImage(value: string, variantIndex: number) {
    try {
      const res = await axios.delete("/api/uploadthing", { data: { url: value } });
      if (res.status === 200) {
        const imagesAfterDelete = product.variations[variantIndex].images.filter((image) => image !== value);
        updateVariant(variantIndex, "images", imagesAfterDelete);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Handle adding a new size
  const addSize = () => {
    setSizes([...sizes, { name: "", stock: 0 }]);
  };

  // Handle updating a size name or stock
  const updateSize = (index: number, field: "name" | "stock", value: string | number) => {
    const updatedSizes = sizes.map((size, i) =>
      i === index ? { ...size, [field]: value } : size
    );
    setSizes(updatedSizes);
  };

  // Handle removing a size
  const removeSize = (sizeIndex: number) => {
    setSizes(sizes.filter((_, i) => i !== sizeIndex));
  };
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
      
      {/* Color Input */}
      <div>
        <label className="block font-semibold">Color:</label>
        <input
          type="text"
          value={variant.color}
          onChange={(e) => onVariantChange(index, "color", e.target.value)}
          className="border p-2 w-full"
        />
      </div>

      {/* Sizes Section */}
      <div>
        <label className="block font-semibold">Sizes:</label>
        {sizes.map((size, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              placeholder="Size"
              value={size.name}
              onChange={(e) => updateSize(i, "name", e.target.value)}
              className="border p-2 w-1/2"
            />
            <input
              type="number"
              placeholder="Stock"
              value={size.stock}
              onChange={(e) => updateSize(i, "stock", parseInt(e.target.value))}
              className="border p-2 w-1/2"
            />
            <button className="text-red-500" onClick={() => removeSize(i)}>
              ✖
            </button>
          </div>
        ))}
        <button onClick={addSize} className="underline text-accent">
          Add Size
        </button>
      </div>

      {/* Images Section */}
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
    </div>
  );
};

export default ProductVariant;

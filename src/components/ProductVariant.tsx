"use client";

import { Variant, Product, media } from "@/interfaces/interfaces";
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
  const [imagesUrl, setImagesUrl] = useState<media[]>(variant.images || []);
  const ItemTypes = {
    MEDIA: "media", // Changed to reflect both images and videos
  };
  const [sizes, setSizes] = useState<{ name: string; stock: number }[]>(variant.sizes || []);

  useEffect(() => {
    updateVariant(index, "images", imagesUrl);
  }, [imagesUrl]);

  useEffect(() => {
    updateVariant(index, "sizes", sizes);
  }, [sizes]);

  // Handle media deletion
  async function deleteProductImage(url: string) {
    try {
      const res = await axios.delete("/api/uploadthing", { data: { url } });
      if (res.status === 200) {
        const imagesAfterDelete = imagesUrl.filter((media) => media.url !== url);
        setImagesUrl(imagesAfterDelete);
        updateVariant(index, "images", imagesAfterDelete);
      }
    } catch (err) {
      console.error("Error deleting media:", err);
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

  // Handle drag-and-drop for media
  const moveMedia = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...imagesUrl];
    const [movedMedia] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedMedia);
    setImagesUrl(updatedImages);
    updateVariant(index, "images", updatedImages); // Sync with parent state
  };

  // Drag-and-drop media item
  const MediaItem = ({ media, index }: { media: media; index: number }) => {
    const [, drag] = useDrag({
      type: ItemTypes.MEDIA,
      item: { index },
    });

    const [, drop] = useDrop({
      accept: ItemTypes.MEDIA,
      hover: (item: { index: number }) => {
        if (item.index !== index) {
          moveMedia(item.index, index);
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
          onClick={() => deleteProductImage(media.url)}
          className="rounded-sm z-30 w-4 h-4 bg-red-500 absolute top-2 text-center flex justify-center items-center p-2 cursor-pointer text-white left-2"
        >
          x
        </span>
        {media.type === "image" ? (
          <Image fill alt={product.title} src={media.url} className="object-cover" />
        ) : (
          <video
            src={media.url}
            className="w-full h-full object-cover"
            controls
            muted
          />
        )}
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
              onChange={(e) => updateSize(i, "stock", parseInt(e.target.value) || 0)}
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

      {/* Media Section */}
      <div>
        <label className="block font-semibold">Media:</label>
        <div className="flex gap-2">
          <div className="flex flex-nowrap gap-2 max-w-[90%] scrollbar-hidden overflow-x-scroll">
            {imagesUrl.map((media, i) => (
              <MediaItem key={i} media={media} index={i} />
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
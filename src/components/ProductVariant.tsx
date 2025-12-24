"use client";

import { Variant, Product, media, attribute } from "@/interfaces/interfaces";
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
  onDeleteVariant,
}: {
  index: number;
  product: Product;
  variant: Variant;
  updateVariant: (index: number, field: string, value: any) => Promise<void>;
  onVariantChange: (index: number, field: string, value: any) => void;
  onDeleteVariant: (index: number) => void;
}) => {
  const [imagesUrl, setImagesUrl] = useState<media[]>(variant.images || []);
  const [attributes, setAttributes] = useState<attribute[]>(
    (variant.attributes || []).map((a) => ({
      ...a,
      price: typeof a.price === "number" ? a.price : Number(a.price ?? 0),
    })),
  );
  const ItemTypes = {
    MEDIA: "media",
  };

  useEffect(() => {
    updateVariant(index, "images", imagesUrl);
  }, [imagesUrl]);

  useEffect(() => {
    // attributes are pushed on change handlers directly to avoid stale updates
  }, [attributes]);

  // Handle media deletion
  async function deleteProductImage(url: string) {
    try {
      const res = await axios.delete("/api/uploadthing", { data: { url } });
      if (res.status === 200) {
        const imagesAfterDelete = imagesUrl.filter(
          (media) => media.url !== url,
        );
        setImagesUrl(imagesAfterDelete);
        updateVariant(index, "images", imagesAfterDelete);
      }
    } catch (err) {
      console.error("Error deleting media:", err);
    }
  }

  // Handle adding a new attribute
  const addAttribute = () => {
    const newAttributes = [...attributes, { name: "", stock: 0, price: 0 }];
    setAttributes(newAttributes);
    updateVariant(index, "attributes", newAttributes);
  };

  // Handle updating an attribute
  const updateAttribute = (
    attrIndex: number,
    field: "name" | "stock" | "price",
    value: string | number,
  ) => {
    const updatedAttributes = attributes.map((attr, i) =>
      i === attrIndex ? { ...attr, [field]: value } : attr,
    );
    setAttributes(updatedAttributes);
    updateVariant(index, "attributes", updatedAttributes);
  };

  // Handle removing an attribute
  const removeAttribute = (attrIndex: number) => {
    const filtered = attributes.filter((_, i) => i !== attrIndex);
    setAttributes(filtered);
    updateVariant(index, "attributes", filtered);
  };

  // Handle drag-and-drop for media
  const moveMedia = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...imagesUrl];
    const [movedMedia] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedMedia);
    setImagesUrl(updatedImages);
    updateVariant(index, "images", updatedImages);
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
        className="relative h-34 w-28 cursor-move"
      >
        <span
          onClick={() => deleteProductImage(media.url)}
          className="absolute left-2 top-2 z-30 flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm bg-red-500 p-2 text-center text-white"
        >
          x
        </span>
        {media.type === "image" ? (
          <Image
            fill
            alt={product.title}
            src={media.url}
            className="object-cover"
          />
        ) : (
          <video
            src={media.url}
            className="h-full w-full object-cover"
            controls
            muted
            playsInline
          />
        )}
      </div>
    );
  };

  return (
    <div key={index} className="relative mt-4 border p-4">
      {/* (x) button to delete variant */}
      <button
        onClick={() => onDeleteVariant(index)}
        className="absolute right-2 top-2 z-40 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
        title="Delete Variant"
        type="button"
      >
        ×
      </button>
      <h3 className="mb-4 font-semibold">Variant {index + 1}</h3>

      {/* Variant Name */}
      <div className="mb-4">
        <label className="block font-semibold">
          Variant Name:{" "}
          <span className="text-sm font-normal text-gray-400">
            ex: Size,Color (doesn&apos;t appear on website on your demand ,but
            don&apos;t let it empty. )
          </span>
        </label>
        <input
          type="text"
          value={variant.name}
          onChange={(e) => {
            onVariantChange(index, "name", e.target.value);
            onVariantChange(index, "attributeName", e.target.value);
          }}
          className="w-full border p-2"
          placeholder="e.g., Default Variant"
        />
      </div>

      {/* Variant Price (optional) */}
      {/* <div className="mb-4">
        <label className="block font-semibold">Variant Price (optional):</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={typeof variant.price === "number" ? variant.price : 0}
          onChange={(e) => {
            const val = e.target.value;
            const parsed = val === "" ? undefined : parseFloat(val);
            onVariantChange(index, "price", parsed);
          }}
          className="w-full border p-2"
          placeholder="e.g., 19.99"
        />
      </div> */}

      {/* Attributes */}
      <div className="mb-4">
        <label className="block font-semibold">Attributes:</label>
        {attributes.map((attr, attrIndex) => (
          <div key={attrIndex} className="mb-2 flex items-start gap-2">
            <div className="flex flex-1 gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold">
                  Name{" "}
                  <span className="font-normal text-gray-500">
                    ex: notebook only,notebook with stickers
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Attribute Name"
                  value={attr.name}
                  onChange={(e) =>
                    updateAttribute(attrIndex, "name", e.target.value)
                  }
                  className="w-full border p-2"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-semibold">Stock</label>
                <input
                  type="number"
                  placeholder="0"
                  value={attr.stock === 0 ? "" : attr.stock}
                  onChange={(e) =>
                    updateAttribute(
                      attrIndex,
                      "stock",
                      e.target.value === "" ? 0 : parseInt(e.target.value),
                    )
                  }
                  className="w-full border p-2"
                />
              </div>
              <div className="w-28">
                <label className="block text-xs font-semibold">Price</label>
                <input
                  type="number"
                  placeholder="0"
                  min={0}
                  step="0.01"
                  value={
                    attr.price === 0
                      ? ""
                      : typeof attr.price === "number"
                        ? attr.price
                        : Number(attr.price ?? 0)
                  }
                  onChange={(e) =>
                    updateAttribute(
                      attrIndex,
                      "price",
                      e.target.value === "" ? 0 : parseFloat(e.target.value),
                    )
                  }
                  className="w-full border p-2 placeholder:text-black"
                />
              </div>
            </div>
            <button
              onClick={() => removeAttribute(attrIndex)}
              className="text-red-500"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addAttribute}
          className="px-4 py-2 text-secondary underline"
        >
          Add Attribute
        </button>
      </div>

      {/* Media Section */}
      <div>
        <label className="block font-semibold">Media:</label>
        <div className="flex gap-2">
          <div className="scrollbar-hidden flex max-w-[90%] flex-nowrap gap-2 overflow-x-scroll">
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

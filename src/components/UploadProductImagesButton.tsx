"use client";

import { UploadButton } from "../utils/uploadthing";
import axios from "axios";
import React from "react";
import { media } from "@/interfaces/interfaces";

const UploadProductsImagesButton = ({
  setImagesUrl,
  imagesUrl,
}: {
  setImagesUrl: React.Dispatch<React.SetStateAction<media[]>>;
  imagesUrl: media[];
}) => {
  const deleteValue = async (value: string) => {
    await axios.delete("/api/uploadthing", {
      data: {
        url: value,
      },
    });
  };

  return (
    <div>
      <UploadButton
        className="bg-primary text-white h-16 px-2 py-1 border-primary !important"
        endpoint="mediaUploader"
        onClientUploadComplete={(res) => {
          // Check if multiple files were uploaded
          console.log("Files: ", res);

          // Map uploaded files to media objects
          const newMedia = res.map((file) => {
            // Determine type based on file type or extension
            const isVideo = file.type.startsWith("video/") || file.url.match(/\.(mp4|webm|ogg)$/i);
            return {
              url: file.url,
              type: isVideo ? "video" : "image",
            } as media;
          });

          // Append new media to existing imagesUrl
          setImagesUrl((prevUrls) => [...prevUrls, ...newMedia]);

          console.log("Updated media URLs:", imagesUrl);

          alert("Upload Completed");
        }}
        onUploadError={(error: Error) => {
          // Handle upload error
          alert(`ERROR! ${error.message}`);
        }}
      />
    </div>
  );
};

export default UploadProductsImagesButton;
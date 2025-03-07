"use client";

import { UploadButton } from "../utils/uploadthing";
import axios from "axios";
import React from "react";

const UploadProductsImagesButton = ({
  setImagesUrl,
  imagesUrl,
}: {
  setImagesUrl: React.Dispatch<React.SetStateAction<any[]>>;
  imagesUrl: string[];
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
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          // Check if multiple files were uploaded
          console.log("Files: ", res);

          // Assuming res is an array of uploaded files
          const newUrls = res.map((file) => file.url);

          // Append the new URLs to the existing imagesUrl
          setImagesUrl((prevUrls) => [...prevUrls, ...newUrls]);

          console.log("Updated image URLs:", imagesUrl);

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

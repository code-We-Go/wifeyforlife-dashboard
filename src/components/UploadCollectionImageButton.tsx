"use client";

import { UploadButton } from "../utils/uploadthing";
import axios from "axios";
import React from "react";

const UploadCollectionImageButton = ({
  updateImageUrl,
  imageUrl,
}: {
  updateImageUrl:  (url: string) => Promise<void>;
  imageUrl: string;
}) => {
  const deleteValue = async (value: string) => {
    await axios.delete("/api/uploadthing", {
      data: {
        url: value,
      },
    });
  };

  return (
    <div className="text-white">
<UploadButton
  endpoint="imageUploader"
  onClientUploadComplete={(res) => {
    deleteValue(imageUrl)
    console.log("Files: ", res);
    const newUrl = res[0].ufsUrl;
    updateImageUrl(newUrl);

    console.log("Updated image URLs:", imageUrl);
    alert("Upload Completed");
  }}
  onUploadError={(error: Error) => {
    alert(`ERROR! ${error.message}`);
  }}
  appearance={{
    button: "bg-primary text-white py-2 h-10 text-nowrap px-4 rounded-lg border border-primary",
    container: "flex  flex-col items-center gap-2",
    allowedContent:"hidden"
    // : "text-gray-500 text-sm",
  }}
/>

    </div>
  );
};

export default UploadCollectionImageButton;

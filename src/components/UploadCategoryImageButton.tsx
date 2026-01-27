"use client";

import { UploadButton } from "@/utils/uploadthing";
import axios from "axios";
import React from "react";
import { compressImage } from "@/utils/imageCompression";

const UploadCategoryImageButton = ({
  updateImageUrl,
  imageUrl,
}: {
  updateImageUrl: (url: string) => void;
  imageUrl: string;
}) => {
  const deleteValue = async (value: string) => {
    try {
      if (!value) return;
      await axios.delete("/api/uploadthing", {
        data: {
          url: value,
        },
      });
    } catch (error) {
      console.error("Error deleting old image:", error);
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            return await compressImage(file);
          }
          return file;
        })
      );
      return compressedFiles;
    } catch (error) {
      console.error('Error during compression:', error);
      return files;
    }
  };

  return (
    <div className="text-white">
      <UploadButton
        endpoint="mediaUploader"
        onBeforeUploadBegin={handleUpload}
        onClientUploadComplete={(res) => {
          if (res && res.length > 0) {
            // If there is an existing image, delete it before setting the new one
            deleteValue(imageUrl); 
            
            console.log("Files: ", res);
            const newUrl = res[0].url;
            updateImageUrl(newUrl);
            alert("Upload Completed");
          } else {
            alert("No files were uploaded");
          }
        }}
        onUploadError={(error: Error) => {
          console.error("Upload error details:", error);
          alert(`Upload failed: ${error.message}`);
        }}
        appearance={{
            button: "bg-primary text-white py-2 h-10 text-nowrap px-4 rounded-lg border border-primary",
            container: "flex flex-col items-center gap-2",
            allowedContent: "hidden"
        }}
      />
    </div>
  );
};

export default UploadCategoryImageButton;

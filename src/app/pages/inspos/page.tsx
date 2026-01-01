"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Inspo, InspoSection } from "@/interfaces/interfaces";
import axios from "axios";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const InsposPage = () => {
  const [inspos, setInspos] = useState<Inspo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspo, setSelectedInspo] = useState<Inspo | null>(null);
  const [activeTab, setActiveTab] = useState<
    "boards" | "analytics" | "downloads"
  >("boards");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal States
  const [showAddInspoModal, setShowAddInspoModal] = useState(false);
  const [newInspoTitle, setNewInspoTitle] = useState("");

  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");

  useEffect(() => {
    fetchInspos();
  }, []);

  const fetchInspos = async () => {
    try {
      const res = await axios.get("/api/inspos");
      if (res.data && res.data.data) {
        setInspos(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch inspos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInspo = async () => {
    if (!newInspoTitle.trim()) return;
    try {
      const res = await axios.post("/api/inspos", {
        title: newInspoTitle,
        sections: [],
      });
      if (res.status === 201) {
        setInspos([res.data.data, ...inspos]);
        setNewInspoTitle("");
        setShowAddInspoModal(false);
        Swal.fire({
          icon: "success",
          title: "Board Created",
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 3000,
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to create board", "error");
    }
  };

  const handleDeleteInspo = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/inspos?id=${id}`);
        setInspos(inspos.filter((i) => i._id !== id));
        if (selectedInspo?._id === id) setSelectedInspo(null);
        Swal.fire("Deleted!", "Your board has been deleted.", "success");
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to delete board", "error");
      }
    }
  };

  const handleAddSection = async () => {
    if (!selectedInspo || !newSectionTitle.trim()) return;
    const updatedSections = [
      ...selectedInspo.sections,
      { title: newSectionTitle, images: [] },
    ];
    try {
      const res = await axios.put(`/api/inspos?id=${selectedInspo._id}`, {
        sections: updatedSections,
      });
      if (res.status === 200) {
        const updatedInspo = res.data.data;
        updateInspoState(updatedInspo);
        setNewSectionTitle("");
        setShowAddSectionModal(false);
        Swal.fire({
          icon: "success",
          title: "Section Added",
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 3000,
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to add section", "error");
    }
  };

  const handleDeleteSection = async (sectionIndex: number) => {
    if (!selectedInspo) return;
    const updatedSections = selectedInspo.sections.filter(
      (_, i) => i !== sectionIndex,
    );
    try {
      const res = await axios.put(`/api/inspos?id=${selectedInspo._id}`, {
        sections: updatedSections,
      });
      if (res.status === 200) {
        updateInspoState(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageUpload = async (result: any, sectionIndex: number) => {
    if (!selectedInspo) return;
    if (result.event === "success") {
      const publicId = result.info.public_id;
      const newImage = { public_id: publicId, downloadCount: 0 };

      try {
        // Use atomic $push to avoid race conditions when uploading multiple images
        const res = await axios.put(`/api/inspos?id=${selectedInspo._id}`, {
          $push: { [`sections.${sectionIndex}.images`]: newImage },
        });

        if (res.status === 200) {
          // Update local state functionally to ensure we don't overwrite concurrent updates
          // and don't rely on the potentially stale response from the server
          setSelectedInspo((prev) => {
            if (!prev) return null;
            const newSections = [...prev.sections];
            // Ensure section exists and initialize images if needed (though it should exist)
            if (newSections[sectionIndex]) {
              const currentImages = newSections[sectionIndex].images || [];
              if (
                !currentImages.some((img: any) => img.public_id === publicId)
              ) {
                newSections[sectionIndex] = {
                  ...newSections[sectionIndex],
                  images: [...currentImages, newImage],
                };
              }
            }
            return { ...prev, sections: newSections };
          });

          setInspos((prevInspos) =>
            prevInspos.map((inspo) => {
              if (inspo._id === selectedInspo._id) {
                const newSections = [...inspo.sections];
                if (newSections[sectionIndex]) {
                  const currentImages = newSections[sectionIndex].images || [];
                  if (
                    !currentImages.some(
                      (img: any) => img.public_id === publicId,
                    )
                  ) {
                    newSections[sectionIndex] = {
                      ...newSections[sectionIndex],
                      images: [...currentImages, newImage],
                    };
                  }
                }
                return { ...inspo, sections: newSections };
              }
              return inspo;
            }),
          );
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to save image", "error");
      }
    }
  };

  const handleDeleteImage = async (
    sectionIndex: number,
    imageIndex: number,
  ) => {
    if (!selectedInspo) return;
    const sections = [...selectedInspo.sections];
    sections[sectionIndex].images = sections[sectionIndex].images.filter(
      (_, i) => i !== imageIndex,
    );

    try {
      const res = await axios.put(`/api/inspos?id=${selectedInspo._id}`, {
        sections,
      });
      if (res.status === 200) {
        updateInspoState(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateInspoState = (updatedInspo: Inspo) => {
    setInspos(
      inspos.map((i) => (i._id === updatedInspo._id ? updatedInspo : i)),
    );
    setSelectedInspo(updatedInspo);
  };

  const handleEditInspoTitle = async (inspo: Inspo) => {
    const { value: newTitle } = await Swal.fire({
      title: "Edit Board Title",
      input: "text",
      inputValue: inspo.title,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });

    if (newTitle && newTitle !== inspo.title) {
      try {
        const res = await axios.put(`/api/inspos?id=${inspo._id}`, {
          title: newTitle,
        });
        if (res.status === 200) {
          updateInspoState(res.data.data);
          Swal.fire({
            icon: "success",
            title: "Title Updated",
            toast: true,
            position: "bottom-end",
            showConfirmButton: false,
            timer: 3000,
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to update the title", "error");
      }
    }
  };

  const handleEditSectionTitle = async (sectionIndex: number) => {
    if (!selectedInspo) return;
    const currentSection = selectedInspo.sections[sectionIndex];

    const { value: newTitle } = await Swal.fire({
      title: "Edit Section Title",
      input: "text",
      inputValue: currentSection.title,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });

    if (newTitle && newTitle !== currentSection.title) {
      const updatedSections = [...selectedInspo.sections];
      updatedSections[sectionIndex].title = newTitle;

      try {
        const res = await axios.put(`/api/inspos?id=${selectedInspo._id}`, {
          sections: updatedSections,
        });
        if (res.status === 200) {
          updateInspoState(res.data.data);
          Swal.fire({
            icon: "success",
            title: "Section Title Updated",
            toast: true,
            position: "bottom-end",
            showConfirmButton: false,
            timer: 3000,
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to update section title", "error");
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "boards":
        return (
          <div className="flex flex-col gap-10">
            {!selectedInspo ? (
              <div className="h-auto min-h-screen rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="mb-4 flex justify-between">
                  <h4 className="text-xl font-semibold text-black dark:text-white">
                    All Boards
                  </h4>
                  <button
                    onClick={() => setShowAddInspoModal(true)}
                    className="rounded bg-primary px-4 py-2 text-white hover:bg-opacity-90"
                  >
                    Add Board
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {inspos.map((inspo) => {
                    const allImages = inspo.sections.flatMap((s) => s.images);
                    const previewImages = allImages.slice(0, 3);
                    return (
                      <div
                        key={inspo._id}
                        className="group cursor-pointer"
                        onClick={() => setSelectedInspo(inspo)}
                      >
                        <div className="relative mb-3 flex h-60 gap-1 overflow-hidden rounded-2xl bg-gray-100 dark:bg-meta-4">
                          <div className="relative h-full w-2/3 overflow-hidden rounded-l-2xl">
                            {previewImages[0] ? (
                              <CldImage
                                width="400"
                                height="400"
                                src={previewImages[0].public_id}
                                alt="Cover"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400 dark:bg-gray-700">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="flex h-full w-1/3 flex-col gap-1">
                            <div className="relative h-1/2 w-full overflow-hidden rounded-tr-2xl">
                              {previewImages[1] ? (
                                <CldImage
                                  width="200"
                                  height="200"
                                  src={previewImages[1].public_id}
                                  alt="Preview 2"
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400 dark:bg-gray-700"></div>
                              )}
                            </div>
                            <div className="relative h-1/2 w-full overflow-hidden rounded-br-2xl">
                              {previewImages[2] ? (
                                <CldImage
                                  width="200"
                                  height="200"
                                  src={previewImages[2].public_id}
                                  alt="Preview 3"
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400 dark:bg-gray-700"></div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mb-1 flex items-center justify-between">
                          <h5 className="text-lg font-bold text-black dark:text-white">
                            {inspo.title}
                          </h5>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditInspoTitle(inspo);
                            }}
                            className="text-gray-500 hover:text-primary"
                            title="Edit Title"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="h-4 w-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">
                            {inspo.sections.length} Sections •{" "}
                            {allImages.length} Inspos
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInspo(inspo._id);
                            }}
                            className="text-sm text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedInspo(null)}
                      className="text-primary hover:underline"
                    >
                      &larr; Back
                    </button>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-semibold text-black dark:text-white">
                        {selectedInspo.title}
                      </h4>
                      <button
                        onClick={() => handleEditInspoTitle(selectedInspo)}
                        className="text-gray-500 hover:text-primary"
                        title="Edit Title"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddSectionModal(true)}
                    className="rounded bg-primary px-4 py-2 text-white hover:bg-opacity-90"
                  >
                    Add Section
                  </button>
                </div>
                <div className="flex flex-col gap-8">
                  {[...selectedInspo.sections]
                    .reverse()
                    .map((section, reverseIndex) => {
                      const sIndex =
                        selectedInspo.sections.length - 1 - reverseIndex;
                      return (
                        <div
                          key={sIndex}
                          className="border-b border-stroke pb-6 dark:border-strokedark"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h5 className="text-lg font-bold text-black dark:text-white">
                                {section.title}
                              </h5>
                              <button
                                onClick={() => handleEditSectionTitle(sIndex)}
                                className="text-gray-500 hover:text-primary"
                                title="Edit Title"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="h-4 w-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                  />
                                </svg>
                              </button>
                            </div>
                            <button
                              onClick={() => handleDeleteSection(sIndex)}
                              className="text-sm text-red-500 hover:underline"
                            >
                              Delete Section
                            </button>
                          </div>
                          <div className="mb-4">
                            <CldUploadWidget
                              uploadPreset={
                                process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
                              }
                              onSuccess={(result) =>
                                handleImageUpload(result, sIndex)
                              }
                            >
                              {({ open }) => {
                                return (
                                  <button
                                    className="rounded bg-secondary px-3 py-1 text-sm text-white"
                                    onClick={() => open()}
                                  >
                                    Upload Image
                                  </button>
                                );
                              }}
                            </CldUploadWidget>
                          </div>
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {section.images.map((img, imgIndex) => (
                              <div key={imgIndex} className="group relative">
                                <CldImage
                                  width="600"
                                  height="600"
                                  src={img.public_id}
                                  alt="Inspo"
                                  sizes="(max-width: 768px) 100vw, 600px"
                                  className="h-40 w-full rounded object-cover"
                                />
                                <button
                                  onClick={() =>
                                    handleDeleteImage(sIndex, imgIndex)
                                  }
                                  className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        );
      case "analytics":
        return (
          <div className="flex flex-col gap-6">
            <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  Board Analytics
                </h4>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search boards or sections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded border border-stroke bg-gray-2 px-4 py-2 pl-10 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary sm:w-80"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg
                      className="fill-body hover:fill-primary dark:fill-bodydark dark:hover:fill-primary"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8.25 3C5.35051 3 3 5.35051 3 8.25C3 11.1495 5.35051 13.5 8.25 13.5C11.1495 13.5 13.5 11.1495 13.5 8.25C13.5 5.35051 11.1495 3 8.25 3ZM1.5 8.25C1.5 4.52183 4.52183 1.5 8.25 1.5C11.9782 1.5 15 4.52183 15 8.25C15 11.9782 11.9782 15 8.25 15C4.52183 15 1.5 11.9782 1.5 8.25Z"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M11.958 11.958C12.2509 11.6651 12.7257 11.6651 13.0186 11.958L16.2811 15.2205C16.574 15.5134 16.574 15.9882 16.2811 16.2811C15.9882 16.574 15.5134 16.574 15.2205 16.2811L11.958 13.0186C11.6651 12.7257 11.6651 12.2509 11.958 11.958Z"
                      />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
                  <div className="p-2.5 xl:p-5">
                    <h5 className="text-sm font-medium uppercase xsm:text-base">
                      Board / Section
                    </h5>
                  </div>
                  <div className="p-2.5 text-center xl:p-5">
                    <h5 className="text-sm font-medium uppercase xsm:text-base">
                      Type
                    </h5>
                  </div>
                  <div
                    className="cursor-pointer p-2.5 text-center hover:text-primary xl:p-5"
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                  >
                    <h5 className="flex items-center justify-center gap-1 text-sm font-medium uppercase xsm:text-base">
                      Views
                      <svg
                        className={`h-4 w-4 fill-current transition-transform ${
                          sortOrder === "asc" ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </h5>
                  </div>
                  <div className="hidden p-2.5 text-center sm:block xl:p-5">
                    <h5 className="text-sm font-medium uppercase xsm:text-base">
                      Total Images
                    </h5>
                  </div>
                </div>
                {inspos
                  .filter(
                    (inspo) =>
                      inspo.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      inspo.sections.some((s) =>
                        s.title
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                      ),
                  )
                  .sort((a, b) => {
                    const valA = a.viewCount || 0;
                    const valB = b.viewCount || 0;
                    return sortOrder === "asc" ? valA - valB : valB - valA;
                  })
                  .map((inspo, key) => (
                    <React.Fragment key={key}>
                      <div className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
                        <div className="flex items-center gap-3 p-2.5 xl:p-5">
                          <p className="font-semibold text-black dark:text-white">
                            {inspo.title}
                          </p>
                        </div>
                        <div className="flex items-center justify-center p-2.5 xl:p-5">
                          <span className="rounded bg-primary bg-opacity-10 px-3 py-1 text-sm font-medium text-primary">
                            Board
                          </span>
                        </div>
                        <div className="flex items-center justify-center p-2.5 xl:p-5">
                          <p className="text-black dark:text-white">
                            {inspo.viewCount || 0}
                          </p>
                        </div>
                        <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                          <p className="text-black dark:text-white">
                            {inspo.sections.reduce(
                              (acc, s) => acc + s.images.length,
                              0,
                            )}
                          </p>
                        </div>
                      </div>
                      {inspo.sections
                        .filter((s) =>
                          s.title
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                        )
                        .map((section, sKey) => (
                          <div
                            key={`section-${sKey}`}
                            className="grid grid-cols-3 border-b border-stroke bg-gray-50 dark:border-strokedark dark:bg-meta-4/20 sm:grid-cols-4"
                          >
                            <div className="flex items-center gap-3 p-2.5 pl-8 xl:p-5 xl:pl-12">
                              <p className="text-sm text-black dark:text-white">
                                {section.title}
                              </p>
                            </div>
                            <div className="flex items-center justify-center p-2.5 xl:p-5">
                              <span className="rounded bg-success bg-opacity-10 px-3 py-1 text-xs font-medium text-success">
                                Section
                              </span>
                            </div>
                            <div className="flex items-center justify-center p-2.5 xl:p-5">
                              <p className="text-sm text-black dark:text-white">
                                {section.viewCount || 0}
                              </p>
                            </div>
                            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                              <p className="text-sm text-black dark:text-white">
                                {section.images.length}
                              </p>
                            </div>
                          </div>
                        ))}
                    </React.Fragment>
                  ))}
              </div>
            </div>
          </div>
        );
      case "downloads":
        return (
          <div className="flex flex-col gap-6">
            <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                Top Downloaded Images
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {inspos
                  .flatMap((inspo) =>
                    inspo.sections.flatMap((section) =>
                      section.images.map((img) => ({
                        ...img,
                        boardTitle: inspo.title,
                        sectionTitle: section.title,
                      })),
                    ),
                  )
                  .sort(
                    (a, b) => (b.downloadCount || 0) - (a.downloadCount || 0),
                  )
                  .slice(0, 24)
                  .map((img, idx) => (
                    <div
                      key={idx}
                      className="relative flex flex-col gap-2 rounded-lg border border-stroke p-3 dark:border-strokedark"
                    >
                      <CldImage
                        width="200"
                        height="200"
                        src={img.public_id}
                        alt="Inspo"
                        className="h-32 w-full rounded object-cover"
                      />
                      <div className="flex flex-col">
                        <p className="text-xs text-gray-500">
                          {img.boardTitle} &gt; {img.sectionTitle}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm font-semibold text-black dark:text-white">
                            Downloads:
                          </span>
                          <span className="rounded bg-primary px-2 py-0.5 text-xs text-white">
                            {img.downloadCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6 bg-white">
        <div className="flex gap-4 border-b border-stroke pb-4 dark:border-strokedark">
          <button
            onClick={() => {
              setActiveTab("boards");
              setSelectedInspo(null);
            }}
            className={`px-4 py-2 text-lg font-medium transition-colors ${
              activeTab === "boards"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-primary"
            }`}
          >
            Boards
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 text-lg font-medium transition-colors ${
              activeTab === "analytics"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-primary"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("downloads")}
            className={`px-4 py-2 text-lg font-medium transition-colors ${
              activeTab === "downloads"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-primary"
            }`}
          >
            Top Downloads
          </button>
        </div>

        {renderTabContent()}
      </div>

      {/* Add Inspo Modal */}
      {showAddInspoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg dark:bg-boxdark">
            <h3 className="mb-4 text-lg font-bold text-black dark:text-white">
              Create New Board
            </h3>
            <input
              type="text"
              placeholder="Board Title"
              value={newInspoTitle}
              onChange={(e) => setNewInspoTitle(e.target.value)}
              className="mb-4 w-full rounded border border-stroke p-2 dark:border-strokedark dark:bg-meta-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddInspoModal(false)}
                className="rounded px-4 py-2 text-gray-500 hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInspo}
                className="rounded bg-primary px-4 py-2 text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg dark:bg-boxdark">
            <h3 className="mb-4 text-lg font-bold text-black dark:text-white">
              Add New Section
            </h3>
            <input
              type="text"
              placeholder="Section Title"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              className="mb-4 w-full rounded border border-stroke p-2 dark:border-strokedark dark:bg-meta-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="rounded px-4 py-2 text-gray-500 hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                className="rounded bg-primary px-4 py-2 text-white"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default InsposPage;

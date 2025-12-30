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
      const sections = [...selectedInspo.sections];
      sections[sectionIndex].images.push(publicId);

      try {
        const res = await axios.put(`/api/inspos?id=${selectedInspo._id}`, {
          sections,
        });
        if (res.status === 200) {
          updateInspoState(res.data.data);
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
        Swal.fire("Error", "Failed to update title", "error");
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

  return (
    <DefaultLayout>
      {/* <Breadcrumb pageName="Inspirations" /> */}

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
                // Collect first 3 images from all sections combined for the preview
                const allImages = inspo.sections.flatMap((s) => s.images);
                const previewImages = allImages.slice(0, 3);
                // If fewer than 3 images, fill with nulls to maintain layout if needed,
                // or just render what we have. Pinterest style usually has one big left, two small right.

                return (
                  <div
                    key={inspo._id}
                    className="group cursor-pointer"
                    onClick={() => setSelectedInspo(inspo)}
                  >
                    {/* Pinterest-like Image Grid */}
                    <div className="relative mb-3 flex h-60 gap-1 overflow-hidden rounded-2xl bg-gray-100 dark:bg-meta-4">
                      {/* Left Side (Large Image) */}
                      <div className="relative h-full w-2/3 overflow-hidden rounded-l-2xl">
                        {previewImages[0] ? (
                          <CldImage
                            width="400"
                            height="400"
                            src={previewImages[0]}
                            alt="Cover"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400 dark:bg-gray-700">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Right Side (Two Small Images) */}
                      <div className="flex h-full w-1/3 flex-col gap-1">
                        <div className="relative h-1/2 w-full overflow-hidden rounded-tr-2xl">
                          {previewImages[1] ? (
                            <CldImage
                              width="200"
                              height="200"
                              src={previewImages[1]}
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
                              src={previewImages[2]}
                              alt="Preview 3"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400 dark:bg-gray-700"></div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Board Info */}
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
                        {inspo.sections.length} Sections • {allImages.length}{" "}
                        Pins
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
                        {section.images.map((imgId, imgIndex) => (
                          <div key={imgIndex} className="group relative">
                            <CldImage
                              width="600"
                              height="600"
                              src={imgId}
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

"use client";
import { Ipackage } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { thirdFont } from "@/app/lib/fonts";
import { UploadButton } from "@/utils/uploadthing";

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  package?: Ipackage & { _id: string };
  setPackages: React.Dispatch<React.SetStateAction<(Ipackage & { _id: string })[]>>;
}

const PackageModal = ({ isOpen, onClose, package: packageItem, setPackages }: PackageModalProps) => {
  const [formData, setFormData] = useState<Ipackage>({
    name: "",
    imgUrl: "",
    price: 0,
    duration: "",
    items: [],
    notes: [],
  });

  const [newItem, setNewItem] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  useEffect(() => {
    if (packageItem) {
      setFormData({
        name: packageItem.name,
        imgUrl: packageItem.imgUrl,
        price: packageItem.price,
        duration: packageItem.duration,
        items: [...packageItem.items],
        notes: [...packageItem.notes],
      });
    } else {
      setFormData({
        name: "",
        imgUrl: "",
        price: 0,
        duration: "",
        items: [],
        notes: [],
      });
    }
  }, [packageItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (packageItem) {
        // Update existing package
        const response = await axios.put(`/api/packages?packageID=${packageItem._id}`, formData);
        
        if (response.status === 200) {
          setPackages((prevPackages) =>
            prevPackages.map((p) =>
              p._id === packageItem._id ? response.data.data : p
            )
          );

          Swal.fire({
            background: '#FFFFF',
            color: 'black',
            toast: false,
            iconColor: '#473728',
            position: 'bottom-right',
            text: 'PACKAGE UPDATED SUCCESSFULLY',
            showConfirmButton: false,
            timer: 2000,
            customClass: {
              popup: 'no-rounded-corners small-popup',
            },
          });
        }
      } else {
        // Create new package
        const response = await axios.post("/api/packages", formData);
        
        if (response.status === 201) {
          setPackages((prevPackages) => [response.data.data, ...prevPackages]);

          Swal.fire({
            background: '#FFFFF',
            color: 'black',
            toast: false,
            iconColor: '#473728',
            position: 'bottom-right',
            text: 'PACKAGE CREATED SUCCESSFULLY',
            showConfirmButton: false,
            timer: 2000,
            customClass: {
              popup: 'no-rounded-corners small-popup',
            },
          });
        }
      }
      
      onClose();
    } catch (error: any) {
      console.error("Error saving package:", error);
      Swal.fire({
        background: '#FFFFF',
        color: 'black',
        toast: false,
        iconColor: '#473728',
        position: 'bottom-right',
        text: 'SAVE FAILED',
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: 'no-rounded-corners small-popup',
        },
      });
    }
  };

  const addItem = () => {
    if (newItem.trim()) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem.trim()]
      }));
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const addNote = () => {
    if (newNote.trim()) {
      setFormData(prev => ({
        ...prev,
        notes: [...prev.notes, newNote.trim()]
      }));
      setNewNote("");
    }
  };
  const editNote = (index: number) => {
    if (editingNoteText.trim()) {
      setFormData(prev => ({
        ...prev,
        notes: prev.notes.map((note, i) => i === index ? editingNoteText.trim() : note)
      }));
      setEditingNoteIndex(null);
      setEditingNoteText("");
    }
  };

  const startEditNote = (index: number, noteText: string) => {
    setEditingNoteIndex(index);
    setEditingNoteText(noteText);
  };

  const cancelEditNote = () => {
    setEditingNoteIndex(null);
    setEditingNoteText("");
  };

  const removeNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 md:pl-72.5 flex items-center justify-center z-50">
      <div className="bg-creamey text-primary/80 input:bg-creamey  rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] border-primary overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`${thirdFont.className} text-2xl`}>
            {packageItem ? "Edit Package" : "Add New Package"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-primary"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Package Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-primary/50 bg-creamey rounded-md focus:outline-none focus:ring-2 focus:ring-primaryLight"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Image *
            </label>
            {formData.imgUrl && (
              <div className="mb-2">
                <img
                  src={formData.imgUrl}
                  alt="Package"
                  className="w-32 h-32 object-cover rounded border border-primary/50"
                />
              </div>
            )}
            <UploadButton
              endpoint="mediaUploader"
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  setFormData(prev => ({ ...prev, imgUrl: res[0].url }));
                }
              }}
              onUploadError={(error: Error) => {
                console.error("Upload error:", error);
                alert(`ERROR! ${error.message}`);
              }}
              className="mt-2 bg-primary w-fit rounded-md px-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Price (LE) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-primary/50 bg-creamey rounded-md focus:outline-none focus:ring-2 focus:ring-primaryLight"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Duration *
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 30 days, 3 months"
                className="w-full px-3 py-2 border border-primary/50 bg-creamey rounded-md focus:outline-none focus:ring-2 focus:ring-primaryLight"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Items
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add an item"
                className="flex-1 px-3 py-2 border border-primary/50 bg-creamey rounded-md focus:outline-none focus:ring-2 focus:ring-primaryLight"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
              />
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-creamey border border-primary/50 rounded">
                  <span className="flex-1">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Notes
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note"
                className="flex-1 px-3 py-2 border border-primary/50 bg-creamey rounded-md focus:outline-none focus:ring-2 focus:ring-primaryLight"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNote())}
              />
              <button
                type="button"
                onClick={addNote}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {formData.notes.map((note, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-creamey border border-primary/50 rounded">
                  {editingNoteIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        className="flex-1 px-2 py-1 border border-primary/50 bg-creamey rounded focus:outline-none focus:ring-2 focus:ring-primaryLight"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), editNote(index))}
                        onKeyDown={(e) => e.key === 'Escape' && cancelEditNote()}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => editNote(index)}
                        className="text-green-500 hover:text-green-700"
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditNote}
                        className="text-gray-500 hover:text-gray-700"
                        title="Cancel"
                      >
                        ✗
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">{note}</span>
                      <button
                        type="button"
                        onClick={() => startEditNote(index, note)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNote(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">

            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary"
            >
              {packageItem ? "Update Package" : "Create Package"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2  text-primary rounded-md border border-primary/60 hover:bg-primary hover:text-creamey"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageModal; 
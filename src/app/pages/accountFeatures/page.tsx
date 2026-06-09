"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { IAccountFeature } from "@/interfaces/interfaces";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import AccountFeatureComponent from "@/components/AccountFeatureComponent";
import AccountFeatureModal from "@/components/AccountFeatureModal";
import { IoAdd } from "react-icons/io5";

const AccountFeaturesPage = () => {
  const [features, setFeatures] = useState<(IAccountFeature & { _id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<(IAccountFeature & { _id: string }) | undefined>(undefined);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/accountFeatures?all=true");
      setFeatures(res.data.data || []);
    } catch (error) {
      console.error("Error fetching account features", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const filteredFeatures = features.filter(
    (f) =>
      f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.featureKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedFeature(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (feature: IAccountFeature & { _id: string }) => {
    setSelectedFeature(feature);
    setIsModalOpen(true);
  };

  return (
    <DefaultLayout>
      <div className="w-full min-h-[calc(100vh-124px)] p-4 md:p-6 2xl:p-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md rounded-lg border border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-opacity-90"
          >
            <IoAdd className="text-xl" />
            Add Feature
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-lg">Loading...</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredFeatures.length === 0 ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-sm border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
                <div className="text-gray-500">No account features found.</div>
              </div>
            ) : (
              filteredFeatures.map((feature) => (
                <AccountFeatureComponent
                  key={feature._id}
                  feature={feature}
                  fetchFeatures={fetchFeatures}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>
        )}

        <AccountFeatureModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          feature={selectedFeature}
          fetchFeatures={fetchFeatures}
        />
      </div>
    </DefaultLayout>
  );
};

export default AccountFeaturesPage;

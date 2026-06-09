import React, { useState, useEffect } from "react";
import axios from "axios";
import { IAccountFeature, Ipackage } from "@/interfaces/interfaces";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature?: IAccountFeature & { _id: string };
  fetchFeatures: () => void;
}

const AccountFeatureModal = ({ isOpen, onClose, feature, fetchFeatures }: Props) => {
  const [featureKey, setFeatureKey] = useState("");
  const [label, setLabel] = useState("");
  const [accessType, setAccessType] = useState<boolean>(false); // false = free, true = subscription
  const [requiredPackages, setRequiredPackages] = useState<string[]>([]);
  const [availablePackages, setAvailablePackages] = useState<(Ipackage & { _id: string })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
      if (feature) {
        setFeatureKey(feature.featureKey);
        setLabel(feature.label);
        setAccessType(feature.accessType === "subscription");
        // Check if requiredPackages are populated objects or strings
        const packageIds = feature.requiredPackages.map((p: any) => p._id || p);
        setRequiredPackages(packageIds);
      } else {
        setFeatureKey("");
        setLabel("");
        setAccessType(false);
        setRequiredPackages([]);
      }
    }
  }, [isOpen, feature]);

  const fetchPackages = async () => {
    try {
      const res = await axios.get("/api/packages?all=true");
      setAvailablePackages(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch packages", err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = {
        featureKey,
        label,
        accessType: accessType ? "subscription" : "free",
        requiredPackages,
      };

      if (feature) {
        await axios.put(`/api/accountFeatures?featureID=${feature._id}`, data);
      } else {
        await axios.post("/api/accountFeatures", data);
      }

      fetchFeatures();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 dark:bg-boxdark"
      >
        <h2 className="mb-4 text-xl font-bold dark:text-white">
          {feature ? "Edit Account Feature" : "Add Account Feature"}
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Feature Key
          </label>
          <input
            type="text"
            value={featureKey}
            onChange={(e) => setFeatureKey(e.target.value)}
            placeholder="e.g. max_videos"
            className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Max Videos Uploaded"
            className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Access Type
          </label>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${!accessType ? "font-bold text-black dark:text-white" : "text-gray-500"}`}>
              Free
            </span>
            <div
              onClick={() => setAccessType(!accessType)}
              className={`relative flex h-6 w-12 cursor-pointer items-center rounded-full p-1 duration-300 ease-in-out ${
                accessType ? "bg-primary" : "bg-stroke dark:bg-form-strokedark"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white shadow-sm duration-300 ease-in-out ${
                  accessType ? "translate-x-6" : ""
                }`}
              />
            </div>
            <span className={`text-sm ${accessType ? "font-bold text-black dark:text-white" : "text-gray-500"}`}>
              Subscription
            </span>
          </div>
        </div>

        {accessType && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Required Packages
            </label>
            <div className="flex flex-col gap-2 rounded border border-stroke p-3 dark:border-form-strokedark max-h-48 overflow-y-auto">
              {availablePackages.map((pkg) => (
                <label key={pkg._id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={requiredPackages.includes(pkg._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRequiredPackages([...requiredPackages, pkg._id]);
                      } else {
                        setRequiredPackages(
                          requiredPackages.filter((id) => id !== pkg._id)
                        );
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm dark:text-white">{pkg.name}</span>
                </label>
              ))}
              {availablePackages.length === 0 && (
                <p className="text-sm text-gray-500">No packages available.</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded border border-primary px-6 py-2 text-primary hover:bg-primary/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded bg-primary px-6 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountFeatureModal;

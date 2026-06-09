import React, { useState } from "react";
import axios from "axios";
import { IAccountFeature } from "@/interfaces/interfaces";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

interface Props {
  feature: IAccountFeature & { _id: string };
  fetchFeatures: () => void;
  onEdit: (feature: IAccountFeature & { _id: string }) => void;
}

const AccountFeatureComponent = ({ feature, fetchFeatures, onEdit }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the feature "${feature.label}"?`)) {
      setIsDeleting(true);
      try {
        await axios.delete(`/api/accountFeatures?featureID=${feature._id}`);
        fetchFeatures();
      } catch (error) {
        console.error("Failed to delete account feature", error);
        alert("Failed to delete account feature");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-form-strokedark dark:bg-boxdark">
      <div>
        <h3 className="font-medium text-black dark:text-white">{feature.label}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Key: <span className="font-mono text-xs">{feature.featureKey}</span>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-block rounded px-2.5 py-0.5 text-xs font-medium ${
              feature.accessType === "subscription"
                ? "bg-primary/10 text-primary"
                : "bg-success/10 text-success"
            }`}
          >
            {feature.accessType === "subscription" ? "Subscription" : "Free"}
          </span>
          {feature.accessType === "subscription" && feature.requiredPackages && feature.requiredPackages.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {feature.requiredPackages.length} package(s) required
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onEdit(feature)}
          className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary"
          title="Edit"
        >
          <FiEdit2 size={18} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-500 disabled:opacity-50"
          title="Delete"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default AccountFeatureComponent;

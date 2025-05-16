'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShippingZone } from '@/interfaces/interfaces';
import ZoneStates from './ZoneStates';

interface Props {
  type: 'edit' | 'delete' | 'add';
  zone: ShippingZone;
  closeModal: () => void;
  refreshZones: () => void;
}

const ShippingZoneModal = ({ type, zone, closeModal, refreshZones }: Props) => {
  const [zoneName, setZoneName] = useState(zone?.zone_name || '');
  const [zoneRate, setZoneRate] = useState(zone?.zone_rate || 0);
  const [zoneStates, setZoneStates] = useState<string[]>([]); // State IDs

  const handleSave = async () => {
    try {
      await axios.put(`/api/shipping-zones?zoneID=${zone._id}`, {
        zone_name: zoneName,
        zone_rate: zoneRate,
      });
      refreshZones();
      closeModal();
    } catch (err) {
      console.error('Error updating zone:', err);
    }
  };

  const addNewZone = async () => {
    console.log( zoneRate, zoneName);
    try {
      await axios.post(`/api/shipping-zones`, {
        zone_name: zoneName,
        zone_rate: zoneRate,
      });
      refreshZones();
      closeModal();
    } catch (err) {
      console.error('Error adding zone:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/shipping-zones`, {
        data: { zoneID: zone._id },
      });
      refreshZones();
      closeModal();
    } catch (err) {
      console.error('Error deleting zone:', err);
    }
  };

  return (
    <div onClick={closeModal} className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 max-h-[95vh] overflow-y-scroll rounded w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">
          {type === 'edit' ? 'Edit Shipping Zone' : type === 'add' ? 'Add Shipping Zone' : 'Delete Shipping Zone'}
        </h2>

        {type === 'delete' ? (
          <>
            <p>Are you sure you want to delete <strong>{zone.zone_name}</strong>?</p>
            <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded mt-4">
              Delete
            </button>
          </>
        ) : (
          <>
            <label className="block mb-2">Zone Name</label>
            <input
              type="text"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <label className="block mb-2">Zone Rate</label>
            <input
              type="number"
              value={zoneRate}
              onChange={(e) => setZoneRate(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <ZoneStates zoneId={zone._id} zoneStates={zoneStates} setZoneStates={setZoneStates} />

            <button
              onClick={type === 'edit' ? handleSave : addNewZone}
              className="bg-primary text-white px-4 py-2 rounded mr-2 mt-4"
            >
              {type === 'edit' ? 'Save Changes' : 'Add Zone'}
            </button>
          </>
        )}

        <button onClick={closeModal} className="ml-2 mt-4 text-gray-600 underline">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ShippingZoneModal;

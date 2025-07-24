import React, { useState } from 'react';
import { RoyaltyBonus } from '@/interfaces/interfaces';

type Props = {
  royaltyPoint: RoyaltyBonus;
  onClose: () => void;
  onRoyaltyPointUpdated: (royaltyPoint: RoyaltyBonus) => void;
};

const EditRoyaltyPointModal: React.FC<Props> = ({ royaltyPoint, onClose, onRoyaltyPointUpdated }) => {
  const [form, setForm] = useState({
    title: royaltyPoint.title,
    description: royaltyPoint.description,
    bonusPoints: royaltyPoint.bonusPoints,
    active: royaltyPoint.active,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/loyalty/loyaltyPoints/${royaltyPoint._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, bonusPoints: Number(form.bonusPoints) }),
      });
      if (!res.ok) throw new Error('Failed to update loyalty point');
      const updated = await res.json();
      onRoyaltyPointUpdated(updated);
      onClose();
    } catch (err) {
      setError('Failed to update loyalty point');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Loyalty Point</h2>
        <form onSubmit={handleSubmit}>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full mb-2 p-2 border rounded" required />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full mb-2 p-2 border rounded" required />
          <input name="bonusPoints" type="number" value={form.bonusPoints} onChange={handleChange} placeholder="Bonus Points" className="w-full mb-2 p-2 border rounded" required min={1} />
          <label className="flex items-center mb-2">
            <input type="checkbox" name="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="mr-2" />
            Active
          </label>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoyaltyPointModal; 
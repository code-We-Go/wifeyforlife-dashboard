'use client'

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { IUser } from '@/app/models/userModel';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

const UsersPage = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalType, setModalType] = useState<'edit' | 'delete' | 'add' | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptionModal, setSubscriptionModal] = useState<{ type: 'view' | 'add' | null, user: IUser | null }>({ type: null, user: null });
  const [availablePackages, setAvailablePackages] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`/api/users?page=${page}&search=${searchQuery}`);
        setUsers(res.data.data.users);
        setTotalPages(res.data.data.pagination.totalPages);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [page, searchQuery]);

  const openModal = (type: 'edit' | 'delete' | 'add', user?: IUser) => {
    setModalType(type);
    setSelectedUser(user || null);
  };

  const handleDelete = async (userId: string) => {
    try {
      await axios.delete(`/api/users?userId=${userId}`);
      // Refresh the users list
      const res = await axios.get(`/api/users?page=${page}`);
      setUsers(res.data.data.users);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleSubscriptionClick = (user: IUser) => {
    if (user.subscription?.subscribed) {
      setSubscriptionModal({ type: 'view', user });
    } else {
      // Fetch packages from API when opening the add modal
      axios.get('/api/packages?all=true')
        .then(res => {
          setAvailablePackages(res.data.data.map((pkg: any) => ({ _id: pkg._id, name: pkg.name })));
          setSubscriptionModal({ type: 'add', user });
        })
        .catch(() => {
          setAvailablePackages([]);
          setSubscriptionModal({ type: 'add', user });
        });
    }
  };

  return (
    <DefaultLayout>
      <div className="px-1 overflow-hidden md:px-2 py-2 md:py-4 w-full h-auto min-h-screen flex flex-col justify-start items-center gap-4 bg-backgroundColor">
        <div className="text-primary w-[97%] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            className='bg-primary text-sm text-creamey px-4 py-2 rounded-2xl hover:cursor-pointer'
            onClick={() => openModal('add')}
          >ADD USER</button>
        </div>

        {/* Table */}
        {users.length > 0 ? (
          <table className="w-[97%] text-left border border-gray-300 rounded">
            <thead className="bg-secondary text-white text-sm">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Username</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Subscription</th>
                <th className="p-2 border">Created At</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody className='bg-white'>
              {users.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50 text-sm">
                  <td className="p-2 border">{(page - 1) * 10 + index + 1}</td>
                  <td className="p-2 border">
                    <div className="flex items-center gap-2">
                      {user.imageURL && user.imageURL.trim() !== '' ? (
                        <img
                          src={user.imageURL}
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-base border">
                          {user.username
                            ? user.username
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                            : '?'}
                        </div>
                      )}
                      <span>{user.username}</span>
                    </div>
                  </td>
                  <td className="p-2 border">{user.email}</td>
                  <td className="p-2 border">{user.role}</td>
                  <td
                    className="p-2 border cursor-pointer text-blue-600 underline"
                    onClick={() => handleSubscriptionClick(user)}
                  >
                    {user.subscription?.subscribed ? 'Yes' : 'No'}
                  </td>
                  <td className="p-2 border">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() => openModal('edit', user)}
                      className="text-blue-600 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-red-600 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <h1>No users found</h1>
        )}

        {/* Pagination */}
        <div className="flex items-center gap-4 mt-4">
          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-lg">Page {page} of {totalPages}</span>
          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>

        {/* Add User Modal */}
        {modalType === 'add' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4">Add New User</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await axios.post('/api/users', {
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    role: formData.get('role'),
                    // isSubscriped: formData.get('subscription') === 'true'
                  });
                  setModalType(null);
                  // Refresh users list
                  const res = await axios.get(`/api/users?page=${page}`);
                  setUsers(res.data.data.users);
                } catch (error) {
                  console.error("Error adding user:", error);
                }
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" className="w-full p-2 border rounded">
                    <option value="customer">Customer</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Subscription</label>
                  <select name="subscription" className="w-full p-2 border rounded">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div> */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-white rounded"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {modalType === 'edit' && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await axios.put(`/api/users?userId=${selectedUser._id}`, {
                    username: formData.get('username'),
                    email: formData.get('email'),
                    role: formData.get('role'),
                    // isSubscribed: formData.get('subscription') === 'true',
                    emailVerified: formData.get('emailVerified') === 'true',
                  });
                  setModalType(null);
                  // Refresh users list
                  const res = await axios.get(`/api/users?page=${page}`);
                  setUsers(res.data.data.users);
                } catch (error) {
                  console.error("Error updating user:", error);
                }
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    defaultValue={selectedUser.username}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedUser.email}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    name="role"
                    defaultValue={selectedUser.role}
                    className="w-full p-2 border rounded"
                  >
                    <option value="customer">Customer</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email Verified</label>
                  <select
                    name="emailVerified"
                    defaultValue={selectedUser.emailVerified ? 'true' : 'false'}
                    className="w-full p-2 border rounded"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Subscription</label>
                  <select
                    name="subscription"
                    defaultValue={selectedUser.subscription?.subscribed?"true":"false"}
                    className="w-full p-2 border rounded"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div> */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-white rounded"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Subscription Modals */}
        {subscriptionModal.type === 'view' && subscriptionModal.user && (
          <SubscriptionInfoModal
            user={subscriptionModal.user}
            availablePackages={availablePackages}
            setAvailablePackages={setAvailablePackages}
            onClose={() => setSubscriptionModal({ type: null, user: null })}
            onUserRefresh={async () => {
              // Refresh users list after update
              const res = await axios.get(`/api/users?page=${page}`);
              setUsers(res.data.data.users);
            }}
          />
        )}

        {subscriptionModal.type === 'add' && subscriptionModal.user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold mb-4">Add Subscription</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  // 1. Create the subscription with selected packageID and other fields
                  const subRes = await axios.post('/api/subscriptions', {
                    paymentID: formData.get('paymentID'),
                    packageID: formData.get('packageID'),
                    email: subscriptionModal.user?.email,
                    subscribed: true,
                    expiryDate: formData.get('expiryDate'),
                  });
                  const newSubscriptionId = subRes.data.data._id || subRes.data.data.subscription?._id;
                  // 2. Update the user with the new subscription ID
                  await axios.put(`/api/users?userId=${subscriptionModal.user!._id}`, {
                    subscription: newSubscriptionId,
                  });
                  setSubscriptionModal({ type: null, user: null });
                  // Refresh users list
                  const res = await axios.get(`/api/users?page=${page}`);
                  setUsers(res.data.data.users);
                } catch (error) {
                  console.error("Error adding subscription and updating user:", error);
                }
              }}>
                <label className="block text-sm font-medium mb-1">Payment ID</label>
                <input
                  type="text"
                  name="paymentID"
                  className="w-full p-2 border rounded"
                  required
                />
                <label className="block text-sm font-medium mb-1 mt-2">Package</label>
                <select
                  name="packageID"
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select a package</option>
                  {availablePackages.map(pkg => (
                    <option key={pkg._id} value={pkg._id}>{pkg.name}</option>
                  ))}
                </select>
                <label className="block text-sm font-medium mb-1 mt-2">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  className="w-full p-2 border rounded"
                  required
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setSubscriptionModal({ type: null, user: null })}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-white rounded"
                  >
                    Add Subscription
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default UsersPage;

const SubscriptionInfoModal = ({ user, availablePackages, setAvailablePackages, onClose, onUserRefresh }: {
  user: IUser,
  availablePackages: { _id: string; name: string }[],
  setAvailablePackages: React.Dispatch<React.SetStateAction<{ _id: string; name: string }[]>>,
  onClose: () => void,
  onUserRefresh: () => void,
}) => {
  const [subData, setSubData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSub = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch latest subscription data
        const res = await axios.get(`/api/subscriptions?id=${user.subscription?._id}`);
        setSubData(res.data.data[0] || user.subscription);
        // Fetch packages if not already loaded
        if (!availablePackages.length) {
          const pkgRes = await axios.get('/api/packages?all=true');
          setAvailablePackages(pkgRes.data.data.map((pkg: any) => ({ _id: pkg._id, name: pkg.name })));
        }
      } catch (err) {
        setError('Failed to load subscription data');
      }
      setLoading(false);
    };
    fetchSub();
    // eslint-disable-next-line
  }, [user]);

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 text-center">Loading...</div>
    </div>
  );
  if (error) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 text-center">{error}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Edit Subscription</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          const formData = new FormData(e.currentTarget);
          try {
            await axios.put(`/api/subscriptions?subscriptionID=${subData._id}`, {
              paymentID: formData.get('paymentID'),
              packageID: formData.get('packageID'),
              expiryDate: formData.get('expiryDate'),
              subscribed: formData.get('subscribed') === 'true',
            });
            setSaving(false);
            onClose();
            await onUserRefresh();
          } catch (err) {
            setError('Failed to update subscription');
            setSaving(false);
          }
        }}>
          <label className="block text-sm font-medium mb-1">Payment ID</label>
          <input
            type="text"
            name="paymentID"
            className="w-full p-2 border rounded"
            defaultValue={subData.paymentID}
            required
          />
          <label className="block text-sm font-medium mb-1 mt-2">Package</label>
          <select
            name="packageID"
            className="w-full p-2 border rounded"
            defaultValue={subData.packageID?._id || subData.packageID}
            required
          >
            <option value="">Select a package</option>
            {availablePackages.map(pkg => (
              <option key={pkg._id} value={pkg._id}>{pkg.name}</option>
            ))}
          </select>
          <label className="block text-sm font-medium mb-1 mt-2">Expiry Date</label>
          <input
            type="date"
            name="expiryDate"
            className="w-full p-2 border rounded"
            defaultValue={subData.expiryDate ? subData.expiryDate.slice(0,10) : ''}
            required
          />
          {/* <label className="block text-sm font-medium mb-1 mt-2">Subscribed</label>
          <select
            name="subscribed"
            className="w-full p-2 border rounded"
            defaultValue={subData.subscribed ? 'true' : 'false'}
            required
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select> */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-white rounded"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
        </form>
      </div>
    </div>
  );
};

'use client';

import { useState, useEffect, useCallback } from 'react';
import UserBadge from '@/components/UserBadge';
import { User } from '@/lib/types';
import { auth } from '@/lib/firebase-client';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', display_name: '', role: 'member', wa_phone: '' });
  const [adding, setAdding] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      setCurrentUserEmail(user.email || '');
      const token = await user.getIdToken();
      
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Unable to load users. Please refresh or contact your administrator.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : '';
      
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(addForm)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create user');
      }
      
      setShowAddModal(false);
      setAddForm({ email: '', display_name: '', role: 'member', wa_phone: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (email === currentUserEmail) {
      alert("You cannot remove yourself.");
      return;
    }
    
    if (!confirm(`Are you sure you want to remove ${email}? They will no longer be able to log in.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : '';
      
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to remove user');
      
      fetchUsers();
    } catch (err: any) {
      alert('Failed to remove user. ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full relative space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team access and roles.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">{error}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">WhatsApp Phone</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No users found.</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{user.display_name || '-'}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4"><UserBadge role={user.role} /></td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 ${user.is_active ? 'text-green-600' : 'text-red-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {user.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{user.wa_phone || '-'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={user.email === currentUserEmail || deletingId === user.id}
                          className="text-red-600 hover:text-red-800 font-medium disabled:opacity-30 transition-colors"
                        >
                          {deletingId === user.id ? 'Removing...' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New User</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></label>
                <input 
                   type="email" 
                   required
                   value={addForm.email}
                   onChange={e => setAddForm({...addForm, email: e.target.value})}
                   className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Display Name</label>
                <input 
                   type="text" 
                   value={addForm.display_name}
                   onChange={e => setAddForm({...addForm, display_name: e.target.value})}
                   className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Role <span className="text-red-500">*</span></label>
                <select 
                   required
                   value={addForm.role}
                   onChange={e => setAddForm({...addForm, role: e.target.value})}
                   className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="leader">Leader</option>
                  <option value="admin">Admin</option>
                  <option value="stakeholder">Stakeholder</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">WhatsApp Phone (Optional)</label>
                <input 
                   type="text" 
                   placeholder="+62812345678"
                   value={addForm.wa_phone}
                   onChange={e => setAddForm({...addForm, wa_phone: e.target.value})}
                   className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:ring-blue-500 focus:border-blue-500" 
                />
                <p className="text-xs text-gray-500">Include country code, e.g., +62</p>
              </div>

              <div className="mt-6 flex gap-3 justify-end pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {adding ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

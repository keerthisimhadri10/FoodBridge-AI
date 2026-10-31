import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Users, ShieldAlert, CheckCircle2, Building2 } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string, name: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Change status of "${name}" to ${nextStatus}?`)) return;
    setFeedback(null);
    try {
      await api.toggleUserStatus(id, nextStatus);
      setFeedback({ type: 'success', message: `User "${name}" status changed to ${nextStatus}.` });
      await loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Status change failed.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">User & Organization Accounts</h1>
        <p className="text-xs text-stone-600 mt-1">Manage platform participants and enforce account access security.</p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-600">✕</button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-stone-200/70 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Linked Organization</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-stone-900">{u.name}</div>
                    <div className="text-stone-500 font-mono text-[11px]">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-900'
                          : u.role === 'DONOR'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-stone-700">
                    {u.organization ? (
                      <div>
                        <div className="font-medium text-stone-900">{u.organization.name}</div>
                        <div className="text-[11px] text-stone-400">{u.organization.type}</div>
                      </div>
                    ) : (
                      <span className="text-stone-400">Direct Staff</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.accountStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.accountStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggleStatus(u.id, u.accountStatus, u.name)}
                        className={`px-3 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                          u.accountStatus === 'ACTIVE'
                            ? 'bg-stone-100 hover:bg-rose-100 hover:text-rose-800 text-stone-600'
                            : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

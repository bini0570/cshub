import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, Ban, CheckCircle, UserCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatters';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const loadUsers = () => {
    const list = JSON.parse(localStorage.getItem('cshub_users') || '[]');
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = (targetUser) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    const updated = users.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatus } : u));
    localStorage.setItem('cshub_users', JSON.stringify(updated));
    setUsers(updated);
  };

  const handleToggleRole = (targetUser) => {
    // Only allow promoting/demoting non-super-admins
    if (targetUser.role === 'super_admin') {
      alert('Super administrator roles cannot be modified directly.');
      return;
    }
    const nextRole = targetUser.role === 'admin' ? 'student' : 'admin';
    const updated = users.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u));
    localStorage.setItem('cshub_users', JSON.stringify(updated));
    setUsers(updated);
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-navy-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-teal-500" />
            User Directory & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search registered students, review account statuses, and manage role assignments.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-b border-slate-200 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold">Registered</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors"
                >
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {u.display_name ? u.display_name.charAt(0) : 'U'}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {u.display_name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : u.role === 'admin'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {formatDate(u.created_at)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.role !== 'super_admin' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRole(u)}
                            title={u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </Button>
                          <Button
                            variant={u.status === 'active' ? 'danger' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Restore'}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

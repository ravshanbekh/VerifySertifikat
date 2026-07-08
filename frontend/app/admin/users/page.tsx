"use client";

import { useEffect, useState } from "react";
import { usersApi, type User } from "@/lib/api";
import { Plus, Trash2, Shield, UserX } from "lucide-react";
import toast from "react-hot-toast";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "operator" });

  const fetchUsers = async () => {
    try {
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch { toast.error("Xodimlarni yuklashda xato"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.create(form);
      toast.success("Xodim yaratildi");
      setShowForm(false);
      setForm({ full_name: "", email: "", password: "", role: "operator" });
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xato");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}"ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await usersApi.delete(id);
      toast.success("Xodim o'chirildi");
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xato");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Xodimlar</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium"><span className="font-bold text-slate-700 dark:text-slate-300">{users.length}</span> ta xodim ro'yxatdan o'tgan</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Yangi xodim
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8 shadow-sm dark:shadow-none animate-pop-in">
          <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">Yangi xodim qo&apos;shish</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-sm mb-2">F.I.Sh</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="To'liq ism"
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-sm mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@itlive.uz"
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-sm mb-2">Parol</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Kamida 6 belgi"
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-sm mb-2">Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium cursor-pointer"
              >
                <option value="operator">Operator</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all">
                Bekor qilish
              </button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md">
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-none animate-slide-up stagger-1">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-slate-100 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Ism</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Email</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Rol</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white text-sm font-bold">{user.full_name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium text-sm">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.role === "super_admin" ? (
                        <span className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 text-xs font-bold px-3 py-1 rounded-full">
                          <Shield className="w-3.5 h-3.5" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 text-xs font-bold px-3 py-1 rounded-full">
                          Operator
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(user.id, user.full_name)}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-all"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

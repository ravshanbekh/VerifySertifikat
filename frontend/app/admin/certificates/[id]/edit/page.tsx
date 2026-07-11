"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { certificateApi, type Certificate } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function EditCertificatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    full_name: "",
    course_name: "",
    course_description: "",
    course_start_date: "",
    course_end_date: "",
    serial_number: "",
  });

  useEffect(() => {
    certificateApi.getById(id)
      .then((res) => {
        const c = res.data as Certificate;
        setForm({
          full_name: c.full_name,
          course_name: c.course_name,
          course_description: c.course_description || "",
          course_start_date: c.course_start_date.split("T")[0],
          course_end_date: c.course_end_date.split("T")[0],
          serial_number: c.serial_number,
        });
      })
      .catch(() => {
        toast.error("Ma'lumotlarni yuklashda xato");
        router.push("/admin/certificates");
      })
      .finally(() => setFetching(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.course_name) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }
    setLoading(true);
    try {
      await certificateApi.update(id, form);
      toast.success("Sertifikat yangilandi!");
      router.push(`/admin/certificates/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xato yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-100 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8 animate-slide-in-right stagger-1">
        <Link href={`/admin/certificates/${id}`} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-sm hover:shadow-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Tahrirlash</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sertifikat ma&apos;lumotlarini o&apos;zgartirish</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none rounded-3xl p-8 animate-slide-up stagger-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
              Seriya raqami <span className="text-slate-400 dark:text-slate-500 font-medium">(Tahrirlash mumkin)</span>
            </label>
            <input
              value={form.serial_number}
              onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
              required
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
              Talaba F.I.Sh <span className="text-red-500">*</span>
            </label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
              Kurs nomi <span className="text-red-500">*</span>
            </label>
            <input
              value={form.course_name}
              onChange={(e) => setForm({ ...form, course_name: e.target.value })}
              required
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
              Kurs tavsifi <span className="text-slate-400 dark:text-slate-500 font-medium">(ixtiyoriy)</span>
            </label>
            <textarea
              value={form.course_description}
              onChange={(e) => setForm({ ...form, course_description: e.target.value })}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
                Boshlangan sana <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.course_start_date}
                onChange={(e) => setForm({ ...form, course_start_date: e.target.value })}
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
                Tugagan sana <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.course_end_date}
                onChange={(e) => setForm({ ...form, course_end_date: e.target.value })}
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href={`/admin/certificates/${id}`}
              className="flex-1 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold text-center transition-colors shadow-sm"
            >
              Bekor qilish
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

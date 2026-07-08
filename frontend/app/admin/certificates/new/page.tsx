"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { certificateApi } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    serial_series: "ITLA",
    serial_number: "",
    full_name: "",
    course_name: "",
    course_description: "",
    course_start_date: "",
    course_end_date: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.course_name || !form.course_start_date || !form.course_end_date) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        serial_series: form.serial_series,
        full_name: form.full_name,
        course_name: form.course_name,
        course_start_date: form.course_start_date,
        course_end_date: form.course_end_date,
      };
      if (form.serial_number) payload.serial_number = form.serial_number;
      if (form.course_description) payload.course_description = form.course_description;

      await certificateApi.create(payload);
      toast.success("Sertifikat muvaffaqiyatli yaratildi!");
      router.push("/admin/certificates");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xato yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8 animate-slide-in-right stagger-1">
        <Link href="/admin/certificates" className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-sm transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Yangi sertifikat</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Yangi sertifikat ma'lumotlarini kiriting</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm dark:shadow-none animate-slide-up stagger-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Serial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
                Seriya <span className="text-red-500">*</span>
              </label>
              <input
                value={form.serial_series}
                onChange={(e) => handleChange("serial_series", e.target.value.toUpperCase())}
                placeholder="ITLA"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
                Raqam <span className="text-slate-400 dark:text-slate-500 font-medium">(bo'sh qolsa avtomatik)</span>
              </label>
              <input
                value={form.serial_number}
                onChange={(e) => handleChange("serial_number", e.target.value)}
                placeholder="ITLA-000001 (ixtiyoriy)"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
              />
            </div>
          </div>

          {/* Talaba */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
              Talaba F.I.Sh <span className="text-red-500">*</span>
            </label>
            <input
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Alisher Abdullayev"
              required
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          {/* Kurs nomi */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
              Kurs nomi <span className="text-red-500">*</span>
            </label>
            <input
              value={form.course_name}
              onChange={(e) => handleChange("course_name", e.target.value)}
              placeholder="Frontend Development"
              required
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          {/* Kurs tavsifi */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
              Kurs tavsifi <span className="text-slate-400 dark:text-slate-500 font-medium">(ixtiyoriy)</span>
            </label>
            <textarea
              value={form.course_description}
              onChange={(e) => handleChange("course_description", e.target.value)}
              placeholder="Kurs haqida qisqacha ma'lumot..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none font-medium"
            />
          </div>

          {/* Sanalar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
                Boshlangan sana <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.course_start_date}
                onChange={(e) => handleChange("course_start_date", e.target.value)}
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
                onChange={(e) => handleChange("course_end_date", e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/admin/certificates"
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

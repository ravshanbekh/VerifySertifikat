"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { certificateApi } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function UploadCertificatePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({
    serial_series: "FE",
    serial_number: "",
    full_name: "",
    course_name: "",
    course_description: "",
    course_start_date: "",
    course_end_date: "",
    branch_code: "1", // Xalqlar do'stligi default
    signing_date: new Date().toISOString().split("T")[0], // Bugungi sana default
  });

  const handleFile = (f: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(f.type)) {
      toast.error("Faqat PDF, JPG, PNG formatlar qabul qilinadi");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("Fayl hajmi 20MB dan oshmasligi kerak");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Fayl tanlanmagan"); return; }
    if (!form.full_name || !form.course_name || !form.course_start_date || !form.course_end_date) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("serial_series", form.serial_series);
      if (form.serial_number) formData.append("serial_number", form.serial_number);
      formData.append("full_name", form.full_name);
      formData.append("course_name", form.course_name);
      if (form.course_description) formData.append("course_description", form.course_description);
      formData.append("course_start_date", form.course_start_date);
      formData.append("course_end_date", form.course_end_date);
      formData.append("branch_code", form.branch_code);
      formData.append("signing_date", form.signing_date);

      await certificateApi.upload(formData);
      toast.success("Sertifikat muvaffaqiyatli yuklandi!");
      router.push("/admin/certificates");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Yuklashda xato");
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sertifikat yuklash</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tayyor faylni tizimga kiritish</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File upload zone */}
        <div
          className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer animate-slide-up stagger-2 shadow-sm ${
            dragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
              : file
              ? "border-green-400 bg-green-50 dark:bg-green-500/10"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {file ? (
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-500/20 rounded-2xl flex items-center justify-center shadow-sm">
                <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-slate-900 dark:text-white font-bold text-lg">{file.name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="ml-auto text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-900 dark:text-white font-bold text-lg mb-1">Faylni shu yerga tashlang yoki bosing</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">PDF, JPG, PNG formatlari (maks. 20MB)</p>
            </>
          )}
        </div>

        {/* Form fields */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm dark:shadow-none animate-slide-up stagger-3">
          <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Sertifikat ma&apos;lumotlari
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Seriya prefiksi / Kurs kodi <span className="text-slate-400 dark:text-slate-500 font-medium">(Masalan: FE)</span></label>
              <input
                value={form.serial_series}
                onChange={(e) => setForm({ ...form, serial_series: e.target.value.toUpperCase() })}
                placeholder="FE"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">To&apos;liq Seriya Raqami <span className="text-slate-400 dark:text-slate-500 font-medium">(Qo&apos;lda kiritish — ixtiyoriy)</span></label>
              <input
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                placeholder="FE-1-2607-001"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
              />
            </div>
          </div>

          {!form.serial_number && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1.5">Filial (Raqam shakllanishi uchun)</label>
                <select
                  value={form.branch_code}
                  onChange={(e) => setForm({ ...form, branch_code: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all font-medium"
                >
                  <option value="0">Sayxun filiali (0)</option>
                  <option value="1">Xalqlar do&apos;stligi filiali (1)</option>
                  <option value="2">Guliston tumani filiali (2)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1.5">Tuzilgan sana (YYMM uchun)</label>
                <input
                  type="date"
                  value={form.signing_date}
                  onChange={(e) => setForm({ ...form, signing_date: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">F.I.Sh <span className="text-red-500">*</span></label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Alisher Abdullayev"
              required
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Kurs nomi <span className="text-red-500">*</span></label>
            <input
              value={form.course_name}
              onChange={(e) => setForm({ ...form, course_name: e.target.value })}
              placeholder="Frontend Development"
              required
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Kurs tavsifi <span className="text-slate-400 dark:text-slate-500 font-medium">(ixtiyoriy)</span></label>
            <textarea
              value={form.course_description}
              onChange={(e) => setForm({ ...form, course_description: e.target.value })}
              placeholder="Kurs haqida..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Boshlangan sana <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.course_start_date}
                onChange={(e) => setForm({ ...form, course_start_date: e.target.value })}
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">Tugagan sana <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.course_end_date}
                onChange={(e) => setForm({ ...form, course_end_date: e.target.value })}
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link
            href="/admin/certificates"
            className="flex-1 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold text-center transition-colors shadow-sm"
          >
            Bekor qilish
          </Link>
          <button
            type="submit"
            disabled={loading || !file}
            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            {loading ? "Yuklanmoqda..." : "Yuklash"}
          </button>
        </div>
      </form>
    </div>
  );
}

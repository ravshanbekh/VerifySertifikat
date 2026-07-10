"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { certificateApi } from "@/lib/api";
import { ArrowLeft, Save, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

// Kurs yo'nalishlari (backend bilan mos)
const COURSE_LIST = [
  {
    name: "Kiberxavfsizlik",
    prefix: "KB",
    description:
      "Kiberxavfsizlik kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi \"Kiberxavfsizlik\" o'quv kursini muvaffaqiyatli tamomlab, axborot xavfsizligi tamoyillari, tarmoq va tizimlar xavfsizligi, zararli dasturlar va kiberhujumlardan himoyalanish, xavfsiz autentifikatsiya, ma'lumotlarni himoyalash, xavflarni boshqarish hamda zamonaviy kiberxavfsizlik amaliyotlari bo'yicha nazariy bilim, amaliy ko'nikma va professional kompetensiyalarni egallaganligini tasdiqlayd i.",
  },
  {
    name: "Frontend Development",
    prefix: "FR",
    description:
      "Frontend Development kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi \"Frontend Development\" o'quv kursini muvaffaqiyatli tamomlab, HTML, CSS, JavaScript, React va zamonaviy veb-texnologiyalar bo'yicha nazariy bilim, amaliy ko'nikma va professional kompetensiyalarni egallaganligini tasdiqlayd i.",
  },
  {
    name: "Backend Development",
    prefix: "BC",
    description:
      "Backend Development kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi \"Backend Development\" o'quv kursini muvaffaqiyatli tamomlab, server-side dasturlash, ma'lumotlar bazalari, API yaratish va zamonaviy backend texnologiyalari bo'yicha nazariy bilim, amaliy ko'nikma va professional kompetensiyalarni egallaganligini tasdiqlayd i.",
  },
  {
    name: "Kompyuter savodxonligi",
    prefix: "KS",
    description:
      "Kompyuter savodxonligi kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi \"Kompyuter savodxonligi\" o'quv kursini muvaffaqiyatli tamomlab, kompyuter asoslari, ofis dasturlari, internet xavfsizligi va axborot texnologiyalari bo'yicha nazariy bilim, amaliy ko'nikma va professional kompetensiyalarni egallaganligini tasdiqlayd i.",
  },
];

export default function NewCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    course_name: "",
    course_description: "",
    course_start_date: "",
    course_end_date: "",
  });

  const selectedCourse = COURSE_LIST.find((c) => c.name === form.course_name);

  const handleCourseChange = (courseName: string) => {
    const course = COURSE_LIST.find((c) => c.name === courseName);
    setForm((prev) => ({
      ...prev,
      course_name: courseName,
      // Kurs tanlanganida avtomatik tavsif (foydalanuvchi o'zgartirishga ruxsat)
      course_description: course?.description ?? prev.course_description,
    }));
  };

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
      await certificateApi.create({
        full_name: form.full_name,
        course_name: form.course_name,
        course_description: form.course_description,
        course_start_date: form.course_start_date,
        course_end_date: form.course_end_date,
      } as Parameters<typeof certificateApi.create>[0]);
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
        <Link
          href="/admin/certificates"
          className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Yangi sertifikat
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Kurs va talaba ma&apos;lumotlarini kiriting — sertifikat avtomatik generatsiya bo&apos;ladi
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm dark:shadow-none animate-slide-up stagger-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kurs tanlash */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
              Kurs yo&apos;nalishi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {COURSE_LIST.map((course) => (
                <button
                  key={course.name}
                  type="button"
                  onClick={() => handleCourseChange(course.name)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    form.course_name === course.name
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      form.course_name === course.name
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {course.prefix}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold leading-tight ${
                        form.course_name === course.name
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {course.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Seriya: {course.prefix}-00000001
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {selectedCourse && (
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-900/30 rounded-xl px-3 py-2">
                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                Seriya prefiksi <span className="font-black">{selectedCourse.prefix}</span> — raqam avtomatik generatsiya bo&apos;ladi
              </div>
            )}
          </div>

          {/* Talaba */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
              Talaba F.I.Sh <span className="text-red-500">*</span>
            </label>
            <input
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Usmonov Bahrom"
              required
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          {/* Kurs tavsifi */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
              Kurs tavsifi{" "}
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                (kurs tanlanganida avtomatik to&apos;ladi, tahrirlash mumkin)
              </span>
            </label>
            <textarea
              value={form.course_description}
              onChange={(e) => handleChange("course_description", e.target.value)}
              placeholder="Kurs haqida ma'lumot..."
              rows={5}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none font-medium text-sm leading-relaxed"
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
              disabled={loading || !form.course_name}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {loading ? "Generatsiya qilinmoqda..." : "Sertifikat yaratish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

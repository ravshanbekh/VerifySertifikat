"use client";

import { useEffect, useState } from "react";
import { certificateApi, type Certificate, type Meta } from "@/lib/api";
import Link from "next/link";
import { Plus, Search, Upload, CheckCircle, XCircle, Clock, Filter, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const res = await certificateApi.getAll({ page, search, status });
      setCerts(res.data);
      setMeta(res.meta);
    } catch {
      toast.error("Sertifikatlarni yuklashda xato");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCerts();
  };

  const formatDate = (d: string) => {
    const dt = new Date(d);
    const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
    return `${dt.getDate()}-${months[dt.getMonth()]}, ${dt.getFullYear()}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sertifikatlar</h1>
          {meta && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Jami: <span className="font-bold text-slate-700 dark:text-slate-300">{meta.total}</span> ta sertifikat topildi</p>}
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/certificates/upload"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Yuklash
          </Link>
          <Link
            href="/admin/certificates/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Yangi
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none rounded-2xl p-4 mb-6 animate-slide-up stagger-1">
        <div className="flex gap-3 flex-wrap">
          <form onSubmit={handleSearch} className="flex-1 min-w-64 flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish (ism, seriya raqam, kurs)..."
                className="flex-1 bg-transparent text-slate-900 dark:text-white text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold rounded-xl text-sm transition-colors"
            >
              Qidirish
            </button>
          </form>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="">Barcha holat</option>
            <option value="active">Faol</option>
            <option value="revoked">Bekor qilingan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none rounded-3xl overflow-hidden animate-slide-up stagger-2">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-slate-100 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : certs.length === 0 ? (
          <div className="text-center py-24 px-4 text-slate-500 dark:text-slate-400">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">Sertifikat topilmadi</p>
            <p className="text-sm">Boshqa so'z bilan qidirib ko'ring yoki yangi sertifikat qo'shing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Seriya</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Talaba</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Kurs</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Sana</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Holat</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {certs.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md text-sm font-semibold">{cert.serial_number}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white text-sm font-bold">{cert.full_name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium text-sm">{cert.course_name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">{formatDate(cert.course_end_date)}</td>
                    <td className="px-6 py-4">
                      {cert.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30 text-xs font-bold px-3 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Faol
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30 text-xs font-bold px-3 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" />
                          Bekor qilingan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/certificates/${cert.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        Ko&apos;rish
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Ko&apos;rsatilmoqda: <span className="font-bold text-slate-700 dark:text-slate-300">{((meta.page - 1) * meta.limit) + 1}</span> dan <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(meta.page * meta.limit, meta.total)}</span> gacha (Jami: {meta.total})
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:bg-white dark:disabled:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm transition-colors"
              >
                ← Oldingi
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:bg-white dark:disabled:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm transition-colors"
              >
                Keyingi →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { certificateApi, type Certificate, authApi } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, XCircle, RefreshCw, Edit2, QrCode,
  FileText, Calendar, User, ExternalLink, Download, Trash2
} from "lucide-react";
import toast from "react-hot-toast";

export default function CertificateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [revoking, setRevoking] = useState(false);
  const [reissuing, setReissuing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'png' | null>(null);

  const handleDelete = async () => {
    if (!confirm("Haqiqatan ham bu sertifikatni butunlay o'chirib tashlamoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi va barcha rasm/PDF fayllar o'chib ketadi!")) return;
    setDeleting(true);
    try {
      await certificateApi.delete(id);
      toast.success("Sertifikat o'chirildi");
      router.push("/admin/certificates");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "O'chirishda xatolik");
      setDeleting(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'png') => {
    setDownloadingFormat(format);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/api/certificates/${id}/download?format=${format}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Yuklab olish muvaffaqiyatsiz tugadi');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cert?.serial_number || 'sertifikat'}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Yuklab olishda xatolik yuz berdi');
    } finally {
      setDownloadingFormat(null);
    }
  };

  useEffect(() => {
    Promise.all([
      certificateApi.getById(id),
      authApi.getMe(),
    ]).then(([certRes, userRes]) => {
      setCert(certRes.data);
      setUserRole(userRes.data.role);
    }).catch(() => {
      toast.error("Ma'lumotlarni yuklashda xato");
      router.push("/admin/certificates");
    }).finally(() => setLoading(false));
  }, [id, router]);

  const handleRevoke = async () => {
    if (!confirm("Haqiqatan ham bu sertifikatni bekor qilmoqchimisiz?")) return;
    setRevoking(true);
    try {
      await certificateApi.revoke(id);
      toast.success("Sertifikat bekor qilindi");
      const res = await certificateApi.getById(id);
      setCert(res.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xato");
    } finally {
      setRevoking(false);
    }
  };

  const handleReissue = async () => {
    setReissuing(true);
    try {
      await certificateApi.reissue(id);
      toast.success("Sertifikat qayta chiqarildi");
      const res = await certificateApi.getById(id);
      setCert(res.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xato");
    } finally {
      setReissuing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
    return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()} yil`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-100 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (!cert) return null;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8 animate-slide-in-right stagger-1">
        <Link href="/admin/certificates" className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-sm hover:shadow-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sertifikat tafsilotlari</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Batafsil ma'lumotlar va amallar</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 animate-slide-up stagger-2 shadow-sm ${
        cert.status === "active"
          ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-900/30"
          : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/30"
      }`}>
        <div className="flex items-center gap-3">
          {cert.status === "active"
            ? <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            : <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          }
          <span className={`font-bold text-lg ${cert.status === "active" ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}>
            {cert.status === "active" ? "Faol sertifikat" : "Bekor qilingan sertifikat"}
          </span>
        </div>
        <span className="sm:ml-auto font-mono bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm shadow-sm">{cert.serial_number}</span>
      </div>

      {/* Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none rounded-3xl p-8 mb-6 grid grid-cols-1 md:grid-cols-2 gap-5 animate-slide-up stagger-3">
        <InfoItem icon={User} label="Talaba" value={cert.full_name} />
        <InfoItem icon={FileText} label="Seriya raqami" value={cert.serial_number} mono />
        <InfoItem icon={FileText} label="Kurs nomi" value={cert.course_name} />
        {cert.course_description && (
          <InfoItem icon={FileText} label="Kurs tavsifi" value={cert.course_description} />
        )}
        <InfoItem icon={Calendar} label="Boshlangan" value={formatDate(cert.course_start_date)} />
        <InfoItem icon={Calendar} label="Tugagan" value={formatDate(cert.course_end_date)} />
        <InfoItem icon={Calendar} label="Yaratilgan" value={formatDate(cert.created_at)} />
        {cert.created_by && (
          <InfoItem icon={User} label="Kim yaratdi" value={cert.created_by.full_name} />
        )}
      </div>

      {/* QR & File */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-slide-up stagger-4">
        {cert.qr_code_url && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-bold text-sm">
              <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              QR kod
            </div>
            <div className="bg-slate-50 dark:bg-white border border-slate-100 rounded-2xl p-4 inline-block">
              <img
                src={`${API_BASE}${cert.qr_code_url}`}
                alt="QR kod"
                className="w-32 h-32 rounded-xl object-contain mix-blend-multiply"
              />
            </div>
          </div>
        )}
        {cert.file_url && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-bold text-sm">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Sertifikat fayli
            </div>
            <a
              href={`${API_BASE}${cert.file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold px-6 py-4 rounded-xl text-sm transition-colors mt-auto"
            >
              <ExternalLink className="w-4 h-4" />
              Ko&apos;rish / Yuklab olish
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none rounded-3xl p-6 animate-slide-up stagger-5">
        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-5">Amallar</h3>
        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/admin/certificates/${id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            Tahrirlash
          </Link>

          <button
            onClick={handleReissue}
            disabled={reissuing}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${reissuing ? "animate-spin" : ""}`} />
            Qayta chiqarish
          </button>

          {userRole === "super_admin" && cert.status !== "revoked" && (
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Bekor qilish
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-rose-500/10 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            O&apos;chirish
          </button>

          <a
            href={`/c/${cert.serial_number}`}
            target="_blank"
            className="flex items-center gap-2 px-5 py-2.5 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Public ko&apos;rish
          </a>
        </div>

        {/* Yuklab olish */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Yuklab olish</p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handleDownload('png')}
              disabled={downloadingFormat !== null}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {downloadingFormat === 'png' ? (
                <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-700 rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              PNG yuklash
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloadingFormat !== null}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 border border-orange-200 dark:border-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {downloadingFormat === 'pdf' ? (
                <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-700 rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              PDF yuklash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, mono }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-slate-900 dark:text-white font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

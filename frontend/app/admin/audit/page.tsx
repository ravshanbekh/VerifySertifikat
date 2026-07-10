"use client";

import { useEffect, useState } from "react";
import { auditApi, type AuditLog } from "@/lib/api";
import { ScrollText, Activity } from "lucide-react";
import toast from "react-hot-toast";

const actionColors: Record<string, string> = {
  created: "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-900/30",
  updated: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-900/30",
  revoked: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-900/30",
  reissued: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-900/30",
  uploaded: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-900/30",
  deleted: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-900/30",
};

const actionLabels: Record<string, string> = {
  created: "Yaratildi",
  updated: "Tahrirlandi",
  revoked: "Bekor qilindi",
  reissued: "Qayta chiqarildi",
  uploaded: "Yuklandi",
  deleted: "O'chirildi",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs({ page });
      setLogs(res.data);
      setTotalPages(res.meta.totalPages);
    } catch {
      toast.error("Audit loglarni yuklashda xato");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page]);

  const formatDate = (d: string) => {
    const dt = new Date(d);
    const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
    return `${dt.getDate()}-${months[dt.getMonth()]}, ${dt.getFullYear()} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8 animate-slide-up">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Audit Log</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Tizimda bajarilgan barcha amallar tarixi</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-none animate-slide-up stagger-1">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-slate-100 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-24 px-4 text-slate-500 dark:text-slate-400">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
              <ScrollText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">Hozircha log mavjud emas</p>
            <p className="text-sm">Tizimda hali hech qanday amal bajarilmagan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Amal</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Xodim</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Sertifikat</th>
                  <th className="text-left text-slate-500 dark:text-slate-400 text-xs font-bold px-6 py-4 uppercase tracking-wider">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm ${actionColors[log.action] || "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900 dark:text-white text-sm font-bold">{log.user?.full_name}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">{log.user?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {log.certificate ? (
                        <>
                          <p className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md inline-block font-mono text-sm font-semibold mb-1 border border-blue-100 dark:border-blue-900/30">{log.certificate.serial_number}</p>
                          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs truncate max-w-[200px]">{log.certificate.full_name}</p>
                        </>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-sm italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium text-sm whitespace-nowrap">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sahifa <span className="font-bold text-slate-700 dark:text-slate-300">{page}</span> / {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:bg-white dark:disabled:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm transition-colors shadow-sm"
              >
                ← Oldingi
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:bg-white dark:disabled:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm transition-colors shadow-sm"
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

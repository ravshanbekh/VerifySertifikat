"use client";

import { useEffect, useState } from "react";
import { certificateApi, usersApi, auditApi } from "@/lib/api";
import { FileText, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0, active: 0, revoked: 0,
    users: 0, recentLogs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      certificateApi.getAll({ limit: 1 }),
      certificateApi.getAll({ limit: 1, status: "active" }),
      certificateApi.getAll({ limit: 1, status: "revoked" }),
      usersApi.getAll(),
      auditApi.getLogs({ page: 1 }),
    ]).then(([total, active, revoked, users, logs]) => {
      setStats({
        total: total.status === "fulfilled" ? total.value.meta.total : 0,
        active: active.status === "fulfilled" ? active.value.meta.total : 0,
        revoked: revoked.status === "fulfilled" ? revoked.value.meta.total : 0,
        users: users.status === "fulfilled" ? users.value.data.length : 0,
        recentLogs: logs.status === "fulfilled" ? logs.value.meta.total : 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Jami sertifikat", value: stats.total, icon: FileText, color: "blue", delay: "stagger-1" },
    { label: "Faol", value: stats.active, icon: CheckCircle, color: "green", delay: "stagger-2" },
    { label: "Bekor qilingan", value: stats.revoked, icon: XCircle, color: "red", delay: "stagger-3" },
    { label: "Xodimlar", value: stats.users, icon: Users, color: "purple", delay: "stagger-4" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">ITLive Academy sertifikat tizimi boshqaruvi</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse shadow-sm dark:shadow-none" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card) => (
            <div key={card.label} className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all rounded-3xl p-6 animate-slide-up ${card.delay}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                card.color === "blue" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                card.color === "green" ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" :
                card.color === "red" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
              }`}>
                <card.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{card.value.toLocaleString()}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm dark:shadow-none hover:shadow-md transition-shadow animate-slide-up stagger-5">
          <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-5">Tezkor amallar</h3>
          <div className="space-y-3">
            {[
              { href: "/admin/certificates/new", label: "Yangi sertifikat yaratish", icon: FileText, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
              { href: "/admin/certificates/upload", label: "Sertifikat yuklash", icon: CheckCircle, color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10" },
              { href: "/admin/certificates", label: "Barcha sertifikatlar", icon: Users, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-sm transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm dark:shadow-none hover:shadow-md transition-shadow animate-slide-up stagger-6 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-5">Tizim holati</h3>
            <div className="space-y-4 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-500/10 px-4 py-2 rounded-lg inline-flex w-fit">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Tizim barqaror ishlayapti
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium pt-2">Server: verify.itlive.uz</p>
            </div>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-6 text-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">ITLive Academy sertifikat tekshirish platformasi v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

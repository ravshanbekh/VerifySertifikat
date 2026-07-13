"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { certificateApi, type Certificate } from "@/lib/api";
import { Search, CheckCircle, XCircle, AlertCircle, FileText, QrCode, Calendar, User, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

function HomeContent() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    data?: Certificate & { is_valid: boolean; is_revoked: boolean };
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // QR redirect: /c/ITLA-000001 → /?q=ITLA-000001
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      handleVerify(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (serial: string) => {
    const trimmed = serial.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await certificateApi.verify(trimmed);
      setResult(res);
    } catch {
      toast.error("Qidiruvda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
    return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()} yil`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors">
      {/* Decorative background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-400/10 dark:bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in stagger-1">
            <Image src="/logo-dark.svg" alt="ITLive Logo" width={120} height={40} className="object-contain block dark:hidden" priority />
            <Image src="/logo.svg" alt="ITLive Logo" width={120} height={40} className="object-contain hidden dark:block" priority />
          </div>
          <div className="flex items-center gap-4 animate-fade-in stagger-2">
            <ThemeToggle />
            <button
              onClick={() => router.push("/admin/login")}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
            >
              Admin kirish <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-20 relative z-10">
        {/* Hero */}
        <div className="text-center mb-16 animate-slide-up stagger-1">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium px-4 py-2 rounded-full mb-8 shadow-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Rasmiy tekshirish tizimi</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
            Sertifikatni{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
              tekshiring
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            ITLive Academy tomonidan berilgan sertifikatning haqiqiyligini seriya raqami orqali bir soniyada tekshiring
          </p>
        </div>

        {/* Search Form */}
        <div className="animate-slide-up stagger-2">
          <form onSubmit={(e) => { e.preventDefault(); handleVerify(query); }} className="mb-12 max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500/50 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <Search className="w-6 h-6 text-slate-400 dark:text-slate-500 ml-6 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Seriya raqami (masalan: ITLA-000001)"
                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-5 text-lg outline-none font-medium"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="m-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Izlanmoqda...
                  </>
                ) : (
                  "Tekshirish"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className="animate-pop-in">
            {!result.found ? (
              /* Topilmadi */
              <div className="bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 rounded-3xl p-10 text-center shadow-xl shadow-red-100/50 dark:shadow-none">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Sertifikat topilmadi</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  &ldquo;<span className="text-slate-900 dark:text-white font-mono font-semibold">{query}</span>&rdquo; seriya raqamiga ega sertifikat tizimda mavjud emas.
                </p>
                <p className="text-slate-400 dark:text-slate-500 mt-6 font-medium">
                  Seriya raqamni to&apos;g&apos;ri kiritganingizga ishonch hosil qiling
                </p>
              </div>
            ) : result.data?.is_revoked ? (
              /* Bekor qilingan */
              <div className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/30 rounded-3xl p-8 md:p-10 shadow-xl shadow-orange-100/50 dark:shadow-none">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Sertifikat bekor qilingan</h3>
                    <p className="text-orange-600 dark:text-orange-400 font-medium">Bu sertifikat ma&apos;muriyat tomonidan bekor qilingan</p>
                  </div>
                </div>
                <CertificateDetails data={result.data} formatDate={formatDate} />
              </div>
            ) : (
              /* Haqiqiy */
              <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-900/30 rounded-3xl p-8 md:p-10 shadow-2xl shadow-green-100/50 dark:shadow-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-green-50 dark:bg-green-900/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800 relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Sertifikat haqiqiy</h3>
                    <p className="text-green-600 dark:text-green-400 font-medium">Bu sertifikat ITLive Academy tomonidan rasman berilgan</p>
                  </div>
                </div>
                <div className="relative">
                  <CertificateDetails data={result.data!} formatDate={formatDate} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Cards */}
        {!result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            {[
              { icon: Search, title: "Seriya raqami orqali", desc: "Sertifikatdagi ITLA-XXXX formatdagi raqamni kiriting", delay: "stagger-3" },
              { icon: QrCode, title: "QR kod orqali", desc: "QR kodni skanerlang — natija avtomatik ko'rinadi", delay: "stagger-4" },
              { icon: CheckCircle, title: "Tezkor natija", desc: "Sertifikatning haqiqiyligi 1 soniyada tekshiriladi", delay: "stagger-5" },
            ].map((item, i) => (
              <div key={i} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow animate-slide-up ${item.delay}`}>
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="text-slate-900 dark:text-white font-bold mb-2">{item.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between text-slate-500 dark:text-slate-400 text-sm font-medium">
          <div>© {new Date().getFullYear()} ITLive Academy. Barcha huquqlar himoyalangan.</div>
          <div className="mt-2 md:mt-0">Sertifikat tizimi by ITLive</div>
        </div>
      </footer>
    </div>
  );
}

function DescriptionRow({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);

  const isLong = value.length > 150;
  const displayedValue = expanded || !isLong ? value : value.substring(0, 150) + "...";

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors md:col-span-2">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Kurs tavsifi</span>
      </div>
      <p className="text-slate-600 dark:text-slate-350 font-medium text-sm md:text-base leading-relaxed whitespace-pre-wrap">
        {displayedValue}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 font-bold transition-colors cursor-pointer"
        >
          {expanded ? "Yashirish" : "Batafsil..."}
        </button>
      )}
    </div>
  );
}

function CertificateDetails({
  data,
  formatDate,
}: {
  data: Certificate & { is_valid: boolean; is_revoked: boolean };
  formatDate: (d: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InfoRow icon={User} label="Talaba" value={data.full_name} />
      <InfoRow icon={FileText} label="Seriya raqami" value={data.serial_number} mono />
      <InfoRow icon={FileText} label="Kurs nomi" value={data.course_name} />
      <InfoRow icon={Calendar} label="Boshlangan" value={formatDate(data.course_start_date)} />
      <InfoRow icon={Calendar} label="Tugagan" value={formatDate(data.course_end_date)} />
      {data.course_description && (
        <DescriptionRow value={data.course_description} />
      )}
      {data.file_url && (
        <div className="md:col-span-2 mt-4">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${data.file_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            Sertifikatni ko&apos;rish / yuklab olish
          </a>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-slate-900 dark:text-white font-semibold text-lg ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

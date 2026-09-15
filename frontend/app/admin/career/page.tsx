"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  KeyRound,
  Check,
  ShieldOff,
  RefreshCw,
  Users,
  GraduationCap,
  Building2,
  Clock3,
  ScrollText,
  ExternalLink,
} from "lucide-react";
import { messageOf } from "@/lib/career";
import {
  careerAdminApi,
  type CareerAdminAccount,
  type CareerAdminEvent,
  type CareerAdminSummary,
} from "@/lib/career-admin";

const actionNames: Record<string, string> = {
  registered: "Akkaunt yaratildi",
  account_moderated: "Akkaunt holati o‘zgartirildi",
  contact_viewed: "Nomzod kontakti ko‘rildi",
  cv_downloaded: "CV yuklab olindi",
  profile_reported: "Profil haqida xabar berildi",
};
const statusNames: Record<string, string> = {
  active: "Faol",
  pending: "Tasdiq kutilmoqda",
  blocked: "Bloklangan",
};
type Tab = "overview" | "accounts" | "codes" | "audit";

export default function CareerAdmin() {
  const [accounts, setAccounts] = useState<CareerAdminAccount[]>([]);
  const [summary, setSummary] = useState<CareerAdminSummary | null>(null);
  const [events, setEvents] = useState<CareerAdminEvent[]>([]);
  const [error, setError] = useState("");
  const [code, setCode] = useState<{ code: string; full_name: string } | null>(
    null,
  );
  const [serial, setSerial] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<Tab>("overview");

  async function load() {
    setLoading(true);
    try {
      const [accountResult, summaryResult, eventResult] = await Promise.all([
        careerAdminApi<{ data: CareerAdminAccount[] }>("/accounts"),
        careerAdminApi<{ data: CareerAdminSummary }>("/summary"),
        careerAdminApi<{ data: CareerAdminEvent[] }>("/events"),
      ]);
      setAccounts(accountResult.data);
      setSummary(summaryResult.data);
      setEvents(eventResult.data);
      setError("");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    Promise.all([
      careerAdminApi<{ data: CareerAdminAccount[] }>("/accounts"),
      careerAdminApi<{ data: CareerAdminSummary }>("/summary"),
      careerAdminApi<{ data: CareerAdminEvent[] }>("/events"),
    ])
      .then(([accountResult, summaryResult, eventResult]) => {
        if (!active) return;
        setAccounts(accountResult.data);
        setSummary(summaryResult.data);
        setEvents(eventResult.data);
        setError("");
      })
      .catch((e) => {
        if (active) setError(messageOf(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function moderate(id: string, status: "active" | "blocked") {
    setBusy(true);
    try {
      await careerAdminApi(`/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  const pendingEmployers = accounts.filter(
    (account) => account.role === "employer" && account.status === "pending",
  );
  const filteredAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          filter === "all" ||
          account.status === filter ||
          account.role === filter,
      ),
    [accounts, filter],
  );
  const field =
    "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-blue-500";
  const button =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40";
  const tabs: {
    key: Tab;
    label: string;
    icon: typeof Users;
    badge?: number;
  }[] = [
    { key: "overview", label: "Umumiy", icon: BriefcaseBusiness },
    {
      key: "accounts",
      label: "Akkauntlar",
      icon: Users,
      badge: accounts.length,
    },
    { key: "codes", label: "Faollashtirish kodi", icon: KeyRound },
    {
      key: "audit",
      label: "Career auditi",
      icon: ScrollText,
      badge: summary?.events,
    },
  ];
  const cards = [
    [
      "Bitiruvchilar",
      summary?.graduates ?? 0,
      GraduationCap,
      "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
    ],
    [
      "Ish beruvchilar",
      summary?.employers ?? 0,
      Building2,
      "text-violet-600 bg-violet-50 dark:bg-violet-500/10",
    ],
    [
      "Tasdiq kutilmoqda",
      summary?.pending ?? 0,
      Clock3,
      "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    ],
    [
      "E’lon qilingan",
      summary?.published ?? 0,
      Check,
      "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    ],
  ] as const;

  return (
    <div>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <BriefcaseBusiness />
            Career boshqaruvi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Bitta admin kabinetida bitiruvchilar, ish beruvchilar va ruxsatlar.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/career"
            target="_blank"
            className={`${button} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900`}
          >
            Career saytini ochish
            <ExternalLink size={17} />
          </Link>
          <button
            className={`${button} bg-slate-100 dark:bg-slate-800`}
            onClick={() => void load()}
            disabled={loading}
            aria-label="Ma’lumotlarni yangilash"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>
      {error && (
        <p
          role="alert"
          className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200 mb-5"
        >
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5 mb-7">
        {cards.map(([label, value, Icon, color]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:p-5"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
            >
              <Icon size={21} />
            </div>
            <p className="text-2xl md:text-3xl font-extrabold mt-4 text-slate-900 dark:text-white">
              {loading ? "—" : value}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {label}
            </p>
          </article>
        ))}
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-6"
        role="tablist"
        aria-label="Career boshqaruv bo‘limlari"
      >
        {tabs.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`${button} whitespace-nowrap border ${tab === key ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}
          >
            <Icon size={17} />
            {label}
            {badge !== undefined && (
              <span
                className={`${tab === key ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"} rounded-md px-1.5 py-0.5 text-xs`}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  Tasdiq kutilayotgan ish beruvchilar
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Kontaktlarga ruxsat berishdan oldin kompaniyani tekshiring.
                </p>
              </div>
              <span className="rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 px-3 py-1.5 font-bold">
                {pendingEmployers.length}
              </span>
            </div>
            {pendingEmployers.length ? (
              pendingEmployers
                .slice(0, 5)
                .map((a) => (
                  <AccountRow
                    key={a.id}
                    account={a}
                    busy={busy}
                    moderate={moderate}
                  />
                ))
            ) : (
              <p className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-5 text-slate-500">
                Hozir tasdiq kutayotgan kompaniya yo‘q.
              </p>
            )}
            <button
              onClick={() => setTab("accounts")}
              className="mt-4 text-blue-600 dark:text-blue-400 font-semibold"
            >
              Barcha akkauntlarni ko‘rish →
            </button>
          </section>
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Tezkor amallar</h2>
            <div className="grid gap-3 mt-4">
              <button
                onClick={() => setTab("codes")}
                className="text-left rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <strong className="flex items-center gap-2">
                  <KeyRound size={18} />
                  Bitiruvchiga kod berish
                </strong>
                <span className="block text-sm text-slate-500 mt-1">
                  Sertifikatni Career profiliga xavfsiz bog‘lash.
                </span>
              </button>
              <button
                onClick={() => setTab("audit")}
                className="text-left rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <strong className="flex items-center gap-2">
                  <ScrollText size={18} />
                  Career harakatlarini ko‘rish
                </strong>
                <span className="block text-sm text-slate-500 mt-1">
                  Kontakt, CV va moderatsiya tarixini tekshirish.
                </span>
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === "codes" && (
        <section className="max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8">
          <h2 className="text-xl font-bold flex gap-2 items-center">
            <KeyRound size={21} />
            Bitiruvchiga shaxsiy kod berish
          </h2>
          <p className="text-base text-slate-500 my-3">
            Avval bitiruvchi shaxsini akademiya yozuvlari bilan tekshiring. Kod
            7 kun amal qiladi va bir marta ishlatiladi.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setCode(null);
              try {
                const result = await careerAdminApi<{
                  data: { code: string; full_name: string };
                }>("/invites", {
                  method: "POST",
                  body: JSON.stringify({ serial_number: serial }),
                });
                setCode(result.data);
                setError("");
              } catch (err) {
                setError(messageOf(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="flex-1">
              <span className="block text-sm font-semibold mb-2">
                Sertifikat raqami
              </span>
              <input
                className={field}
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="Masalan, ITLA-000123"
                required
              />
            </label>
            <button
              disabled={busy}
              className={`${button} sm:self-end bg-blue-600 text-white px-6`}
            >
              Kod yaratish
            </button>
          </form>
          {code && (
            <div
              role="status"
              className="mt-5 rounded-xl bg-emerald-50 dark:bg-emerald-950 p-5"
            >
              <p className="font-semibold mb-2">{code.full_name}</p>
              <code className="select-all break-all text-lg font-bold">
                {code.code}
              </code>
              <p className="text-sm text-slate-500 mt-2">
                Kod faqat hozir ko‘rsatiladi. Uni bitiruvchiga shaxsiy kanal
                orqali yuboring.
              </p>
            </div>
          )}
        </section>
      )}

      {tab === "accounts" && (
        <section>
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              ["all", "Barchasi"],
              ["pending", "Tasdiq kutilmoqda"],
              ["graduate", "Bitiruvchilar"],
              ["employer", "Ish beruvchilar"],
              ["blocked", "Bloklangan"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`${button} ${filter === key ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredAccounts.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                busy={busy}
                moderate={moderate}
              />
            ))}
            {!filteredAccounts.length && !loading && (
              <p className="p-10 text-center text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800">
                Bu bo‘limda akkaunt yo‘q.
              </p>
            )}
          </div>
        </section>
      )}

      {tab === "audit" && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold">Career harakatlari</h2>
            <p className="text-sm text-slate-500 mt-1">
              Oxirgi 100 ta xavfsizlik va foydalanish hodisasi.
            </p>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {events.map((event) => (
              <article
                key={event.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="font-semibold">
                    {actionNames[event.action] || event.action}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {event.account
                      ? `${event.account.full_name} · ${event.account.email}`
                      : "Tizim yoki administrator"}
                  </p>
                </div>
                <time
                  className="text-sm text-slate-500"
                  dateTime={event.created_at}
                >
                  {new Intl.DateTimeFormat("uz-UZ", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(event.created_at))}
                </time>
              </article>
            ))}
            {!events.length && !loading && (
              <p className="p-10 text-center text-slate-500">
                Hali Career hodisalari yo‘q.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function AccountRow({
  account,
  busy,
  moderate,
}: {
  account: CareerAdminAccount;
  busy: boolean;
  moderate: (id: string, status: "active" | "blocked") => Promise<void>;
}) {
  return (
    <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
      <div className="min-w-0">
        <h3 className="font-bold text-base">
          {account.company_name || account.full_name}
        </h3>
        <p className="text-sm text-slate-500 mt-1 break-all">
          {account.email} · {account.phone} · @{account.telegram}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          {account.role === "graduate" ? "Bitiruvchi" : "Ish beruvchi"} ·{" "}
          {statusNames[account.status] || account.status}
          {account.profile
            ? ` · ${account.profile.certificate.serial_number}`
            : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy || account.status === "active"}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 disabled:opacity-40"
          onClick={() => void moderate(account.id, "active")}
        >
          <Check size={16} />
          Tasdiqlash
        </button>
        <button
          disabled={busy || account.status === "blocked"}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300 disabled:opacity-40"
          onClick={() => void moderate(account.id, "blocked")}
        >
          <ShieldOff size={16} />
          Bloklash
        </button>
      </div>
    </article>
  );
}

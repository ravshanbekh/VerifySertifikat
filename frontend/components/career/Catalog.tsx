"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  Search,
  BadgeCheck,
  Bookmark,
  SlidersHorizontal,
  X,
  RotateCcw,
  LoaderCircle,
} from "lucide-react";
import {
  careerApi,
  messageOf,
  availabilityLabel,
  type CareerProfile,
  type CareerSummary,
  type CatalogResponse,
} from "@/lib/career";
import { useCareer } from "./CareerShell";

const formats: Record<string, string> = {
  Remote: "Masofaviy",
  Office: "Ofisda",
  Hybrid: "Gibrid",
};
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="career-empty">
      <Search size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="career-error" role="alert">
      <span>{message}</span>
      {retry && (
        <button onClick={retry}>
          <RotateCcw size={16} />
          Qayta urinish
        </button>
      )}
    </div>
  );
}
export function Avatar({
  profile,
  large = false,
}: {
  profile: CareerProfile;
  large?: boolean;
}) {
  return (
    <div className={`career-avatar ${large ? "large" : ""}`}>
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.certificate.full_name} />
      ) : (
        profile.certificate.full_name
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("")
      )}
    </div>
  );
}
export function CandidateCard({
  profile,
  saved = false,
  onSaved,
}: {
  profile: CareerProfile;
  saved?: boolean;
  onSaved?: () => void;
}) {
  const { me, href } = useCareer();
  const router = useRouter();
  const [isSaved, setSaved] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    if (!me) {
      router.push(href("/login"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await careerApi(`/saved/${profile.id}`, {
        method: isSaved ? "DELETE" : "PUT",
      });
      setSaved(!isSaved);
      onSaved?.();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="career-person-row">
      <div className="career-person-identity">
        <Avatar profile={profile} />
        <div>
          <Link
            href={href(`/candidates/${profile.id}`)}
            className="career-person-name"
          >
            <h3>{profile.certificate.full_name}</h3>
            <BadgeCheck size={20} aria-label="Sertifikati tasdiqlangan" />
          </Link>
          <p className="career-person-role">{profile.headline}</p>
          <p className="career-person-location">
            {profile.level}
            <span>·</span>
            {profile.city}
            <span>·</span>
            {formats[profile.work_format] || profile.work_format}
          </p>
        </div>
      </div>
      <div className="career-person-skills">
        <div className="career-tags">
          {profile.technologies.slice(0, 3).map((t) => (
            <span key={t}>{t}</span>
          ))}
          {profile.technologies.length > 3 && (
            <span>+{profile.technologies.length - 3}</span>
          )}
        </div>
        <span
          className={`career-status ${profile.availability === "busy" ? "busy" : ""}`}
        >
          <i />
          {availabilityLabel(profile.availability)}
        </span>
      </div>
      <div className="career-person-actions">
        <button
          className={`career-save ${isSaved ? "selected" : ""}`}
          aria-label={`${profile.certificate.full_name}: ${isSaved ? "saqlanganlardan olib tashlash" : "saqlash"}`}
          aria-pressed={isSaved}
          disabled={busy}
          onClick={save}
        >
          <Bookmark size={21} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <Link
          href={href(`/candidates/${profile.id}`)}
          className="career-row-link"
        >
          Profilni ko‘rish
          <ArrowRight size={18} />
        </Link>
      </div>
      {error && (
        <p className="career-inline-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
export default function Catalog({
  home = false,
  savedOnly = false,
}: {
  home?: boolean;
  savedOnly?: boolean;
}) {
  const { href } = useCareer();
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [summary, setSummary] = useState<CareerSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [open, setOpen] = useState(false);
  const key = params.toString();
  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      if (live) {
        setLoading(true);
        setError("");
      }
    }, 0);
    const request = savedOnly
      ? careerApi<{ data: CareerProfile[] }>("/saved").then((r) => ({
          data: r.data,
          meta: { total: r.data.length, page: 1, totalPages: 1 },
        }))
      : careerApi<CatalogResponse>(`/catalog?${key}`);
    request
      .then((r) => {
        if (live) setData(r);
      })
      .catch((e) => {
        if (live) setError(messageOf(e));
      })
      .finally(() => {
        clearTimeout(timer);
        if (live) setLoading(false);
      });
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [key, revision, savedOnly]);
  useEffect(() => {
    let live = true;
    careerApi<{ data: CareerSummary }>("/summary")
      .then((r) => {
        if (live) setSummary(r.data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  function filter(name: string, value: string) {
    const next = new URLSearchParams(key);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "page") next.delete("page");
    router.push(`${href("/candidates")}?${next}`, { scroll: false });
  }
  const selectedFilters = [
    "level",
    "city",
    "work_format",
    "work_type",
    "technology",
    "availability",
  ].filter((k) => params.get(k));
  const Heading = home ? "h2" : "h1";
  const filters = (
    <>
      <label className="career-field">
        Daraja
        <select
          value={params.get("level") || ""}
          onChange={(e) => filter("level", e.target.value)}
        >
          <option value="">Barcha darajalar</option>
          {["Intern", "Junior", "Middle", "Senior"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="career-field">
        Joylashuv
        <select
          value={params.get("city") || ""}
          onChange={(e) => filter("city", e.target.value)}
        >
          <option value="">Barcha shaharlar</option>
          {summary?.cities.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="career-field">
        Ish formati
        <select
          value={params.get("work_format") || ""}
          onChange={(e) => filter("work_format", e.target.value)}
        >
          <option value="">Barcha formatlar</option>
          {Object.entries(formats).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="career-field">
        Texnologiya
        <select
          value={params.get("technology") || ""}
          onChange={(e) => filter("technology", e.target.value)}
        >
          <option value="">Barcha texnologiyalar</option>
          {[
            ...new Set([
              ...(summary?.technologies || []),
              ...(params.get("technology") ? [params.get("technology")!] : []),
            ]),
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="career-field">
        Ish turi
        <select
          value={params.get("work_type") || ""}
          onChange={(e) => filter("work_type", e.target.value)}
        >
          <option value="">Barcha ish turlari</option>
          {["Full-time", "Part-time", "Internship", "Freelance"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="career-check">
        <input
          type="checkbox"
          checked={params.get("availability") === "open"}
          onChange={(e) =>
            filter("availability", e.target.checked ? "open" : "")
          }
        />
        Faqat ish izlayotganlar
      </label>
    </>
  );
  return (
    <>
      {home && (
        <section className="career-welcome">
          <div className="career-container">
            <h1>
              Jamoangiz uchun
              <br />
              ITLive bitiruvchilari.
            </h1>
            <p>
              Dasturchilar, dizaynerlar va yangi ishga tayyor mutaxassislar.
            </p>
            <Link href={href("/register")}>
              Bitiruvchimisiz? Profil yarating <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}
      <section className="career-directory" id="talents">
        <div className="career-container">
          <div className="career-directory-heading">
            <div>
              <Heading>{savedOnly ? "Saqlanganlar" : "Mutaxassislar"}</Heading>
              <p>
                {savedOnly
                  ? "Siz tanlagan nomzodlar."
                  : "ITLive sertifikatiga ega bitiruvchilar."}
              </p>
            </div>
          </div>
          {!savedOnly && (
            <div className="career-directory-tools">
              <form
                className="career-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  filter(
                    "q",
                    String(new FormData(e.currentTarget).get("q") || ""),
                  );
                }}
              >
                <Search size={22} />
                <label htmlFor="career-search" className="career-sr-only">
                  Ism, kasb yoki texnologiya
                </label>
                <input
                  id="career-search"
                  name="q"
                  key={params.get("q") || ""}
                  defaultValue={params.get("q") || ""}
                  placeholder="Ism, kasb yoki texnologiya"
                />
                <button className="career-button primary" type="submit">
                  Qidirish
                </button>
              </form>
              <Dialog.Root open={open} onOpenChange={setOpen}>
                <Dialog.Trigger asChild>
                  <button className="career-button secondary career-all-filters">
                    <SlidersHorizontal size={20} />
                    Filtrlar
                    {selectedFilters.length > 0 && (
                      <span className="career-filter-number">
                        {selectedFilters.length}
                      </span>
                    )}
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="career-overlay" />
                  <Dialog.Content className="career-filter-dialog">
                    <div className="career-dialog-head">
                      <Dialog.Title>Filtrlar</Dialog.Title>
                      <Dialog.Close asChild>
                        <button
                          className="career-icon-button"
                          aria-label="Filtrlarni yopish"
                        >
                          <X />
                        </button>
                      </Dialog.Close>
                    </div>
                    <Dialog.Description className="career-muted">
                      Sizga mos mutaxassisni toping.
                    </Dialog.Description>
                    {filters}
                    <div className="career-filter-actions">
                      <button
                        className="career-button secondary"
                        onClick={() =>
                          router.push(href("/candidates"), { scroll: false })
                        }
                      >
                        Tozalash
                      </button>
                      <Dialog.Close className="career-button primary">
                        Natijalarni ko‘rish
                      </Dialog.Close>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          )}
          {!savedOnly && selectedFilters.length > 0 && (
            <div
              className="career-active-filters"
              aria-label="Tanlangan filtrlar"
            >
              {selectedFilters.map((k) => (
                <button
                  key={k}
                  onClick={() => filter(k, "")}
                  aria-label={`${params.get(k)} filtrini olib tashlash`}
                >
                  {k === "availability"
                    ? "Ish izlayapti"
                    : formats[params.get(k) || ""] || params.get(k)}
                  <X size={15} />
                </button>
              ))}
            </div>
          )}
          <div className="career-directory-meta">
            <p aria-live="polite">
              {loading ? (
                "Qidirilmoqda…"
              ) : (
                <>
                  <strong>{data?.meta.total ?? 0}</strong> ta mutaxassis
                </>
              )}
            </p>
            {!savedOnly && (
              <label className="career-sort">
                <span className="career-sr-only">Saralash</span>
                <select
                  value={params.get("sort") || "recent"}
                  onChange={(e) => filter("sort", e.target.value)}
                >
                  <option value="recent">Yangi yangilanganlar</option>
                  <option value="name">Ism bo‘yicha A–Z</option>
                </select>
              </label>
            )}
          </div>
          {error ? (
            <ErrorState
              message={error}
              retry={() => setRevision((r) => r + 1)}
            />
          ) : loading ? (
            <div
              className="career-people-list"
              aria-label="Profillar yuklanmoqda"
            >
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="career-skeleton">
                  <LoaderCircle size={24} className="career-spin" />
                  <span />
                </div>
              ))}
            </div>
          ) : data?.data.length ? (
            <>
              <div className="career-people-list">
                {data.data.map((p) => (
                  <CandidateCard
                    key={p.id}
                    profile={p}
                    saved={savedOnly}
                    onSaved={
                      savedOnly ? () => setRevision((r) => r + 1) : undefined
                    }
                  />
                ))}
              </div>
              {data.meta.totalPages > 1 && (
                <div className="career-pagination">
                  <button
                    className="career-button secondary"
                    disabled={data.meta.page === 1}
                    onClick={() => filter("page", String(data.meta.page - 1))}
                  >
                    Oldingi
                  </button>
                  <span>
                    {data.meta.page} / {data.meta.totalPages}
                  </span>
                  <button
                    className="career-button secondary"
                    disabled={data.meta.page === data.meta.totalPages}
                    onClick={() => filter("page", String(data.meta.page + 1))}
                  >
                    Keyingi
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title={
                savedOnly ? "Saqlangan nomzod yo‘q" : "Mos mutaxassis topilmadi"
              }
              description={
                savedOnly
                  ? "Nomzod yonidagi saqlash belgisini bosing."
                  : "Boshqa so‘z bilan qidiring yoki filtrlarni tozalang."
              }
            >
              {savedOnly ? (
                <Link
                  className="career-button secondary"
                  href={href("/candidates")}
                >
                  Mutaxassislarni ko‘rish
                </Link>
              ) : (
                <button
                  className="career-button secondary"
                  onClick={() => router.push(href("/candidates"))}
                >
                  Qidiruvni tozalash
                </button>
              )}
            </EmptyState>
          )}
        </div>
      </section>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Upload,
  Save,
  Plus,
  X,
  Eye,
  ShieldCheck,
  Clock3,
  Bookmark,
  BriefcaseBusiness,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  careerApi,
  messageOf,
  type CareerMe,
  type CareerProfile,
} from "@/lib/career";
import { useCareer } from "./CareerShell";
import { ErrorState, EmptyState } from "./Catalog";
export default function Dashboard() {
  const { href, refresh } = useCareer();
  const [me, setMe] = useState<CareerMe | null>(null);
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    careerApi<{ data: CareerMe }>("/me")
      .then((r) => {
        setMe(r.data);
        setProfile(r.data.profile);
      })
      .catch((e) => setError(messageOf(e)));
  }, []);
  const set = (k: keyof CareerProfile, v: unknown) =>
    setProfile((p) => (p ? { ...p, [k]: v } : p));
  async function save(publish: boolean) {
    if (!profile) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await careerApi<{ data: CareerProfile }>("/profile", {
        method: "PUT",
        body: JSON.stringify({ ...profile, published: publish }),
      });
      setProfile({ ...profile, ...r.data });
      setNotice(
        publish
          ? "Profilingiz katalogda e’lon qilindi."
          : "Profil qoralamasi saqlandi.",
      );
      await refresh();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  async function file(file: File | undefined, type: "avatar" | "cv") {
    if (!file) return;
    const data = new FormData();
    data.set("file", file);
    setBusy(true);
    try {
      const r = await careerApi<{ data?: { avatar_url: string } }>(
        `/profile/${type}`,
        { method: "POST", body: data },
      );
      if (r.data?.avatar_url) set("avatar_url", r.data.avatar_url);
      setNotice(type === "cv" ? "CV yuklandi." : "Profil rasmi yangilandi.");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  if (!me)
    return (
      <div className="career-container career-page-space">
        {error ? (
          <>
            <ErrorState message={error} />
            <Link className="career-button primary" href={href("/login")}>
              Hisobga kirish
            </Link>
          </>
        ) : (
          <EmptyState
            title="Kabinet yuklanmoqda…"
            description="Bir oz kuting."
          />
        )}
      </div>
    );
  if (me.account.role === "employer")
    return (
      <div className="career-container career-page-space">
        <div className="career-eyebrow">ISH BERUVCHI KABINETI</div>
        <h1 className="career-page-title">
          Xush kelibsiz, {me.account.company_name}.
        </h1>
        <p className="career-muted">
          Keyingi kuchli jamoangiz shu yerdan boshlanadi.
        </p>
        <div
          className={`career-dashboard-status ${me.account.status === "active" ? "approved" : ""}`}
        >
          {me.account.status === "active" ? (
            <BadgeCheck size={26} />
          ) : (
            <Clock3 size={26} />
          )}
          <div>
            <strong>
              {me.account.status === "active"
                ? "Kompaniyangiz tasdiqlangan"
                : "Kompaniyangiz tekshirilmoqda"}
            </strong>
            <p>
              {me.account.status === "active"
                ? "Nomzodlarni saqlashingiz va ular bilan bog‘lanishingiz mumkin."
                : "Administrator ma’lumotlaringizni tekshirgach, kontaktlar va saqlash imkoniyati ochiladi."}
            </p>
          </div>
        </div>
        <div className="career-employer-actions">
          <Link href={href("/candidates")} className="career-panel">
            <BriefcaseBusiness />
            <h2>Mutaxassis topish</h2>
            <p>Katalogdan jamoangizga mos insonni tanlang.</p>
            <ArrowUpRight />
          </Link>
          <Link href={href("/saved")} className="career-panel">
            <Bookmark />
            <h2>Saqlangan nomzodlar</h2>
            <p>Qiziqish bildirgan profillaringizni qayta ko‘ring.</p>
            <ArrowUpRight />
          </Link>
        </div>
        <section className="career-panel">
          <h2>Kompaniya ma’lumotlari</h2>
          <div className="career-card-facts">
            <span>{me.account.industry}</span>
            <span>{me.account.email}</span>
            <span>{me.account.phone}</span>
          </div>
          <p className="career-helper">
            Ma’lumotlarni tuzatish uchun ITLive administratoriga murojaat
            qiling.
          </p>
        </section>
      </div>
    );
  if (!profile) return null;
  const steps = ["Asosiy", "Ko‘nikmalar", "Loyihalar", "Aloqa", "E’lon qilish"];
  return (
    <div className="career-container career-page-space">
      <div className="career-dashboard-heading">
        <div>
          <div className="career-eyebrow">BITIRUVCHI KABINETI</div>
          <h1 className="career-page-title">
            Salom, {me.account.full_name.split(" ")[0]}.
          </h1>
          <p className="career-muted">
            O‘zingizni tanishtiring. Keyingi imkoniyatga yo‘l oching.
          </p>
        </div>
        {profile.published && (
          <Link
            className="career-button secondary"
            href={href(`/candidates/${profile.id}`)}
          >
            <Eye size={16} />
            Profilni ko‘rish
          </Link>
        )}
      </div>
      <div className="career-dashboard-layout">
        <aside>
          <div className="career-panel career-progress-panel">
            <BadgeCheck size={28} />
            <h3>Profilingiz {profile.completion || 0}% tayyor</h3>
            <progress value={profile.completion || 0} max={100} />
            <p>Kamida 70% to‘ldirib, ish beruvchilarga ko‘rining.</p>
            <div className="career-status">
              <i />
              {profile.published ? "E’lon qilingan" : "Qoralama"}
            </div>
          </div>
          <div className="career-panel">
            <ShieldCheck size={23} />
            <h3>Tasdiqlangan ta’lim</h3>
            <p>{profile.certificate.full_name}</p>
            <p className="career-muted">{profile.certificate.course_name}</p>
            <small>{profile.certificate.serial_number}</small>
            {profile.certificate.status === "revoked" && (
              <ErrorState message="Sertifikatingiz bekor qilingan. Administratorga murojaat qiling." />
            )}
          </div>
        </aside>
        <div>
          <div
            className="career-step-nav"
            role="tablist"
            aria-label="Profil bo‘limlari"
          >
            {steps.map((s, i) => (
              <button
                role="tab"
                tabIndex={tab === i ? 0 : -1}
                aria-selected={tab === i}
                aria-controls={`career-step-${i}`}
                id={`career-tab-${i}`}
                key={s}
                onClick={() => setTab(i)}
                onKeyDown={(event) => {
                  const next =
                    event.key === "ArrowRight"
                      ? (i + 1) % steps.length
                      : event.key === "ArrowLeft"
                        ? (i + steps.length - 1) % steps.length
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? steps.length - 1
                            : null;
                  if (next !== null) {
                    event.preventDefault();
                    setTab(next);
                    document.getElementById(`career-tab-${next}`)?.focus();
                  }
                }}
                className={tab === i ? "active" : ""}
              >
                <span>{i + 1}</span>
                {s}
              </button>
            ))}
          </div>
          <section
            className="career-panel career-editor"
            role="tabpanel"
            aria-labelledby={`career-tab-${tab}`}
            id={`career-step-${tab}`}
          >
            {tab === 0 && (
              <>
                <h2>O‘zingiz haqingizda ayting.</h2>
                <p className="career-muted">
                  Ish beruvchi sizni birinchi shu ma’lumotlar orqali taniydi.
                </p>
                <label className="career-upload">
                  <Upload size={22} />
                  <span>
                    {profile.avatar_url
                      ? "Rasmni almashtirish"
                      : "Profil rasmini yuklash"}
                    <small>JPG, PNG, WebP · 5 MB gacha</small>
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy}
                    onChange={(e) => void file(e.target.files?.[0], "avatar")}
                  />
                </label>
                <label className="career-field">
                  Mutaxassislik
                  <input
                    value={profile.headline}
                    onChange={(e) => set("headline", e.target.value)}
                    placeholder="Masalan, Frontend dasturchi"
                    maxLength={100}
                  />
                </label>
                <label className="career-field">
                  O‘zingiz haqingizda
                  <textarea
                    value={profile.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder="Nimalar qila olasiz, qanday jamoa va imkoniyat izlayapsiz?"
                    rows={5}
                    maxLength={3000}
                  />
                </label>
                <div className="career-form-row">
                  <label className="career-field">
                    Shahar
                    <input
                      value={profile.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="Toshkent"
                      maxLength={80}
                    />
                  </label>
                  <label className="career-field">
                    Daraja
                    <select
                      value={profile.level}
                      onChange={(e) => set("level", e.target.value)}
                    >
                      {["Intern", "Junior", "Middle", "Senior"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="career-form-row">
                  <label className="career-field">
                    Ish formati
                    <select
                      value={profile.work_format}
                      onChange={(e) => set("work_format", e.target.value)}
                    >
                      {["Remote", "Office", "Hybrid"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="career-field">
                    Ish turi
                    <select
                      value={profile.work_type}
                      onChange={(e) => set("work_type", e.target.value)}
                    >
                      {[
                        "Full-time",
                        "Part-time",
                        "Internship",
                        "Freelance",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}
            {tab === 1 && (
              <>
                <h2>Nimalarni yaxshi bilasiz?</h2>
                <p className="career-muted">
                  Qiymatlarni vergul bilan ajrating. Texnologiyalarni odatiy
                  nomi bilan yozing.
                </p>
                {(["technologies", "skills", "languages"] as const).map(
                  (k, i) => (
                    <label className="career-field" key={k}>
                      {
                        [
                          "Texnologiyalar · kamida 3 ta",
                          "Professional ko‘nikmalar",
                          "Tillar va darajasi",
                        ][i]
                      }
                      <input
                        defaultValue={profile[k].join(", ")}
                        onBlur={(e) =>
                          set(
                            k,
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          )
                        }
                        placeholder={
                          [
                            "React, TypeScript, Git",
                            "Jamoada ishlash, Muammo yechish",
                            "O‘zbek — ona tili, Ingliz — B2",
                          ][i]
                        }
                      />
                    </label>
                  ),
                )}
                <label className="career-field">
                  Ish va amaliyot tajribasi
                  <textarea
                    rows={6}
                    value={profile.experience}
                    onChange={(e) => set("experience", e.target.value)}
                    placeholder="Kompaniya, vazifangiz, ish davri va erishgan natijangiz."
                    maxLength={5000}
                  />
                </label>
                <p className="career-helper">
                  Hali tajribangiz bo‘lmasa, loyiha ishlaringiz bilan boshlang.
                </p>
              </>
            )}
            {tab === 2 && (
              <>
                <h2>Ishlaringiz siz haqingizda gapirsin.</h2>
                <p className="career-muted">
                  O‘quv yoki haqiqiy loyihalaringizni qo‘shing. Ko‘pi bilan 8
                  ta.
                </p>
                {profile.projects.map((p, i) => (
                  <div className="career-project-editor" key={i}>
                    <div className="career-dialog-head">
                      <h3>{i + 1}-loyiha</h3>
                      <button
                        className="career-icon-button"
                        aria-label={`${i + 1}-loyihani olib tashlash`}
                        onClick={() =>
                          set(
                            "projects",
                            profile.projects.filter((_, n) => n !== i),
                          )
                        }
                      >
                        <X size={17} />
                      </button>
                    </div>
                    {(["name", "description", "url"] as const).map((k, j) => (
                      <label className="career-field" key={k}>
                        {
                          [
                            "Loyiha nomi",
                            "Qisqacha tavsif va sizning hissangiz",
                            "Havola",
                          ][j]
                        }
                        <input
                          value={p[k]}
                          onChange={(e) =>
                            set(
                              "projects",
                              profile.projects.map((x, n) =>
                                n === i ? { ...x, [k]: e.target.value } : x,
                              ),
                            )
                          }
                          placeholder={k === "url" ? "https://" : undefined}
                        />
                      </label>
                    ))}
                  </div>
                ))}
                <button
                  className="career-button secondary"
                  disabled={profile.projects.length >= 8}
                  onClick={() =>
                    set("projects", [
                      ...profile.projects,
                      { name: "", description: "", url: "" },
                    ])
                  }
                >
                  <Plus size={16} />
                  Loyiha qo‘shish
                </button>
              </>
            )}
            {tab === 3 && (
              <>
                <h2>Aloqani osonlashtiring.</h2>
                <div className="career-proof-panel">
                  <ShieldCheck />
                  <div>
                    <strong>
                      Kontaktlar faqat tasdiqlangan ish beruvchilar uchun
                    </strong>
                    <span>
                      {me.account.email} · {me.account.phone} · @
                      {me.account.telegram}
                    </span>
                  </div>
                </div>
                {(["linkedin", "github", "portfolio"] as const).map((k) => (
                  <label className="career-field" key={k}>
                    {k === "linkedin"
                      ? "LinkedIn"
                      : k === "github"
                        ? "GitHub"
                        : "Portfolio"}
                    <input
                      type="url"
                      value={profile[k] || ""}
                      onChange={(e) => set(k, e.target.value)}
                      placeholder="https://"
                    />
                  </label>
                ))}
                <label className="career-upload">
                  <Upload size={22} />
                  <span>
                    {profile.cv_filename
                      ? "CV ni almashtirish"
                      : "CV faylini yuklash"}
                    <small>
                      Faqat PDF · 5 MB gacha · ochiq e’lon qilinmaydi
                    </small>
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={busy}
                    onChange={(e) => void file(e.target.files?.[0], "cv")}
                  />
                </label>
                <label className="career-check">
                  <input
                    type="checkbox"
                    checked={profile.contact_consent || false}
                    onChange={(e) => set("contact_consent", e.target.checked)}
                  />
                  Profilimni katalogda, kontaktlarimni esa tasdiqlangan ish
                  beruvchilarga ko‘rsatishga roziman.
                </label>
              </>
            )}
            {tab === 4 && (
              <>
                <div className="career-publish-icon">
                  <Check size={34} />
                </div>
                <h2>Keyingi imkoniyatga tayyormisiz?</h2>
                <p className="career-muted">
                  E’lon qilishdan oldin asosiy ma’lumotlar, kamida 3 ta
                  texnologiya, ko‘nikmalar va kontaktlar uchun rozilik
                  to‘ldirilganini tekshiring.
                </p>
                <label className="career-field">
                  Hozirgi holatingiz
                  <select
                    value={profile.availability}
                    onChange={(e) => set("availability", e.target.value)}
                  >
                    <option value="open">Ish izlayapman</option>
                    <option value="offers">Takliflarga ochiqman</option>
                    <option value="busy">Hozir bandman</option>
                  </select>
                </label>
                <button
                  className="career-button primary full"
                  disabled={busy}
                  onClick={() => void save(true)}
                >
                  Profilni e’lon qilish <ArrowUpRight size={18} />
                </button>
                {profile.published && (
                  <button
                    className="career-button secondary full"
                    disabled={busy}
                    onClick={() => void save(false)}
                  >
                    Katalogdan yashirish
                  </button>
                )}
              </>
            )}
            {error && <ErrorState message={error} />}{" "}
            {notice && (
              <div className="career-success" role="status">
                <Check size={18} />
                {notice}
              </div>
            )}
            <div className="career-editor-footer">
              <button
                className="career-button secondary small"
                disabled={busy}
                onClick={() => void save(false)}
              >
                <Save size={15} />
                {busy ? "Saqlanmoqda…" : "Qoralamani saqlash"}
              </button>
              <div>
                {tab > 0 && (
                  <button
                    className="career-icon-button"
                    aria-label="Oldingi bosqich"
                    onClick={() => setTab(tab - 1)}
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                {tab < 4 && (
                  <button
                    className="career-button primary small"
                    onClick={() => setTab(tab + 1)}
                  >
                    Keyingi <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

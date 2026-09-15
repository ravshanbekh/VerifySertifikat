"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Download,
  ExternalLink,
  Code2 as Github,
  GraduationCap,
  Link2 as Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Send,
  Flag,
} from "lucide-react";
import {
  careerApi,
  messageOf,
  availabilityLabel,
  type CareerProfile,
} from "@/lib/career";
import { useCareer } from "./CareerShell";
import { Avatar, EmptyState, ErrorState } from "./Catalog";
type Contacts = {
  email: string;
  phone: string;
  telegram: string;
  linkedin: string;
  has_cv: boolean;
};
export default function Profile({ id }: { id: string }) {
  const { me, href } = useCareer();
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Contacts | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [report, setReport] = useState(false);
  useEffect(() => {
    careerApi<{ data: CareerProfile }>(`/profiles/${id}`)
      .then((r) => setProfile(r.data))
      .catch((e) => setError(messageOf(e)));
  }, [id]);
  async function contact() {
    setBusy(true);
    try {
      const r = await careerApi<{ data: Contacts }>(
        `/profiles/${id}/contacts`,
        { method: "POST" },
      );
      setContacts(r.data);
      setNotice("");
    } catch (e) {
      setNotice(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <div className="career-container career-page-space">
        <ErrorState message={error} />
        <Link href={href("/candidates")}>Katalogga qaytish</Link>
      </div>
    );
  if (!profile)
    return (
      <div className="career-container career-page-space">
        <EmptyState
          title="Profil yuklanmoqda…"
          description="Ma’lumotlarni tayyorlayapmiz."
        />
      </div>
    );
  return (
    <div className="career-container career-page-space">
      <Link className="career-back" href={href("/candidates")}>
        <ArrowLeft size={16} />
        Mutaxassislar katalogi
      </Link>
      <section className="career-profile-banner">
        <div className="career-profile-heading">
          <Avatar profile={profile} large />
          <div>
            <div className="career-status">
              <i />
              {availabilityLabel(profile.availability)}
            </div>
            <h1>
              {profile.certificate.full_name}
              <BadgeCheck size={27} />
            </h1>
            <p>{profile.headline}</p>
            <div className="career-card-facts">
              <span>
                <MapPin size={15} />
                {profile.city}
              </span>
              <span>{profile.level}</span>
              <span>{profile.work_format}</span>
              <span>{profile.work_type}</span>
            </div>
          </div>
        </div>
      </section>
      <div className="career-profile-layout">
        <div>
          <section className="career-panel">
            <h2>Men haqimda</h2>
            <p className="career-prose">{profile.bio}</p>
          </section>
          <section className="career-panel">
            <h2>Texnologiya va ko‘nikmalar</h2>
            <div className="career-tags large">
              {profile.technologies.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <h3>Professional ko‘nikmalar</h3>
            <div className="career-tags">
              {profile.skills.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </section>
          <section className="career-panel">
            <h2>
              Amaliy loyihalar{" "}
              <span className="career-count">{profile.projects.length}</span>
            </h2>
            {profile.projects.length ? (
              profile.projects.map((p, i) => (
                <article className="career-project" key={i}>
                  <div className="career-project-icon">
                    <ExternalLink size={20} />
                  </div>
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer">
                        Loyihani ko‘rish <ArrowUpRight size={14} />
                      </a>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="career-muted">Loyihalar hali qo‘shilmagan.</p>
            )}
          </section>
          {profile.experience && (
            <section className="career-panel">
              <h2>
                <BriefcaseBusiness size={20} /> Tajriba
              </h2>
              <p className="career-prose">{profile.experience}</p>
            </section>
          )}
          <section className="career-panel">
            <h2>
              <GraduationCap size={21} /> Ta’lim
            </h2>
            <h3>{profile.certificate.course_name}</h3>
            <p className="career-muted">
              ITLive Academy{" "}
              {profile.certificate.course_end_date
                ? `· ${new Date(profile.certificate.course_end_date).getFullYear()}`
                : ""}
            </p>
          </section>
        </div>
        <aside>
          <section className="career-panel career-contact-panel">
            <h2>Bog‘lanish</h2>
            {contacts ? (
              <div className="career-contact-links">
                <a href={`tel:${contacts.phone}`}>
                  <Phone size={18} />
                  {contacts.phone}
                </a>
                <a
                  href={`https://t.me/${contacts.telegram}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send size={18} />@{contacts.telegram}
                </a>
                <a href={`mailto:${contacts.email}`}>
                  <Mail size={18} />
                  {contacts.email}
                </a>
                {contacts.linkedin && (
                  <a href={contacts.linkedin} target="_blank" rel="noreferrer">
                    <Linkedin size={18} />
                    LinkedIn profili
                  </a>
                )}
                {contacts.has_cv && (
                  <a href={`/api/career/v1/profiles/${id}/cv`}>
                    <Download size={18} />
                    CV yuklab olish
                  </a>
                )}
              </div>
            ) : me ? (
              <button
                className="career-button primary full"
                disabled={busy}
                onClick={contact}
              >
                {busy ? "Tekshirilmoqda…" : "Kontaktlarni ko‘rish"}
                <ArrowUpRight size={17} />
              </button>
            ) : (
              <Link
                className="career-button primary full"
                href={href("/login")}
              >
                Bog‘lanish uchun kiring <ArrowUpRight size={17} />
              </Link>
            )}
            <button
              className="career-button secondary full"
              disabled={!me || saved}
              onClick={async () => {
                try {
                  await careerApi(`/saved/${id}`, { method: "PUT" });
                  setSaved(true);
                } catch (e) {
                  setNotice(messageOf(e));
                }
              }}
            >
              {saved ? "Saqlangan" : "Nomzodni saqlash"}
            </button>
            {notice && (
              <p className="career-inline-error" role="alert">
                {notice}
              </p>
            )}
            <p className="career-helper">
              <ShieldCheck size={14} /> Kontaktlar tasdiqlangan ish beruvchilar
              uchun.
            </p>
          </section>
          {(profile.github || profile.portfolio) && (
            <section className="career-panel">
              <h3>Internetdagi ishlarim</h3>
              <div className="career-contact-links">
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noreferrer">
                    <Github size={18} />
                    GitHub <ArrowUpRight size={15} />
                  </a>
                )}
                {profile.portfolio && (
                  <a href={profile.portfolio} target="_blank" rel="noreferrer">
                    <ExternalLink size={18} />
                    Portfolio <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            </section>
          )}
          {profile.languages.length > 0 && (
            <section className="career-panel">
              <h3>Tillar</h3>
              {profile.languages.map((l) => (
                <p key={l} className="career-muted">
                  {l}
                </p>
              ))}
            </section>
          )}
          {me && (
            <>
              <button
                className="career-text-button"
                onClick={() => setReport(!report)}
              >
                <Flag size={14} />
                Profil haqida xabar berish
              </button>
              {report && (
                <form
                  className="career-panel"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const reason = new FormData(e.currentTarget).get("reason");
                    try {
                      await careerApi(`/profiles/${id}/report`, {
                        method: "POST",
                        body: JSON.stringify({ reason }),
                      });
                      setNotice("Xabaringiz administratorga yuborildi.");
                      setReport(false);
                    } catch (err) {
                      setNotice(messageOf(err));
                    }
                  }}
                >
                  <label className="career-field">
                    Xabar sababi
                    <textarea
                      name="reason"
                      minLength={10}
                      maxLength={1000}
                      required
                    />
                  </label>
                  <button className="career-button secondary">Yuborish</button>
                </form>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

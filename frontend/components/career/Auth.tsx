"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  GraduationCap,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { careerApi, messageOf } from "@/lib/career";
import { useCareer } from "./CareerShell";
import { ErrorState } from "./Catalog";
type Eligibility = {
  grant: string;
  full_name: string;
  course_name: string;
  serial_number: string;
};
export default function Auth({ login = false }: { login?: boolean }) {
  const { base, href, refresh } = useCareer();
  const params = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState(
    params.get("role") === "employer" ? "employer" : "graduate",
  );
  const [stage, setStage] = useState(0);
  const [proof, setProof] = useState<Eligibility | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (!login && role === "graduate" && !proof) {
        const r = await careerApi<{ data: Eligibility }>("/eligibility", {
          method: "POST",
          body: JSON.stringify(values),
        });
        setProof(r.data);
        setStage(1);
      } else {
        await careerApi(login ? "/login" : "/register", {
          method: "POST",
          body: JSON.stringify({
            ...values,
            role,
            grant: proof?.grant,
            consent: values.consent === "on",
          }),
        });
        await refresh();
        router.push(href("/dashboard"));
      }
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="career-auth career-container">
      <section className="career-auth-form">
        <Link href={href()} className="career-back">
          <ArrowLeft size={16} />
          Bosh sahifaga
        </Link>
        <h2>
          {login
            ? "Yana xush kelibsiz."
            : stage === 1
              ? "Tanishganimizdan xursandmiz."
              : "Karyerangizga yo‘l oching."}
        </h2>
        <p className="career-muted">
          {login
            ? "ITLive Career hisobingizga kiring."
            : "O‘zingizga mos rolni tanlang va boshlang."}
        </p>
        {!login && (
          <div
            className="career-role-select"
            role="group"
            aria-label="Hisob turi"
          >
            <button
              type="button"
              className={role === "graduate" ? "selected" : ""}
              onClick={() => {
                setRole("graduate");
                setStage(0);
                setProof(null);
                setError("");
              }}
            >
              <GraduationCap />
              <strong>Bitiruvchi</strong>
              <span>Karyeramni boshlayman</span>
            </button>
            <button
              type="button"
              className={role === "employer" ? "selected" : ""}
              onClick={() => {
                setRole("employer");
                setStage(1);
                setProof(null);
                setError("");
              }}
            >
              <BriefcaseBusiness />
              <strong>Ish beruvchi</strong>
              <span>Jamoamga inson izlayman</span>
            </button>
          </div>
        )}
        {proof && (
          <div className="career-proof-panel">
            <BadgeCheck />
            <div>
              <strong>{proof.full_name}</strong>
              <span>
                {proof.course_name} · {proof.serial_number}
              </span>
            </div>
          </div>
        )}
        <form
          onSubmit={submit}
          key={`${role}-${stage}-${login}`}
          className="career-form-stack"
        >
          {!login && role === "graduate" && !proof ? (
            <>
              <label className="career-field">
                Sertifikat raqami
                <input
                  name="serial_number"
                  placeholder="Sertifikatingizdagi to‘liq raqam"
                  required
                  maxLength={100}
                />
              </label>
              <label className="career-field">
                Shaxsiy faollashtirish kodi
                <input
                  name="code"
                  placeholder="Akademiya bergan kod"
                  required
                  minLength={10}
                  maxLength={100}
                  autoComplete="off"
                />
              </label>
              <p className="career-helper">
                Kod sertifikatning haqiqiy egasi ekaningizni tasdiqlaydi. Uni
                ITLive administratoridan olasiz.
              </p>
            </>
          ) : (
            <>
              {!login && role === "employer" && (
                <>
                  <label className="career-field">
                    Kompaniya nomi
                    <input
                      name="company_name"
                      required
                      minLength={2}
                      maxLength={120}
                      autoComplete="organization"
                    />
                  </label>
                  <label className="career-field">
                    Mas’ul shaxsning F.I.Sh.
                    <input
                      name="full_name"
                      required
                      minLength={3}
                      maxLength={100}
                      autoComplete="name"
                    />
                  </label>
                  <label className="career-field">
                    Faoliyat sohasi
                    <input
                      name="industry"
                      required
                      placeholder="Masalan, dasturiy ta’minot"
                      minLength={2}
                      maxLength={120}
                    />
                  </label>
                  <label className="career-field">
                    Kompaniya sayti <small>ixtiyoriy</small>
                    <input name="website" type="url" placeholder="https://" />
                  </label>
                </>
              )}
              <label className="career-field">
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={
                    role === "employer" ? "hr@kompaniya.uz" : "siz@example.com"
                  }
                  maxLength={254}
                />
              </label>
              {!login && (
                <div className="career-form-row">
                  <label className="career-field">
                    Telefon
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      placeholder="+998 90 123 45 67"
                    />
                  </label>
                  <label className="career-field">
                    Telegram
                    <input name="telegram" required placeholder="@username" />
                  </label>
                </div>
              )}
              <label className="career-field">
                Parol
                <div className="career-password">
                  <input
                    name="password"
                    type={show ? "text" : "password"}
                    autoComplete={login ? "current-password" : "new-password"}
                    required
                    minLength={login ? 1 : 10}
                    maxLength={72}
                    placeholder={login ? "Parolingiz" : "Kamida 10 belgi"}
                  />
                  <button
                    type="button"
                    aria-label={
                      show ? "Parolni yashirish" : "Parolni ko‘rsatish"
                    }
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              {!login && (
                <label className="career-check">
                  <input name="consent" type="checkbox" required />
                  <span>
                    <Link href={href("/terms")} target="_blank">
                      Foydalanish shartlari
                    </Link>{" "}
                    va{" "}
                    <Link href={href("/privacy")} target="_blank">
                      maxfiylik qoidalari
                    </Link>{" "}
                    bilan tanishdim va roziman.
                  </span>
                </label>
              )}
            </>
          )}
          {error && <ErrorState message={error} />}
          <button
            type="submit"
            disabled={busy}
            className="career-button primary full"
          >
            {busy
              ? "Tekshirilmoqda…"
              : login
                ? "Hisobga kirish"
                : role === "graduate" && !proof
                  ? "Sertifikatni tasdiqlash"
                  : "Hisob yaratish"}
            {!busy && (proof ? <Check size={18} /> : <ArrowRight size={18} />)}
          </button>
        </form>
        <p className="career-auth-switch">
          {login ? "Hali profilingiz yo‘qmi?" : "Hisobingiz bormi?"}{" "}
          <Link href={href(login ? "/register" : "/login")}>
            {login ? "Ro‘yxatdan o‘tish" : "Kirish"}
          </Link>
        </p>
        {login && (
          <>
            <p className="career-helper">
              Parolni tiklash kerak bo‘lsa, shaxsingizni tasdiqlash uchun ITLive
              administratoriga murojaat qiling.
            </p>
            <p className="career-helper">
              Administrator sifatida kirmoqchimisiz?{" "}
              <a
                href={
                  base ? "/admin/login" : "https://verify.itlive.uz/admin/login"
                }
              >
                Umumiy admin kabinetiga o‘ting
              </a>
            </p>
          </>
        )}
      </section>
    </div>
  );
}

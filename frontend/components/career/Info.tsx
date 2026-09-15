"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  Search,
  ShieldCheck,
  MessagesSquare,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { useCareer } from "./CareerShell";
export default function Info({ kind }: { kind: string }) {
  const { href } = useCareer();
  const employer = kind === "employers";
  if (kind === "privacy" || kind === "terms")
    return (
      <div className="career-container career-page-space career-reading">
        <div className="career-eyebrow">ITLIVE CAREER</div>
        <h1 className="career-page-title">
          {kind === "privacy" ? "Maxfiylik qoidalari" : "Foydalanish shartlari"}
        </h1>
        <p className="career-muted">
          Mahsulotning dastlabki qoidalari · 9-sentabr 2026
        </p>
        {(kind === "privacy"
          ? [
              [
                "Qanday ma’lumotlar ishlatiladi?",
                "Akkaunt uchun email, telefon va Telegram; professional profil uchun ta’lim, ko‘nikmalar, loyihalar va ixtiyoriy fayllar saqlanadi. Sertifikat ma’lumoti ITLive Verify bazasidan olinadi.",
              ],
              [
                "Kim ko‘ra oladi?",
                "E’lon qilingan profilning professional ma’lumotlari ochiq katalogda ko‘rinadi. Email, telefon, Telegram, LinkedIn va CV faqat tasdiqlangan ish beruvchilarga taqdim etiladi. Kontaktlarni ochish va CV yuklash hodisalari qayd etiladi.",
              ],
              [
                "Profilingizni boshqarish",
                "Kabinetdan profilingizni tahrirlashingiz va katalogdan yashirishingiz mumkin. Akkauntni o‘chirish, shaxsiy ma’lumotlarni tuzatish yoki nusxa olish uchun ITLive Academy administratoriga murojaat qiling.",
              ],
              [
                "Sessiya va sozlamalar",
                "Kirish sessiyasi himoyalangan cookie orqali, rang rejimi brauzerda saqlanadi. Ushbu versiyada reklama kuzatuv vositalari qo‘shilmagan.",
              ],
            ]
          : [
              [
                "Platforma kim uchun?",
                "Bitiruvchi akkaunti ITLive sertifikati va akademiya bergan shaxsiy faollashtirish kodi orqali ochiladi. Ish beruvchilar administrator tasdig‘idan so‘ng nomzodlar bilan bog‘lanishlari mumkin.",
              ],
              [
                "Foydalanish qoidalari",
                "Faqat o‘zingizga tegishli va to‘g‘ri ma’lumotni kiriting. Boshqa kishining sertifikati yoki kodi bilan ro‘yxatdan o‘tish, kontaktlarni ommaviy yig‘ish va spam yuborish mumkin emas.",
              ],
              [
                "Tasdiqlanganlik nimani anglatadi?",
                "ITLive Verified Graduate belgisi faqat akademiya sertifikatining haqiqiyligini bildiradi. Profilga qo‘shilgan har bir ko‘nikma yoki ish tajribasi alohida tekshirilgan degani emas. Platforma ishga joylashishni kafolatlamaydi.",
              ],
              [
                "Moderatsiya",
                "Noto‘g‘ri ma’lumot yoki qoidabuzarlik bo‘lsa profil yashirilishi va akkaunt bloklanishi mumkin. Sertifikat bekor qilinsa profil katalogdan chiqariladi.",
              ],
            ]
        ).map(([h, p]) => (
          <section key={h}>
            <h2>{h}</h2>
            <p>{p}</p>
          </section>
        ))}
      </div>
    );
  return (
    <>
      <section className="career-container career-info-hero">
        <div className="career-eyebrow">
          {employer ? "JAMOANGIZNING KEYINGI ISTE’DODI" : "TA’LIMDAN KARYERAGA"}
        </div>
        <h1>
          {employer ? (
            <>
              Kuchli jamoa
              <br />
              <span>to‘g‘ri insondan boshlanadi.</span>
            </>
          ) : (
            <>
              O‘rgandingiz. Yaratdingiz.
              <br />
              <span>Endi o‘zingizni ko‘rsating.</span>
            </>
          )}
        </h1>
        <p>
          {employer
            ? "Sertifikati tekshirilgan ITLive bitiruvchilari orasidan jamoangiz uchun dasturchi, dizayner va yangi iste’dod toping."
            : "ITLive Career — akademiyamiz bitiruvchilari va ish beruvchilarni birlashtiradigan professional platforma."}
        </p>
        <Link
          className="career-button primary"
          href={href(employer ? "/register?role=employer" : "/register")}
        >
          {employer ? "Ish beruvchi sifatida qo‘shilish" : "Profil yaratish"}
          <ArrowUpRight size={18} />
        </Link>
      </section>
      <section className="career-container career-info-grid">
        {(employer
          ? [
              [
                ShieldCheck,
                "Tasdiqlangan bitiruvchilar",
                "Har bir profil haqiqiy akademiya sertifikatiga bog‘langan.",
              ],
              [
                Search,
                "Qidirish oson",
                "Texnologiya, shahar, daraja va ish formati bo‘yicha saralang.",
              ],
              [
                MessagesSquare,
                "Bevosita muloqot",
                "Tasdiqlangan hisob bilan nomzodning kontaktlarini oching.",
              ],
            ]
          : [
              [
                GraduationCap,
                "01 · Sertifikat",
                "Administrator bergan shaxsiy kod va sertifikat raqamini kiriting.",
              ],
              [
                ShieldCheck,
                "02 · Professional profil",
                "Texnologiyalar, loyihalar va aloqa ma’lumotlarini to‘ldiring.",
              ],
              [
                MessagesSquare,
                "03 · Yangi imkoniyatlar",
                "Profilni e’lon qiling. Ish beruvchilar sizni topishsin.",
              ],
            ]
        ).map(([Icon, title, body], i) => {
          const I = Icon as typeof ShieldCheck;
          return (
            <article key={i} className="career-panel">
              <I size={28} />
              <h2>{title as string}</h2>
              <p>{body as string}</p>
            </article>
          );
        })}
      </section>
      <div className="career-container career-info-link">
        <Link href={href("/candidates")}>
          Bitiruvchilar bilan tanishish <ArrowRight size={18} />
        </Link>
      </div>
    </>
  );
}

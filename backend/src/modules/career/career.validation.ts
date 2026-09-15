import { AppError } from "../../middleware/error.middleware";
import { createHash } from "crypto";

export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function text(value: unknown, name: string, min = 0, max = 250): string {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new AppError(`${name}: ${min}–${max} belgi kiriting.`, 400);
  return value.trim();
}
export function choice(
  value: unknown,
  name: string,
  options: string[],
): string {
  const result = text(value, name, 1);
  if (!options.includes(result)) throw new AppError(`${name} noto‘g‘ri.`, 400);
  return result;
}
export function tags(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || value.length > 20)
    throw new AppError(`${name}: ko‘pi bilan 20 ta.`, 400);
  return [...new Set(value.map((v) => text(v, name, 1, 60)))];
}
export function link(value: unknown, name: string, host?: string): string {
  const result = text(value ?? "", name, 0, 500);
  if (!result) return "";
  try {
    const url = new URL(result);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (host && url.hostname !== host && url.hostname !== `www.${host}`)
    )
      throw new Error();
  } catch {
    throw new AppError(`${name}: to‘liq https:// havolani kiriting.`, 400);
  }
  return result;
}
export function accountInput(body: Record<string, unknown>) {
  const email = text(body.email, "Email", 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError("Email noto‘g‘ri.", 400);
  const password = text(body.password, "Parol", 10, 72);
  if (Buffer.byteLength(password) > 72)
    throw new AppError("Parol 72 baytdan oshmasin.", 400);
  const phone = text(body.phone, "Telefon", 9, 20).replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{8,14}$/.test(phone))
    throw new AppError("Telefonni +998 bilan kiriting.", 400);
  const telegram = text(body.telegram, "Telegram", 5, 80)
    .replace(/^https:\/\/t\.me\//, "")
    .replace(/^@/, "");
  if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(telegram))
    throw new AppError("Telegram foydalanuvchi nomi noto‘g‘ri.", 400);
  if (body.consent !== true)
    throw new AppError("Ma’lumotlardan foydalanishga rozilik zarur.", 400);
  return { email, password, phone, telegram };
}
export function profileInput(body: Record<string, unknown>) {
  if (!Array.isArray(body.projects) || body.projects.length > 8)
    throw new AppError("Ko‘pi bilan 8 ta loyiha kiriting.", 400);
  return {
    headline: text(body.headline, "Mutaxassislik", 0, 100),
    bio: text(body.bio, "O‘zingiz haqingizda", 0, 3000),
    city: text(body.city, "Shahar", 0, 80),
    level: choice(body.level, "Daraja", [
      "Intern",
      "Junior",
      "Middle",
      "Senior",
    ]),
    work_format: choice(body.work_format, "Ish formati", [
      "Remote",
      "Office",
      "Hybrid",
    ]),
    work_type: choice(body.work_type, "Ish turi", [
      "Full-time",
      "Part-time",
      "Internship",
      "Freelance",
    ]),
    availability: choice(body.availability, "Holat", [
      "open",
      "offers",
      "busy",
    ]),
    technologies: tags(body.technologies, "Texnologiyalar"),
    skills: tags(body.skills, "Ko‘nikmalar"),
    languages: tags(body.languages, "Tillar"),
    experience: text(body.experience, "Tajriba", 0, 5000),
    projects: body.projects.map((p: Record<string, unknown>) => ({
      name: text(p.name, "Loyiha nomi", 1, 100),
      description: text(p.description ?? "", "Tavsif", 0, 1000),
      url: link(p.url, "Loyiha havolasi"),
    })),
    linkedin: link(body.linkedin, "LinkedIn", "linkedin.com"),
    github: link(body.github, "GitHub", "github.com"),
    portfolio: link(body.portfolio, "Portfolio"),
    contact_consent: body.contact_consent === true,
  };
}
export function completion(p: {
  headline: string;
  bio: string;
  city: string;
  technologies: string[];
  skills: string[];
  avatar_url: string;
  projects: unknown;
  languages: string[];
  linkedin: string;
  github: string;
  contact_consent: boolean;
}): number {
  const essentials = [
    !!p.headline,
    p.bio.length >= 20,
    !!p.city,
    p.technologies.length >= 3,
    p.skills.length > 0,
    p.contact_consent,
  ];
  const extras = [
    !!p.avatar_url,
    Array.isArray(p.projects) && p.projects.length > 0,
    p.languages.length > 0,
    !!(p.linkedin || p.github),
  ];
  return (
    essentials.filter(Boolean).length * 12 + extras.filter(Boolean).length * 7
  );
}

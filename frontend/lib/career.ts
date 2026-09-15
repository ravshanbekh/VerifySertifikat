export interface CareerAccount {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  telegram: string;
  role: "graduate" | "employer";
  status: "active" | "pending" | "blocked";
  company_name?: string;
  industry?: string;
  website?: string;
}
export interface CareerProfile {
  id: string;
  headline: string;
  bio: string;
  city: string;
  level: string;
  work_format: string;
  work_type: string;
  availability: string;
  technologies: string[];
  skills: string[];
  languages: string[];
  experience: string;
  projects: { name: string; url: string; description: string }[];
  linkedin?: string;
  github: string;
  portfolio: string;
  avatar_url: string;
  published?: boolean;
  contact_consent?: boolean;
  completion?: number;
  cv_filename?: string;
  certificate: {
    full_name: string;
    course_name: string;
    course_end_date?: string;
    serial_number?: string;
    status?: string;
  };
}
export interface CareerMe {
  account: CareerAccount;
  profile: CareerProfile | null;
}
export interface CareerSummary {
  graduates: number;
  employers: number;
  technologies: string[];
  cities: string[];
  demo: boolean;
}
export interface CatalogResponse {
  data: CareerProfile[];
  meta: { total: number; page: number; totalPages: number };
}
export async function careerApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`/api/career/v1${path}`, {
      ...options,
      credentials: "same-origin",
      cache: "no-store",
      signal: options.signal || controller.signal,
      headers: {
        ...(!(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });
    const result = await response
      .json()
      .catch(() => ({ message: "Xizmat bilan bog‘lanib bo‘lmadi." }));
    if (!response.ok) throw new Error(result.message || "Xatolik yuz berdi.");
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error("So‘rov vaqti tugadi. Qayta urinib ko‘ring.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Xatolik yuz berdi.";
export const availabilityLabel = (s: string) =>
  ({ open: "Ish izlayapti", offers: "Takliflarga ochiq", busy: "Hozir band" })[
    s
  ] || s;

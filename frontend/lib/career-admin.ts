import { messageOf, type CareerAccount } from "@/lib/career";

export type CareerAdminAccount = CareerAccount & {
  profile?: {
    id: string;
    published: boolean;
    certificate: { serial_number: string };
  };
};

export type CareerAdminSummary = {
  graduates: number;
  employers: number;
  pending: number;
  blocked: number;
  published: number;
  events: number;
};

export type CareerAdminEvent = {
  id: string;
  action: string;
  target_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
  account?: { full_name: string; email: string; role: string } | null;
};

export async function careerAdminApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/career/v1/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || messageOf(data));
  return data;
}

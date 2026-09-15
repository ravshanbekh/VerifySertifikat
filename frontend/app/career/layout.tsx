import type { Metadata } from "next";
import { headers } from "next/headers";
import CareerShell from "@/components/career/CareerShell";
import "./career.css";
import "./career-refresh.css";
export const metadata: Metadata = {
  title: {
    default: "ITLive Career — Iste’doddan imkoniyatga",
    template: "%s | ITLive Career",
  },
  description:
    "ITLive Academy’ning sertifikati tasdiqlangan bitiruvchilari bilan tanishing. Jamoangiz uchun mutaxassis toping yoki karyerangizni boshlang.",
  keywords: "ITLive Career, bitiruvchilar, IT mutaxassis, karyera",
};
export default async function CareerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const base = h.get("x-career-base") === "root" ? "" : "/career";
  return <CareerShell base={base}>{children}</CareerShell>;
}

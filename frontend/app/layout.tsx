import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "ITLive Academy — Sertifikat Tekshirish",
  description:
    "ITLive Academy tomonidan berilgan sertifikatlarning haqiqiyligini tekshiring",
  keywords: "sertifikat, tekshirish, ITLive Academy, verify",
  icons: {
    icon: "/logo-dark.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CertRedirectPage() {
  const { serial } = useParams<{ serial: string }>();
  const router = useRouter();

  useEffect(() => {
    if (serial) {
      router.replace(`/?q=${serial}`);
    }
  }, [serial, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white/60 flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
        Sertifikat tekshirilmoqda...
      </div>
    </div>
  );
}

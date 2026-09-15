import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").split(":")[0];
  const careerHost =
    hostname === (process.env.CAREER_HOST || "career.itlive.uz") ||
    hostname === "career.localhost";
  const headers = new Headers(request.headers);
  // Overwrite, never trust client-provided routing hints.
  headers.set("x-career-base", careerHost ? "root" : "/career");
  const p = request.nextUrl.pathname;
  if (
    careerHost &&
    !p.startsWith("/career") &&
    !p.startsWith("/api/") &&
    !p.startsWith("/_next/") &&
    !p.startsWith("/uploads/") &&
    !/\.[a-z0-9]+$/i.test(p)
  ) {
    const url = new URL(request.url);
    url.pathname = `/career${p === "/" ? "" : p}`;
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

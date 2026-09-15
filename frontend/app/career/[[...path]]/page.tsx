import { Suspense } from "react";
import { notFound } from "next/navigation";
import Catalog from "@/components/career/Catalog";
import Auth from "@/components/career/Auth";
import Profile from "@/components/career/Profile";
import Dashboard from "@/components/career/Dashboard";
import Info from "@/components/career/Info";

export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const route = path.join("/");
  let page;
  if (!route) page = <Catalog home />;
  else if (route === "candidates") page = <Catalog />;
  else if (route === "saved") page = <Catalog savedOnly />;
  else if (path.length === 2 && path[0] === "candidates")
    page = <Profile key={path[1]} id={path[1]} />;
  else if (route === "register") page = <Auth key="register" />;
  else if (route === "login") page = <Auth key="login" login />;
  else if (route === "dashboard") page = <Dashboard />;
  else if (["employers", "about", "privacy", "terms"].includes(route))
    page = <Info kind={route} />;
  else notFound();
  return (
    <Suspense
      fallback={
        <div className="career-container career-page-space">Yuklanmoqda…</div>
      }
    >
      {page}
    </Suspense>
  );
}

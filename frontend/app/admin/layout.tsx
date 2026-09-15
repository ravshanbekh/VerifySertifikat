"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { authApi, type User } from "@/lib/api";
import {
  LayoutDashboard,
  FileText,
  Users,
  ScrollText,
  LogOut,
  BriefcaseBusiness,
  Menu,
  X,
} from "lucide-react";

const navGroups = [
  {
    label: "Umumiy boshqaruv",
    items: [
      {
        href: "/admin/dashboard",
        label: "Umumiy dashboard",
        icon: LayoutDashboard,
        roles: ["operator", "super_admin"],
      },
    ],
  },
  {
    label: "Sertifikat tizimi",
    items: [
      {
        href: "/admin/certificates",
        label: "Sertifikatlar",
        icon: FileText,
        roles: ["operator", "super_admin"],
      },
      {
        href: "/admin/users",
        label: "Xodimlar",
        icon: Users,
        roles: ["super_admin"],
      },
      {
        href: "/admin/audit",
        label: "Sertifikat auditi",
        icon: ScrollText,
        roles: ["super_admin"],
      },
    ],
  },
  {
    label: "Career platformasi",
    items: [
      {
        href: "/admin/career",
        label: "Career boshqaruvi",
        icon: BriefcaseBusiness,
        roles: ["super_admin"],
      },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Login sahifasini layout'dan chiqaramiz
  const isLoginPage = pathname === "/admin/login";
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(!isLoginPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoginPage) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    authApi
      .getMe()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/admin/login");
      })
      .finally(() => setChecking(false));
  }, [router, isLoginPage]);

  // Login sahifasi — layout yo'q, to'g'ridan children
  if (isLoginPage) return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/admin/login");
  };

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 shadow-xl lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/logo-dark.svg"
              alt="ITLive Logo"
              width={110}
              height={36}
              className="object-contain block dark:hidden"
              priority
            />
            <Image
              src="/logo.svg"
              alt="ITLive Logo"
              width={110}
              height={36}
              className="object-contain hidden dark:block"
              priority
            />
          </div>
          {/* Mobile Close Btn */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 p-4 space-y-6 overflow-y-auto"
          aria-label="Admin bo‘limlari"
        >
          {filteredGroups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <p className="px-4 mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-100 dark:shadow-none"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 flex-shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4 p-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
              {user.full_name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-slate-900 dark:text-white text-sm font-bold truncate">
                {user.full_name}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium capitalize">
                {user.role === "super_admin" ? "Super Admin" : "Operator"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Mavzu
            </span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 rounded-xl text-sm transition-colors border border-transparent hover:border-red-100 dark:hover:border-transparent"
          >
            <LogOut className="w-4 h-4" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-slate-900 dark:text-white font-bold">
              Admin Panel
            </span>
          </div>
          <ThemeToggle />
        </div>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

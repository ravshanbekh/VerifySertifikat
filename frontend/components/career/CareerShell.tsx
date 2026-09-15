"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Menu,
  Moon,
  Sun,
  X,
  LogOut,
} from "lucide-react";
import { careerApi, messageOf, type CareerMe } from "@/lib/career";

const CareerContext = createContext<{
  base: string;
  me: CareerMe | null;
  refresh: () => Promise<void>;
  href: (path?: string) => string;
}>({
  base: "/career",
  me: null,
  refresh: async () => {},
  href: (p = "") => `/career${p}`,
});
export const useCareer = () => useContext(CareerContext);
export function CareerBrand() {
  return (
    <span className="career-brand">
      <span className="career-brand-symbol">
        <BriefcaseBusiness size={23} />
      </span>
      <span>
        itlive<span className="career-brand-divider">/</span>
        <strong>career</strong>
      </span>
    </span>
  );
}
export default function CareerShell({
  children,
  base,
}: {
  children: React.ReactNode;
  base: string;
}) {
  const [me, setMe] = useState<CareerMe | null>(null);
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [demo, setDemo] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const href = useCallback((p = "") => `${base}${p}` || "/", [base]);
  const refresh = useCallback(async () => {
    try {
      const r = await careerApi<{ data: CareerMe }>("/me");
      setMe(r.data);
    } catch {
      setMe(null);
    }
  }, []);
  useEffect(() => {
    let live = true;
    careerApi<{ data: { demo: boolean } }>("/summary")
      .then((r) => {
        if (live) setDemo(r.data.demo);
      })
      .catch(() => {});
    careerApi<{ data: CareerMe }>("/me")
      .then((r) => {
        if (live) setMe(r.data);
      })
      .catch(() => {
        if (live) setMe(null);
      });
    return () => {
      live = false;
    };
  }, []);
  const links = [
    { path: "/candidates", label: "Mutaxassislar" },
    { path: "/employers", label: "Ish beruvchilar" },
  ];
  async function logout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await careerApi("/logout", { method: "POST" });
      await refresh();
      window.location.assign(href());
    } catch (error) {
      setLogoutError(messageOf(error));
      setLoggingOut(false);
    }
  }
  const nav = links.map((l) => (
    <Link
      key={l.path}
      href={href(l.path)}
      onClick={() => setOpen(false)}
      className={pathname.endsWith(l.path) ? "active" : ""}
      aria-current={pathname.endsWith(l.path) ? "page" : undefined}
    >
      {l.label}
    </Link>
  ));
  return (
    <CareerContext.Provider value={{ base, me, refresh, href }}>
      <div className="career-app">
        <a href="#career-main" className="career-skip">
          Asosiy mazmunga o‘tish
        </a>
        <header className="career-header">
          <div className="career-container career-header-inner">
            <Link href={href()} aria-label="ITLive Career bosh sahifa">
              <CareerBrand />
            </Link>
            <nav className="career-nav" aria-label="Asosiy navigatsiya">
              {nav}
            </nav>
            <div className="career-header-actions">
              <button
                type="button"
                className="career-icon-button career-theme-toggle"
                aria-label="Kunduzgi yoki tungi rejim"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                <Sun className="career-sun" size={19} />
                <Moon className="career-moon" size={19} />
              </button>
              {me ? (
                <>
                  <Link
                    className="career-button primary small"
                    href={href("/dashboard")}
                  >
                    Kabinetim <ArrowUpRight size={15} />
                  </Link>
                  <button
                    className="career-icon-button career-desktop"
                    aria-label="Hisobdan chiqish"
                    disabled={loggingOut}
                    onClick={logout}
                  >
                    <LogOut size={17} />
                  </button>
                </>
              ) : (
                <>
                  <Link className="career-login-link" href={href("/login")}>
                    Kirish
                  </Link>
                  <Link
                    href={href("/register")}
                    className="career-button primary small career-desktop"
                  >
                    Profil yaratish <ArrowUpRight size={15} />
                  </Link>
                </>
              )}
              <Dialog.Root open={open} onOpenChange={setOpen}>
                <Dialog.Trigger asChild>
                  <button
                    className="career-icon-button career-mobile-menu"
                    aria-label="Menyuni ochish"
                  >
                    <Menu size={21} />
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="career-overlay" />
                  <Dialog.Content className="career-mobile-dialog">
                    <div className="career-dialog-head">
                      <Dialog.Title>Menyu</Dialog.Title>
                      <Dialog.Close asChild>
                        <button
                          className="career-icon-button"
                          aria-label="Menyuni yopish"
                        >
                          <X />
                        </button>
                      </Dialog.Close>
                    </div>
                    <Dialog.Description className="career-muted">
                      ITLive Career bo‘limlari
                    </Dialog.Description>
                    <nav>
                      {nav}
                      <Link
                        href={href(me ? "/dashboard" : "/register")}
                        onClick={() => setOpen(false)}
                      >
                        {me ? "Kabinetim" : "Profil yaratish"}
                      </Link>
                      {me && (
                        <button
                          className="career-button secondary"
                          disabled={loggingOut}
                          onClick={logout}
                        >
                          <LogOut size={17} />
                          {loggingOut ? "Chiqilmoqda…" : "Hisobdan chiqish"}
                        </button>
                      )}
                    </nav>
                    {logoutError && (
                      <p role="alert" className="career-inline-error">
                        {logoutError}
                      </p>
                    )}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        </header>
        <main id="career-main">
          {demo && (
            <div className="career-container career-demo-note">
              Sinov rejimi · Bu profillar haqiqiy bitiruvchilar emas.
            </div>
          )}
          {logoutError && (
            <p role="alert" className="career-error career-container">
              {logoutError}
            </p>
          )}
          {children}
        </main>
        <footer className="career-footer">
          <div className="career-container">
            <div className="career-footer-bottom">
              <span>© {new Date().getFullYear()} ITLive Academy</span>
              <div>
                <Link href={href("/privacy")}>Maxfiylik</Link>
                <Link href={href("/terms")}>Foydalanish shartlari</Link>
                <Link href={href("/about")}>Platforma haqida</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </CareerContext.Provider>
  );
}

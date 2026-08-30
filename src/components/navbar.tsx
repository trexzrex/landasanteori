"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FlaskConical, Menu, User, LogOut, LayoutDashboard, History, UserCircle, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [open, setOpen] = React.useState(false);
  const [activeHash, setActiveHash] = React.useState("");
  const [user, setUser] = React.useState<Profile | null>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const syncActiveHash = () => setActiveHash(window.location.hash);

    syncActiveHash();
    window.addEventListener("hashchange", syncActiveHash);
    return () => window.removeEventListener("hashchange", syncActiveHash);
  }, []);

  React.useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (data) setUser(data);
      }
    }
    void loadUser();
  }, [supabase]);

  React.useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleNavClick = (href: string) => {
    setActiveHash(href.includes("#") ? href.split("/")[1] : "");
    setOpen(false);
  };

  const isActive = (href: string) => {
    if (href.includes("#")) {
      return pathname === "/" && activeHash === href.split("/")[1];
    }
    return pathname === href && !activeHash;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDropdownOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Landasan Teori - Beranda"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md transition-transform duration-200 group-hover:scale-105">
            <FlaskConical className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-semibold tracking-tight">
            Landasan<span className="text-primary">Teori</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive(item.href) && "text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/dashboard"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                pathname === "/dashboard" && !activeHash && "text-primary"
              )}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="gap-2"
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
                aria-controls="user-dropdown-menu"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">{user.nama || "User"}</span>
              </Button>
              {dropdownOpen && (
                <div
                  id="user-dropdown-menu"
                  role="menu"
                  aria-label="Menu akun"
                  className="absolute right-0 top-12 z-50 w-48 rounded-lg border bg-card p-2 shadow-lg"
                >
                  <Link
                    role="menuitem"
                    href="/dashboard"
                    className="flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Dashboard
                  </Link>
                  <Link
                    role="menuitem"
                    href="/dashboard/history"
                    className="flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <History className="h-4 w-4" aria-hidden="true" />
                    Riwayat
                  </Link>
                  <Link
                    role="menuitem"
                    href="/dashboard/profile"
                    className="flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" aria-hidden="true" />
                    Profil
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      role="menuitem"
                      href="/dashboard/admin"
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Admin
                    </Link>
                  )}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] sm:inline-flex"
            >
              Masuk
            </Link>
          )}

          {user && (
            <Link
              href="/generate"
              className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] sm:inline-flex"
            >
              Mulai Buat
            </Link>
          )}

          <ThemeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Buka menu navigasi"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <FlaskConical className="h-5 w-5 text-primary" aria-hidden="true" />
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1" aria-label="Navigasi mobile">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      Dashboard
                    </Link>
                    <Link
                      href="/generate"
                      onClick={() => setOpen(false)}
                      className="rounded-lg bg-primary px-4 py-3 text-center text-base font-medium text-primary-foreground shadow transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Mulai Buat
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-2 flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Keluar
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="mt-4 rounded-lg bg-primary px-4 py-3 text-center text-base font-medium text-primary-foreground shadow transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Masuk
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FlaskConical, History, LayoutDashboard, LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

const items = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/dashboard/history", label: "Riwayat", icon: History },
  { href: "/dashboard/profile", label: "Profil", icon: UserCircle },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [profile, setProfile] = React.useState<Profile | null>(null);

  React.useEffect(() => {
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
    });
  }, [supabase]);

  const navItems =
    profile?.role === "admin"
      ? [...items, { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck }]
      : items;
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Header mobile: sticky, memuat logo, tema, dan tombol keluar. */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl lg:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
          </span>
          Landasan<span className="-ml-2 text-primary">Teori</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Keluar dari akun">
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {/* Sidebar desktop. */}
      <aside className="hidden bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r">
        <div className="flex h-16 items-center px-5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
            </span>
            Landasan<span className="-ml-2 text-primary">Teori</span>
          </Link>
        </div>

        <nav className="px-3 py-3" aria-label="Navigasi dashboard">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "mb-1 flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                pathname === href && "bg-primary/10 text-primary"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t p-3">
          <p className="truncate px-3 py-2 text-sm font-medium">{profile?.nama || "Pengguna"}</p>
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Keluar
          </Button>
        </div>
      </aside>

      <main id="main-content" className="min-w-0 px-4 pb-24 pt-8 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
        {children}
      </main>

      {/* Bottom navigation mobile: fixed, jempol mudah menjangkau, hormati safe area. */}
      <nav
        aria-label="Navigasi dashboard"
        className="fixed inset-x-0 bottom-0 z-40 grid auto-cols-fr grid-flow-col border-t border-border bg-card/90 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  active && "bg-primary/10"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

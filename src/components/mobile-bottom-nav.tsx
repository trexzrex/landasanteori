"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutDashboard, ShieldCheck, Sparkles, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

const baseItems = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/dashboard/history", label: "Riwayat", icon: History },
  { href: "/dashboard/profile", label: "Profil", icon: UserCircle },
];

export function MobileBottomNav() {
  const pathname = usePathname();
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
      ? [...baseItems, { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck }]
      : baseItems;

  return (
    <nav
      aria-label="Navigasi utama"
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
  );
}

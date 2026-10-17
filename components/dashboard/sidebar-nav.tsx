"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Trash2,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/app/actions/auth";

const navItems = [
  { label: "Command center", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders board", href: "/dashboard/orders", icon: KanbanSquare, badge: true },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Trash", href: "/dashboard/orders/trash", icon: Trash2 },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  if (href === "/dashboard/orders") {
    return pathname.startsWith(href) && !pathname.startsWith("/dashboard/orders/trash");
  }
  return pathname.startsWith(href);
}

function NavLinks({
  onNavigate,
  webQuotes,
  layoutGroup,
}: {
  onNavigate?: () => void;
  webQuotes: number;
  layoutGroup: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="flex-1 space-y-0.5 px-3 py-4">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 px-3.5 text-sm font-semibold transition-colors",
              active ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {active && (
              <motion.span
                layoutId={`${layoutGroup}-active`}
                className="absolute inset-0 bg-surface-container-high"
                transition={{ type: "spring", stiffness: 420, damping: 38 }}
              >
                <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] bg-brand" />
              </motion.span>
            )}
            <item.icon
              className={cn(
                "relative h-4 w-4 shrink-0 transition-colors",
                active ? "text-brand" : "group-hover:text-on-surface",
              )}
            />
            <span className="relative truncate">{item.label}</span>
            {item.badge && webQuotes > 0 && (
              <span className="spec relative ml-auto bg-brand px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-white">
                {webQuotes} new
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOut() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex min-h-11 w-full items-center gap-3 px-3.5 text-sm text-on-surface-variant transition-colors hover:text-accent-ink"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-outline-variant/30 px-5 py-5">
      <img src="/images/art-n-me-logo.jpg" alt="" className="h-10 w-10 object-cover" />
      <div className="flex flex-col">
        <span className="font-headline text-lg font-bold uppercase leading-tight tracking-tight">
          Art &apos;n Me
        </span>
        <span className="spec text-[10px] text-on-surface-variant">Staff portal</span>
      </div>
    </div>
  );
}

function DesktopSidebar({ webQuotes }: { webQuotes: number }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-outline-variant/30 bg-surface-container-lowest md:flex">
      <Brand />
      <NavLinks webQuotes={webQuotes} layoutGroup="desktop" />
      <div className="space-y-1 border-t border-outline-variant/30 px-3 py-4">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 px-3.5 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <ExternalLink className="h-4 w-4" />
          View public site
        </Link>
        <SignOut />
        <div className="flex items-center justify-between px-3.5 pt-2">
          <span className="spec text-[10px] text-on-surface-variant">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

function MobileHeader({ webQuotes }: { webQuotes: number }) {
  const [open, setOpen] = useState(false);
  const closeSheet = useCallback(() => setOpen(false), []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 md:hidden">
      <div className="flex items-center gap-2.5">
        <img src="/images/art-n-me-logo.jpg" alt="" className="h-8 w-8 object-cover" />
        <span className="font-headline text-base font-bold uppercase tracking-tight">
          Art &apos;n Me
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              {webQuotes > 0 && !open && (
                <span className="absolute right-2 top-2 h-2 w-2 bg-brand" />
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-surface-container-lowest p-0">
            <SheetHeader className="border-b border-outline-variant/30 px-5 py-5">
              <SheetTitle className="flex items-center gap-2.5 font-headline text-lg uppercase tracking-tight">
                <img src="/images/art-n-me-logo.jpg" alt="" className="h-8 w-8 object-cover" />
                Art &apos;n Me
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col">
              <NavLinks onNavigate={closeSheet} webQuotes={webQuotes} layoutGroup="mobile" />
              <div className="border-t border-outline-variant/30 px-3 py-4">
                <SignOut />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SidebarNav({ webQuotes = 0 }: { webQuotes?: number }) {
  return (
    <>
      <DesktopSidebar webQuotes={webQuotes} />
      <MobileHeader webQuotes={webQuotes} />
    </>
  );
}

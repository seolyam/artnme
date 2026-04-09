"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  LogOut,
  Printer,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 rounded-none relative",
              isActive
                ? "bg-surface-container-high text-foreground"
                : "text-muted-foreground hover:bg-surface-container hover:text-foreground",
            )}
          >
            {/* Active indicator — bleeding red edge */}
            {isActive && (
              <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-primary-container dark:bg-primary-container" />
            )}
            <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive && "text-primary-container dark:text-primary")} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="px-3 py-4 space-y-2 border-t border-surface-container-high">
      <div className="flex items-center justify-between px-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "var(--font-label)" }}>Theme</span>
        <ThemeToggle />
      </div>
      <form action={logout}>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          type="submit"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </form>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-container-high">
      <div className="flex h-9 w-9 items-center justify-center bg-primary-container dark:bg-primary-container text-white">
        <Printer className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col">
        <span
          className="text-lg font-bold tracking-tighter uppercase leading-tight"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          Art &apos;n Me
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] leading-none">
          Staff Portal
        </span>
      </div>
    </div>
  );
}

/** Desktop sidebar — hidden on mobile */
function DesktopSidebar() {
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col bg-card border-r border-surface-container-high sticky top-0">
      <Brand />
      <NavLinks />
      <SidebarFooter />
    </aside>
  );
}

/** Mobile top bar + sheet sidebar — shown only on mobile */
function MobileHeader() {
  const [open, setOpen] = useState(false);
  const closeSheet = useCallback(() => setOpen(false), []);

  return (
    <header className="flex md:hidden items-center justify-between bg-card px-4 py-3 border-b border-surface-container-high sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center bg-primary-container dark:bg-primary-container text-white">
          <Printer className="h-3.5 w-3.5" strokeWidth={2.5} />
        </div>
        <span
          className="text-base font-bold tracking-tight uppercase"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          Art &apos;n Me
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-card">
            <SheetHeader className="px-6 py-5 border-b border-surface-container-high">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center bg-primary-container dark:bg-primary-container text-white">
                  <Printer className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <span style={{ fontFamily: "var(--font-headline)" }} className="uppercase tracking-tighter">
                  Art &apos;n Me
                </span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col">
              <NavLinks onNavigate={closeSheet} />
              <div className="border-t border-surface-container-high px-3 py-4">
                <form action={logout}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                    type="submit"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </form>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SidebarNav() {
  return (
    <>
      <DesktopSidebar />
      <MobileHeader />
    </>
  );
}

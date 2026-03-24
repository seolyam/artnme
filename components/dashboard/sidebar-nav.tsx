"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  LogOut,
  Printer,
  Menu,
  ExternalLink,
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
  { label: "View Website", href: "/", icon: ExternalLink },
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
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t px-3 py-4 space-y-2">
      <div className="flex items-center justify-between px-3">
        <span className="text-xs text-muted-foreground">Theme</span>
        <ThemeToggle />
      </div>
      <form action={logout}>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
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
    <div className="flex items-center gap-3 px-6 py-5 border-b">
      <div className="relative h-8 w-8 overflow-hidden rounded-md border shrink-0">
        <Image 
          src="/images/art-n-me-logo.jpg" 
          alt="Art 'n Me Logo" 
          fill
          className="object-cover"
        />
      </div>
      <span className="text-lg font-bold tracking-tight">
        Art &apos;n Me
      </span>
    </div>
  );
}

/** Desktop sidebar — hidden on mobile */
function DesktopSidebar() {
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-card">
      <Brand />
      <NavLinks />
      <SidebarFooter />
    </aside>
  );
}

/** Mobile top bar + sheet sidebar — shown only on mobile */
function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex md:hidden items-center justify-between border-b bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative h-7 w-7 overflow-hidden rounded-md border">
          <Image 
            src="/images/art-n-me-logo.jpg" 
            alt="Art 'n Me Logo" 
            fill
            className="object-cover"
          />
        </div>
        <span className="text-base font-bold tracking-tight">
          Art &apos;n Me
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="px-6 py-5 border-b">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Printer className="h-4 w-4" />
                </div>
                Art &apos;n Me
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col">
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="border-t px-3 py-4">
                <form action={logout}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground"
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

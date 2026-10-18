import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Toaster } from "@/components/ui/sonner";
import { requireAuth } from "@/lib/auth";
import { getWebQuoteCount } from "@/app/actions/orders";
import { getMe } from "@/app/actions/staff";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { LiveUpdates } from "@/components/dashboard/live-updates";
import { StaffGuide } from "@/components/dashboard/staff-guide";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: edge middleware already redirects unauthenticated
  // users, but this ensures that even cached/route-handler paths still
  // enforce a session before any dashboard UI is rendered.
  await requireAuth();
  const [webQuotes, me] = await Promise.all([getWebQuoteCount(), getMe()]);

  return (
    <div className="flex h-screen flex-col bg-background md:flex-row print:block print:h-auto">
      <SidebarNav webQuotes={webQuotes} user={{ fullName: me.fullName, role: me.role }} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 print:overflow-visible print:p-0">{children}</main>
      <CommandPalette />
      <StaffGuide />
      <LiveUpdates />
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

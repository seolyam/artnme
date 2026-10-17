import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Toaster } from "@/components/ui/sonner";
import { requireAuth } from "@/lib/auth";
import { getWebQuoteCount } from "@/app/actions/orders";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: edge middleware already redirects unauthenticated
  // users, but this ensures that even cached/route-handler paths still
  // enforce a session before any dashboard UI is rendered.
  await requireAuth();
  const webQuotes = await getWebQuoteCount();

  return (
    <div className="flex h-screen flex-col bg-background md:flex-row">
      <SidebarNav webQuotes={webQuotes} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">{children}</main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

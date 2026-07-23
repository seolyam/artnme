import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { requireAuth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: edge middleware already redirects unauthenticated
  // users, but this ensures that even cached/route-handler paths still
  // enforce a session before any dashboard UI is rendered.
  await requireAuth();

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
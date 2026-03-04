import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col md:flex-row">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}

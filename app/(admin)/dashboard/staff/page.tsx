import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getMe, getStaffDirectory } from "@/app/actions/staff";
import { PageHeader } from "@/components/dashboard/page-header";
import { StaffManager } from "@/components/dashboard/staff-manager";

export default async function StaffPage() {
  const me = await getMe();
  if (me.role !== "admin") redirect("/dashboard");
  const { staff, authError } = await getStaffDirectory();

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Admin only"
        title="Staff"
        description="Add the people who use the portal, choose what they can do, and turn off an account when someone leaves. Their name stays on the orders they worked on."
      />
      {authError && (
        <div role="alert" className="flex gap-3 border border-[#f2b33d]/60 bg-[#f2b33d]/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-[#f2b33d]" />
          <div className="space-y-1">
            <p className="font-semibold">Supabase can&apos;t be reached for account changes.</p>
            <p className="text-on-surface-variant">
              {authError} Until then you can still change roles and deactivate people here, but you can&apos;t add new
              staff or set passwords, and emails and last sign-in times aren&apos;t shown.
            </p>
          </div>
        </div>
      )}
      <StaffManager staff={staff} meId={me.id} canManageAuth={!authError} />
    </div>
  );
}

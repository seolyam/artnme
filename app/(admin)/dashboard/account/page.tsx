import { getMe } from "@/app/actions/staff";
import { AccountForms } from "@/components/dashboard/account-forms";

export default async function AccountPage() {
  const me = await getMe();

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <p className="spec mb-2 text-[11px] text-on-surface-variant">Account · {me.role}</p>
        <h1 className="font-headline text-3xl font-bold uppercase leading-none tracking-[-0.04em] md:text-4xl">
          {me.fullName}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">{me.email}</p>
      </header>

      <AccountForms fullName={me.fullName} />
    </div>
  );
}

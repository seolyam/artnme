import { notFound } from "next/navigation";
import { AssistantChat } from "@/components/ai/assistant-chat";
import { PageHeader } from "@/components/dashboard/page-header";
import { aiStaffEnabled } from "@/lib/ai/flags";

export const metadata = { title: "Ask the shop" };

export default function AssistantPage() {
  if (!aiStaffEnabled()) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="AI assistant"
        title="Ask the shop"
        description="Quick answers about orders, balances, collections and sales, from the same data as Reports."
      />
      <AssistantChat />
    </div>
  );
}

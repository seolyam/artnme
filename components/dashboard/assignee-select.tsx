"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { assignOrder } from "@/app/actions/orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NOBODY = "__nobody";

export function AssigneeSelect({
  orderId,
  assignedTo,
  staff,
  meId,
}: {
  orderId: string;
  assignedTo: string | null;
  staff: { id: string; fullName: string }[];
  meId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(value: string) {
    const next = value === NOBODY ? null : value;
    if (next === assignedTo) return;
    startTransition(async () => {
      const result = await assignOrder(orderId, next);
      if (result.error) toast.error(result.error);
      else {
        toast.success(next ? "Job assigned" : "Job unassigned");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={assignedTo ?? NOBODY} onValueChange={change} disabled={pending}>
        <SelectTrigger className="h-9 w-full min-w-44 rounded-none" aria-label="Assigned to">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NOBODY}>Unassigned</SelectItem>
          {staff.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.fullName}
              {s.id === meId ? " (you)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />}
      {!pending && assignedTo !== meId && (
        <button
          type="button"
          onClick={() => change(meId)}
          className="spec shrink-0 text-[10px] text-on-surface-variant underline-offset-2 hover:text-on-surface hover:underline"
        >
          Take it
        </button>
      )}
    </div>
  );
}

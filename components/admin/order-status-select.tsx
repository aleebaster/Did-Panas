"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { NativeSelect } from "@/components/admin/native-select";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import type { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";

export function OrderStatusSelect({
  orderId,
  status,
  className,
}: {
  orderId: string;
  status: OrderStatus;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(async () => {
      await updateOrderStatusAction(orderId, next as OrderStatus);
      toast.success("Статус оновлено");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <NativeSelect
        value={status}
        onChange={handleChange}
        className={className ?? "w-44"}
        ariaLabel="Статус замовлення"
      >
        {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((key) => (
          <option key={key} value={key}>
            {ORDER_STATUS_LABELS[key]}
          </option>
        ))}
      </NativeSelect>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
    </div>
  );
}

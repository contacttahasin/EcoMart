import { CheckCircle2, RefreshCw, Truck, XCircle } from "lucide-react";
import type { OrderStatus } from "@/data/orders";

export const STATUS_BADGE: Record<OrderStatus, { label: string; className: string; icon: typeof Truck }> = {
  processing: { label: "Processing", className: "bg-primary-container/15 text-primary", icon: RefreshCw },
  shipped: { label: "In Transit", className: "bg-secondary-container text-on-secondary-container", icon: Truck },
  delivered: {
    label: "Delivered",
    className: "bg-surface-container-highest text-on-surface-variant",
    icon: CheckCircle2,
  },
  cancelled: { label: "Cancelled", className: "bg-error-container text-on-error-container", icon: XCircle },
};

export function formatOrderDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

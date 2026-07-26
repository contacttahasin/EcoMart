import { supabase } from "@/lib/supabase";

// No admin-configurable commission table exists yet — a flat platform
// commission is the simplest honest stand-in until one does.
export const PLATFORM_COMMISSION_RATE = 0.1;

export type PayoutMethodType = "bank" | "bkash" | "nagad";
export type PayoutRequestStatus = "pending" | "processing" | "completed" | "rejected";

export type PayoutMethod = {
  id: string;
  methodType: PayoutMethodType;
  label: string;
  accountDetail: string;
  isVerified: boolean;
};

export async function fetchPayoutMethods(vendorId: string): Promise<PayoutMethod[]> {
  const { data, error } = await supabase
    .from("vendor_payout_methods")
    .select("id, method_type, label, account_detail, is_verified")
    .eq("vendor_id", vendorId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    methodType: row.method_type,
    label: row.label,
    accountDetail: row.account_detail,
    isVerified: row.is_verified,
  }));
}

export async function addPayoutMethod(
  vendorId: string,
  input: { methodType: PayoutMethodType; label: string; accountDetail: string }
): Promise<void> {
  const { error } = await supabase.from("vendor_payout_methods").insert({
    vendor_id: vendorId,
    method_type: input.methodType,
    label: input.label,
    account_detail: input.accountDetail,
  });
  if (error) throw new Error(error.message);
}

export async function deletePayoutMethod(methodId: string): Promise<void> {
  const { error } = await supabase.from("vendor_payout_methods").delete().eq("id", methodId);
  if (error) throw new Error(error.message);
}

export type PayoutBalances = {
  availableForPayout: number;
  pendingClearance: number;
  lifetimeEarnings: number;
};

export async function fetchPayoutBalances(vendorId: string): Promise<PayoutBalances> {
  const [itemsRes, requestsRes] = await Promise.all([
    supabase.from("order_items").select("line_total, item_status").eq("vendor_id", vendorId),
    supabase.from("payout_requests").select("amount, status").eq("vendor_id", vendorId),
  ]);

  const items = itemsRes.data ?? [];
  const requests = requestsRes.data ?? [];

  let clearedEarnings = 0;
  let pendingClearance = 0;
  let lifetimeEarnings = 0;
  for (const row of items) {
    const net = Number(row.line_total) * (1 - PLATFORM_COMMISSION_RATE);
    if (row.item_status === "cancelled" || row.item_status === "returned") continue;
    lifetimeEarnings += net;
    if (row.item_status === "delivered") clearedEarnings += net;
    else pendingClearance += net;
  }

  const withdrawn = requests
    .filter((r) => r.status === "pending" || r.status === "processing" || r.status === "completed")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return {
    availableForPayout: Math.max(0, clearedEarnings - withdrawn),
    pendingClearance,
    lifetimeEarnings,
  };
}

export type TransactionEntry = {
  id: string;
  date: string;
  type: "Sale" | "Payout" | "Refund";
  amount: number;
  status: "Completed" | "Processing" | "Refunded" | "Pending" | "Rejected";
};

export async function fetchTransactions(vendorId: string): Promise<TransactionEntry[]> {
  const [itemsRes, requestsRes] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, line_total, item_status, created_at, orders ( order_number )")
      .eq("vendor_id", vendorId),
    supabase.from("payout_requests").select("id, amount, status, requested_at").eq("vendor_id", vendorId),
  ]);

  const entries: TransactionEntry[] = [];

  type RawItem = {
    id: string;
    line_total: number;
    item_status: string;
    created_at: string;
    orders: { order_number: string } | null;
  };
  for (const row of (itemsRes.data ?? []) as unknown as RawItem[]) {
    const net = Number(row.line_total) * (1 - PLATFORM_COMMISSION_RATE);
    const isRefund = row.item_status === "cancelled" || row.item_status === "returned";
    entries.push({
      id: row.orders?.order_number ?? row.id,
      date: row.created_at,
      type: isRefund ? "Refund" : "Sale",
      amount: isRefund ? -net : net,
      status: isRefund ? "Refunded" : row.item_status === "delivered" ? "Completed" : "Processing",
    });
  }

  for (const row of requestsRes.data ?? []) {
    entries.push({
      id: row.id,
      date: row.requested_at,
      type: "Payout",
      amount: -Number(row.amount),
      status:
        row.status === "completed"
          ? "Completed"
          : row.status === "rejected"
            ? "Rejected"
            : row.status === "processing"
              ? "Processing"
              : "Pending",
    });
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createPayoutRequest(vendorId: string, methodId: string, amount: number): Promise<void> {
  const { error } = await supabase
    .from("payout_requests")
    .insert({ vendor_id: vendorId, payout_method_id: methodId, amount, status: "pending" });
  if (error) throw new Error(error.message);
}

export function transactionsToCsv(rows: TransactionEntry[]): string {
  const header = ["ID", "Date", "Type", "Amount", "Status"];
  const lines = rows.map((row) =>
    [row.id, new Date(row.date).toISOString(), row.type, row.amount.toFixed(2), row.status]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

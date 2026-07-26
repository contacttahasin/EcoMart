import { supabase } from "@/lib/supabase";

export type RevenueGranularity = "daily" | "monthly";

export type RevenuePoint = {
  label: string;
  revenue: number;
  orders: number;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Monday-start ISO weekday index (0 = Monday .. 6 = Sunday). */
function isoWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Real per-vendor revenue series for the dashboard chart, computed from
 * order_items — "daily" buckets the last 7 days (Mon-Sun of the current
 * week), "monthly" buckets the last 6 calendar months.
 */
export async function fetchVendorRevenueSeries(
  vendorId: string,
  granularity: RevenueGranularity
): Promise<RevenuePoint[]> {
  const now = new Date();
  const from =
    granularity === "daily"
      ? (() => {
          const monday = startOfDay(now);
          monday.setDate(monday.getDate() - isoWeekdayIndex(now));
          return monday;
        })()
      : new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const { data, error } = await supabase
    .from("order_items")
    .select("line_total, created_at")
    .eq("vendor_id", vendorId)
    .gte("created_at", from.toISOString());

  const rows = error ? [] : data ?? [];

  if (granularity === "daily") {
    const buckets = WEEKDAY_LABELS.map((label) => ({ label, revenue: 0, orders: 0 }));
    for (const row of rows) {
      const index = isoWeekdayIndex(new Date(row.created_at));
      buckets[index].revenue += Number(row.line_total);
      buckets[index].orders += 1;
    }
    return buckets;
  }

  const buckets: RevenuePoint[] = [];
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    buckets.push({ label: MONTH_LABELS[d.getMonth()], revenue: 0, orders: 0 });
  }
  for (const row of rows) {
    const rowDate = new Date(row.created_at);
    const monthsFromStart =
      (rowDate.getFullYear() - from.getFullYear()) * 12 + (rowDate.getMonth() - from.getMonth());
    if (monthsFromStart >= 0 && monthsFromStart < buckets.length) {
      buckets[monthsFromStart].revenue += Number(row.line_total);
      buckets[monthsFromStart].orders += 1;
    }
  }
  return buckets;
}

export type DashboardSummary = {
  totalSalesAllTime: number;
  totalOrdersAllTime: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  ordersThisMonth: number;
  ordersLastMonth: number;
  lowStockCount: number;
  lowStockNames: string[];
  activeBoostedCount: number;
};

export function percentDelta(current: number, previous: number): { pct: number; trend: "up" | "down" } {
  if (previous === 0) return { pct: current > 0 ? 100 : 0, trend: current >= 0 ? "up" : "down" };
  const pct = ((current - previous) / previous) * 100;
  return { pct: Math.abs(pct), trend: pct >= 0 ? "up" : "down" };
}

export async function fetchVendorDashboardSummary(vendorId: string): Promise<DashboardSummary> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [itemsRes, productsRes] = await Promise.all([
    supabase.from("order_items").select("line_total, created_at").eq("vendor_id", vendorId),
    supabase.from("products").select("title, stock, low_stock_threshold").eq("vendor_id", vendorId),
  ]);

  const items = itemsRes.data ?? [];
  let totalSalesAllTime = 0;
  let revenueThisMonth = 0;
  let revenueLastMonth = 0;
  let ordersThisMonth = 0;
  let ordersLastMonth = 0;
  for (const row of items) {
    const amount = Number(row.line_total);
    totalSalesAllTime += amount;
    const created = new Date(row.created_at);
    if (created >= startOfThisMonth) {
      revenueThisMonth += amount;
      ordersThisMonth += 1;
    } else if (created >= startOfLastMonth && created < startOfThisMonth) {
      revenueLastMonth += amount;
      ordersLastMonth += 1;
    }
  }

  const products = productsRes.data ?? [];
  const lowStockProducts = products.filter((p) => p.stock < p.low_stock_threshold);

  return {
    totalSalesAllTime,
    totalOrdersAllTime: items.length,
    revenueThisMonth,
    revenueLastMonth,
    ordersThisMonth,
    ordersLastMonth,
    lowStockCount: lowStockProducts.length,
    lowStockNames: lowStockProducts.slice(0, 2).map((p) => p.title),
    activeBoostedCount: 0,
  };
}

export type DashboardRecentOrder = {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: string;
};

export async function fetchRecentOrders(vendorId: string, limit = 5): Promise<DashboardRecentOrder[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("id, line_total, item_status, created_at, orders ( order_number, profiles ( full_name ) )")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  type Row = {
    id: string;
    line_total: number;
    item_status: string;
    created_at: string;
    orders: { order_number: string; profiles: { full_name: string } | null } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.orders?.order_number ?? row.id,
    customer: row.orders?.profiles?.full_name ?? "Customer",
    date: row.created_at,
    total: Number(row.line_total),
    status: row.item_status,
  }));
}

export type TopProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  unitsSold: number;
  revenue: number;
};

export async function fetchTopProducts(vendorId: string, limit = 3): Promise<TopProduct[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, product_title_snapshot, product_image_snapshot, quantity, line_total")
    .eq("vendor_id", vendorId);
  if (error) throw new Error(error.message);

  const byProduct = new Map<string, TopProduct>();
  for (const row of data ?? []) {
    const key = row.product_id ?? row.product_title_snapshot;
    const existing = byProduct.get(key);
    if (existing) {
      existing.unitsSold += row.quantity;
      existing.revenue += Number(row.line_total);
    } else {
      byProduct.set(key, {
        id: key,
        name: row.product_title_snapshot,
        imageUrl: row.product_image_snapshot,
        unitsSold: row.quantity,
        revenue: Number(row.line_total),
      });
    }
  }

  return [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

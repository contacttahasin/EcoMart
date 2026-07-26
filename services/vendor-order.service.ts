import { supabase } from "@/lib/supabase";

export type ItemStatus = "processing" | "shipped" | "delivered" | "cancelled" | "returned";
export type PaymentMethod = "card" | "bkash" | "nagad";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type ShippingAddress = {
  full_name?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
} | null;

export type VendorOrderRow = {
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  customerAvatarUrl: string | null;
  placedAt: string;
  productTitle: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  itemStatus: ItemStatus;
  trackingNumber: string | null;
  shippingAddress: ShippingAddress;
};

type RawOrderItemRow = {
  id: string;
  order_id: string;
  product_title_snapshot: string;
  product_image_snapshot: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  item_status: ItemStatus;
  tracking_number: string | null;
  orders: {
    order_number: string;
    placed_at: string;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    shipping_address: ShippingAddress;
    customer_id: string;
    profiles: { full_name: string; phone: string | null; avatar_url: string | null } | null;
  } | null;
};

export async function fetchVendorOrders(vendorId: string): Promise<VendorOrderRow[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select(
      `id, order_id, product_title_snapshot, product_image_snapshot, quantity, unit_price, line_total, item_status, tracking_number,
       orders ( order_number, placed_at, payment_method, payment_status, shipping_address, customer_id, profiles ( full_name, phone, avatar_url ) )`
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as RawOrderItemRow[])
    .filter((row) => row.orders !== null)
    .map((row) => ({
      orderItemId: row.id,
      orderId: row.order_id,
      orderNumber: row.orders!.order_number,
      customerName: row.orders!.profiles?.full_name ?? "Customer",
      customerPhone: row.orders!.profiles?.phone || null,
      customerAvatarUrl: row.orders!.profiles?.avatar_url ?? null,
      placedAt: row.orders!.placed_at,
      productTitle: row.product_title_snapshot,
      productImage: row.product_image_snapshot,
      quantity: row.quantity,
      unitPrice: Number(row.unit_price),
      lineTotal: Number(row.line_total),
      paymentMethod: row.orders!.payment_method,
      paymentStatus: row.orders!.payment_status,
      itemStatus: row.item_status,
      trackingNumber: row.tracking_number,
      shippingAddress: row.orders!.shipping_address,
    }));
}

export type TimelineEvent = { status: string; note: string | null; createdAt: string };

export async function fetchOrderTimeline(orderItemId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from("order_status_history")
    .select("status, note, created_at")
    .eq("order_item_id", orderItemId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ status: row.status, note: row.note, createdAt: row.created_at }));
}

export async function updateOrderItemStatus(
  orderItemId: string,
  orderId: string,
  newStatus: ItemStatus,
  vendorId: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from("order_items")
    .update({ item_status: newStatus })
    .eq("id", orderItemId);
  if (updateError) throw new Error(updateError.message);

  const { error: historyError } = await supabase.from("order_status_history").insert({
    order_id: orderId,
    order_item_id: orderItemId,
    status: newStatus,
    changed_by: vendorId,
  });
  if (historyError) throw new Error(historyError.message);
}

export async function addTrackingNumber(orderItemId: string, trackingNumber: string): Promise<void> {
  const { error } = await supabase
    .from("order_items")
    .update({ tracking_number: trackingNumber })
    .eq("id", orderItemId);
  if (error) throw new Error(error.message);
}

export async function createManualOrder(input: {
  customerEmail: string;
  productId: string;
  quantity: number;
  shippingName: string;
  shippingPhone: string;
  shippingStreet: string;
  shippingCity: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("vendor_create_manual_order", {
    p_customer_email: input.customerEmail,
    p_product_id: input.productId,
    p_quantity: input.quantity,
    p_shipping_name: input.shippingName,
    p_shipping_phone: input.shippingPhone,
    p_shipping_street: input.shippingStreet,
    p_shipping_city: input.shippingCity,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export type VendorProductOption = { id: string; title: string; price: number; salePrice: number | null };

export async function fetchVendorActiveProducts(vendorId: string): Promise<VendorProductOption[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, price, sale_price")
    .eq("vendor_id", vendorId)
    .eq("status", "active")
    .order("title");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    price: Number(row.price),
    salePrice: row.sale_price !== null ? Number(row.sale_price) : null,
  }));
}

export function ordersToCsv(rows: VendorOrderRow[]): string {
  const header = ["Order ID", "Customer", "Date", "Product", "Qty", "Amount", "Payment", "Status"];
  const lines = rows.map((row) =>
    [
      row.orderNumber,
      row.customerName,
      new Date(row.placedAt).toISOString(),
      row.productTitle,
      String(row.quantity),
      row.lineTotal.toFixed(2),
      row.paymentMethod,
      row.itemStatus,
    ]
      .map((value) => `"${value.replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

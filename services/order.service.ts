import { CheckCircle2, PackageSearch, RefreshCw, RotateCcw, Truck, XCircle } from "lucide-react";
import type { CartItem } from "@/app/context/CartContext";
import { getEffectivePrice } from "@/services/product.service";
import { supabase } from "@/lib/supabase";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "return_requested"
  | "returned";

export const STATUS_BADGE: Record<OrderStatus, { label: string; className: string; icon: typeof Truck }> = {
  pending: { label: "Pending", className: "bg-surface-container-highest text-on-surface-variant", icon: PackageSearch },
  processing: { label: "Processing", className: "bg-primary-container/15 text-primary", icon: RefreshCw },
  shipped: { label: "In Transit", className: "bg-secondary-container text-on-secondary-container", icon: Truck },
  delivered: {
    label: "Delivered",
    className: "bg-surface-container-highest text-on-surface-variant",
    icon: CheckCircle2,
  },
  cancelled: { label: "Cancelled", className: "bg-error-container text-on-error-container", icon: XCircle },
  refunded: { label: "Refunded", className: "bg-error-container text-on-error-container", icon: RotateCcw },
  return_requested: {
    label: "Return Requested",
    className: "bg-secondary-container text-on-secondary-container",
    icon: RotateCcw,
  },
  returned: { label: "Returned", className: "bg-surface-container-highest text-on-surface-variant", icon: RotateCcw },
};

export function formatOrderDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/** Kept in one place so the total shown at checkout always matches the total stored on the order. */
export const TAX_RATE = 0.08;

export type ShippingInfo = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

export type DeliveryMethodOption = "standard" | "eco";
export type PaymentMethodOption = "card" | "bkash" | "nagad";

export type RealOrderItem = {
  id: string;
  productId: string | null;
  title: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
};

export type RealOrder = {
  id: string;
  orderNumber: string;
  placedAt: string;
  status: OrderStatus;
  totalAmount: number;
  items: RealOrderItem[];
};

export type OrderStatusEvent = { id: string; status: string; note: string | null; createdAt: string };

export type PlaceOrderResult = { success: true; orderNumber: string } | { success: false; error: string };

export async function placeOrder(
  customerId: string,
  items: CartItem[],
  shipping: ShippingInfo,
  delivery: DeliveryMethodOption,
  paymentMethod: PaymentMethodOption,
  shippingFee: number
): Promise<PlaceOrderResult> {
  if (items.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  const subtotal = items.reduce((sum, item) => sum + getEffectivePrice(item.product) * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const totalAmount = subtotal + shippingFee + tax;
  const orderNumber = `ES-${Date.now().toString(36).toUpperCase()}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      status: "processing",
      subtotal,
      shipping_fee: shippingFee,
      tax_amount: tax,
      total_amount: totalAmount,
      shipping_address: shipping,
      billing_address: shipping,
      delivery_method: delivery,
      payment_method: paymentMethod,
      payment_status: "paid",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, error: orderError?.message ?? "Could not place your order." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      vendor_id: item.product.vendorId,
      product_id: item.product.id,
      product_title_snapshot: item.product.title,
      product_image_snapshot: item.product.images[0] ?? null,
      unit_price: getEffectivePrice(item.product),
      quantity: item.quantity,
      line_total: getEffectivePrice(item.product) * item.quantity,
      item_status: "processing",
    }))
  );

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  await supabase.from("order_status_history").insert({ order_id: order.id, status: "processing", note: "Order placed" });

  return { success: true, orderNumber };
}

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  placed_at: string;
  order_items: {
    id: string;
    product_id: string | null;
    product_title_snapshot: string;
    product_image_snapshot: string | null;
    quantity: number;
    unit_price: number;
  }[];
};

export async function fetchCustomerOrders(customerId: string): Promise<RealOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total_amount, placed_at, order_items(id, product_id, product_title_snapshot, product_image_snapshot, quantity, unit_price)"
    )
    .eq("customer_id", customerId)
    .order("placed_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as OrderRow[]).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    placedAt: row.placed_at,
    status: row.status,
    totalAmount: row.total_amount,
    items: row.order_items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      title: item.product_title_snapshot,
      image: item.product_image_snapshot,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
  }));
}

export async function fetchOrderStatusHistory(orderId: string): Promise<OrderStatusEvent[]> {
  const { data } = await supabase
    .from("order_status_history")
    .select("id, status, note, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({ id: row.id, status: row.status, note: row.note, createdAt: row.created_at }));
}

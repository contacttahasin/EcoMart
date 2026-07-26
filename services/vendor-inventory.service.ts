import { supabase } from "@/lib/supabase";

export type InventoryRow = {
  id: string;
  title: string;
  sku: string | null;
  category: string;
  stock: number;
  threshold: number;
  imageUrl: string | null;
};

type RawProductRow = {
  id: string;
  title: string;
  sku: string | null;
  stock: number;
  low_stock_threshold: number;
  categories: { name: string } | null;
  product_images: { url: string }[];
};

export async function fetchVendorInventory(vendorId: string): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, title, sku, stock, low_stock_threshold,
       categories!products_category_id_fkey ( name ),
       product_images ( url )`
    )
    .eq("vendor_id", vendorId)
    .order("title");
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as RawProductRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    sku: row.sku,
    category: row.categories?.name ?? "Uncategorized",
    stock: row.stock,
    threshold: row.low_stock_threshold,
    imageUrl: row.product_images?.[0]?.url ?? null,
  }));
}

export async function updateProductThreshold(productId: string, threshold: number): Promise<void> {
  const { error } = await supabase.from("products").update({ low_stock_threshold: threshold }).eq("id", productId);
  if (error) throw new Error(error.message);
}

export async function bulkApplyThreshold(vendorId: string, threshold: number): Promise<void> {
  const { error } = await supabase.from("products").update({ low_stock_threshold: threshold }).eq("vendor_id", vendorId);
  if (error) throw new Error(error.message);
}

export type StockAction = "add" | "subtract" | "reset";

export async function adjustProductStock(
  productId: string,
  vendorId: string,
  currentStock: number,
  action: StockAction,
  quantity: number,
  reason: string,
  updatedBy: string
): Promise<number> {
  const newStock =
    action === "add" ? currentStock + quantity : action === "subtract" ? Math.max(0, currentStock - quantity) : quantity;

  const { error: updateError } = await supabase.from("products").update({ stock: newStock }).eq("id", productId);
  if (updateError) throw new Error(updateError.message);

  const change = action === "reset" ? newStock - currentStock : action === "add" ? quantity : -quantity;
  const { error: logError } = await supabase
    .from("stock_movements")
    .insert({ product_id: productId, vendor_id: vendorId, change, reason, updated_by: updatedBy });
  if (logError) throw new Error(logError.message);

  return newStock;
}

export async function batchAdjustStock(action: StockAction, quantity: number, updatedBy: string): Promise<number> {
  const { data, error } = await supabase.rpc("vendor_batch_adjust_stock", {
    p_action: action,
    p_quantity: quantity,
    p_updated_by: updatedBy,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

export type CsvAdjustRow = { sku: string; change: number; reason?: string };
export type CsvAdjustResult = { applied: number; skipped: string[] };

export async function applyCsvStockAdjustments(
  vendorId: string,
  rows: CsvAdjustRow[],
  updatedBy: string
): Promise<CsvAdjustResult> {
  const skipped: string[] = [];
  let applied = 0;
  for (const row of rows) {
    const { data: product } = await supabase
      .from("products")
      .select("id, stock")
      .eq("vendor_id", vendorId)
      .eq("sku", row.sku)
      .maybeSingle();
    if (!product) {
      skipped.push(row.sku);
      continue;
    }
    const newStock = Math.max(0, product.stock + row.change);
    await supabase.from("products").update({ stock: newStock }).eq("id", product.id);
    await supabase.from("stock_movements").insert({
      product_id: product.id,
      vendor_id: vendorId,
      change: row.change,
      reason: row.reason || "CSV Import",
      updated_by: updatedBy,
    });
    applied += 1;
  }
  return { applied, skipped };
}

export function parseStockCsv(text: string): CsvAdjustRow[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const rows: CsvAdjustRow[] = [];
  for (const line of lines) {
    const [sku, changeStr, reason] = line.split(",").map((cell) => cell.trim());
    if (!sku || sku.toLowerCase() === "sku") continue;
    const change = Number(changeStr);
    if (Number.isNaN(change)) continue;
    rows.push({ sku, change, reason });
  }
  return rows;
}

export type StockMovementRow = {
  id: string;
  date: string;
  sku: string;
  change: number;
  reason: string;
  updatedBy: string;
};

type RawMovementRow = {
  id: string;
  change: number;
  reason: string;
  updated_by: string;
  created_at: string;
  products: { sku: string | null } | null;
};

export async function fetchStockMovements(vendorId: string, limit = 20): Promise<StockMovementRow[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("id, change, reason, updated_by, created_at, products ( sku )")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as RawMovementRow[]).map((row) => ({
    id: row.id,
    date: row.created_at,
    sku: row.products?.sku ?? "—",
    change: row.change,
    reason: row.reason,
    updatedBy: row.updated_by,
  }));
}

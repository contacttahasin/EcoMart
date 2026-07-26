import { supabase } from "@/lib/supabase";

export type CampaignType = "featured" | "sponsored" | "flash_deal" | "top_rank";
export type PricingModel = "fixed" | "ppc";
export type CampaignPaymentMethod = "wallet" | "bkash" | "nagad";
export type CampaignStatus = "active" | "paused" | "completed";

export type CampaignRow = {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  campaignType: CampaignType;
  pricingModel: PricingModel;
  budgetAmount: number;
  spent: number;
  status: CampaignStatus;
  durationDays: number | null;
  startsAt: string;
  endsAt: string | null;
};

type RawCampaignRow = {
  id: string;
  product_id: string;
  campaign_type: CampaignType;
  pricing_model: PricingModel;
  budget_amount: number;
  spent: number;
  status: CampaignStatus;
  duration_days: number | null;
  starts_at: string;
  ends_at: string | null;
  products: { title: string; product_images: { url: string }[] } | null;
};

export async function fetchCampaigns(vendorId: string): Promise<CampaignRow[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `id, product_id, campaign_type, pricing_model, budget_amount, spent, status, duration_days, starts_at, ends_at,
       products ( title, product_images ( url ) )`
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as RawCampaignRow[]).map((row) => ({
    id: row.id,
    productId: row.product_id,
    productTitle: row.products?.title ?? "Product",
    productImage: row.products?.product_images?.[0]?.url ?? null,
    campaignType: row.campaign_type,
    pricingModel: row.pricing_model,
    budgetAmount: Number(row.budget_amount),
    spent: Number(row.spent),
    status: row.status,
    durationDays: row.duration_days,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  }));
}

export async function createCampaign(input: {
  vendorId: string;
  productId: string;
  campaignType: CampaignType;
  pricingModel: PricingModel;
  paymentMethod: CampaignPaymentMethod;
  budgetAmount: number;
  durationDays: number | null;
}): Promise<void> {
  const endsAt =
    input.pricingModel === "fixed" && input.durationDays
      ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { error } = await supabase.from("campaigns").insert({
    vendor_id: input.vendorId,
    product_id: input.productId,
    campaign_type: input.campaignType,
    pricing_model: input.pricingModel,
    payment_method: input.paymentMethod,
    budget_amount: input.budgetAmount,
    duration_days: input.durationDays,
    ends_at: endsAt,
    status: "active",
  });
  if (error) throw new Error(error.message);
}

export async function setCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
  const { error } = await supabase.from("campaigns").update({ status }).eq("id", campaignId);
  if (error) throw new Error(error.message);
}

export async function extendCampaign(campaignId: string, additionalDays: number, additionalBudget: number): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from("campaigns")
    .select("budget_amount, ends_at, duration_days")
    .eq("id", campaignId)
    .single();
  if (fetchError || !current) throw new Error(fetchError?.message ?? "Campaign not found.");

  const baseDate = current.ends_at ? new Date(current.ends_at) : new Date();
  const newEndsAt = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("campaigns")
    .update({
      budget_amount: Number(current.budget_amount) + additionalBudget,
      duration_days: (current.duration_days ?? 0) + additionalDays,
      ends_at: newEndsAt,
      status: "active",
    })
    .eq("id", campaignId);
  if (error) throw new Error(error.message);
}

export type PromotionsSummary = {
  activeCampaignsCount: number;
  totalBudget: number;
  totalSpent: number;
  avgUtilizationPct: number;
};

export async function fetchPromotionsSummary(vendorId: string): Promise<PromotionsSummary> {
  const { data } = await supabase.from("campaigns").select("budget_amount, spent, status").eq("vendor_id", vendorId);
  const rows = data ?? [];
  const activeCampaignsCount = rows.filter((r) => r.status === "active").length;
  const totalBudget = rows.reduce((sum, r) => sum + Number(r.budget_amount), 0);
  const totalSpent = rows.reduce((sum, r) => sum + Number(r.spent), 0);
  const avgUtilizationPct = totalBudget === 0 ? 0 : Math.round((totalSpent / totalBudget) * 100);
  return { activeCampaignsCount, totalBudget, totalSpent, avgUtilizationPct };
}

export type EligibleProduct = {
  id: string;
  title: string;
  imageUrl: string | null;
  stock: number;
  price: number;
  highPotential: boolean;
};

export async function fetchEligibleProducts(vendorId: string): Promise<EligibleProduct[]> {
  const [productsRes, activeCampaignsRes, orderItemsRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, title, stock, price, sale_price, product_images ( url )")
      .eq("vendor_id", vendorId)
      .eq("status", "active"),
    supabase.from("campaigns").select("product_id").eq("vendor_id", vendorId).eq("status", "active"),
    supabase.from("order_items").select("product_id, line_total").eq("vendor_id", vendorId),
  ]);

  const boostedIds = new Set((activeCampaignsRes.data ?? []).map((c) => c.product_id));
  const revenueByProduct = new Map<string, number>();
  for (const row of orderItemsRes.data ?? []) {
    if (!row.product_id) continue;
    revenueByProduct.set(row.product_id, (revenueByProduct.get(row.product_id) ?? 0) + Number(row.line_total));
  }
  const topRevenueProductId = [...revenueByProduct.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  type RawProduct = {
    id: string;
    title: string;
    stock: number;
    price: number;
    sale_price: number | null;
    product_images: { url: string }[];
  };

  return ((productsRes.data ?? []) as unknown as RawProduct[])
    .filter((p) => !boostedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      title: p.title,
      imageUrl: p.product_images?.[0]?.url ?? null,
      stock: p.stock,
      price: p.sale_price ?? p.price,
      highPotential: p.id === topRevenueProductId,
    }));
}

export function campaignsToCsv(rows: CampaignRow[]): string {
  const header = ["Campaign", "Product", "Type", "Budget", "Spent", "Status"];
  const lines = rows.map((row) =>
    [row.id, row.productTitle, row.campaignType, row.budgetAmount.toFixed(2), row.spent.toFixed(2), row.status]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

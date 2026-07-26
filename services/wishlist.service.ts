import { supabase } from "@/lib/supabase";

export async function fetchWishlistProductIds(userId: string): Promise<string[]> {
  const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", userId);
  return (data ?? []).map((row) => row.product_id);
}

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  await supabase.from("wishlists").upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" });
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId);
}

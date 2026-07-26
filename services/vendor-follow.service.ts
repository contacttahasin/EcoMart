import { supabase } from "@/lib/supabase";

export async function isFollowingVendor(customerId: string, vendorId: string): Promise<boolean> {
  const { data } = await supabase
    .from("vendor_follows")
    .select("id")
    .eq("customer_id", customerId)
    .eq("vendor_id", vendorId)
    .maybeSingle();
  return Boolean(data);
}

export async function followVendor(customerId: string, vendorId: string): Promise<void> {
  await supabase
    .from("vendor_follows")
    .upsert({ customer_id: customerId, vendor_id: vendorId }, { onConflict: "customer_id,vendor_id" });
}

export async function unfollowVendor(customerId: string, vendorId: string): Promise<void> {
  await supabase.from("vendor_follows").delete().eq("customer_id", customerId).eq("vendor_id", vendorId);
}

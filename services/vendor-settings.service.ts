import { supabase } from "@/lib/supabase";

export type VendorKyc = {
  tradeLicenseNumber: string;
  tin: string;
  verificationStatus: "pending" | "approved" | "rejected" | null;
};

export async function fetchVendorKyc(vendorId: string): Promise<VendorKyc | null> {
  const { data } = await supabase
    .from("vendor_profiles")
    .select("trade_license_number, tin, verification_status")
    .eq("id", vendorId)
    .single();
  if (!data) return null;
  return {
    tradeLicenseNumber: data.trade_license_number ?? "",
    tin: data.tin ?? "",
    verificationStatus: data.verification_status,
  };
}

export async function updateVendorKycNumbers(
  vendorId: string,
  updates: { tradeLicenseNumber?: string; tin?: string }
): Promise<void> {
  const payload: Record<string, string> = {};
  if (updates.tradeLicenseNumber !== undefined) payload.trade_license_number = updates.tradeLicenseNumber;
  if (updates.tin !== undefined) payload.tin = updates.tin;
  await supabase.from("vendor_profiles").update(payload).eq("id", vendorId);
}

export type VendorDocumentType = "trade_license" | "id_front" | "id_back" | "business_registration" | "payout_verification" | "selfie";

export type VendorDocument = {
  docType: VendorDocumentType;
  filePath: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
};

export async function fetchVendorDocuments(vendorId: string): Promise<VendorDocument[]> {
  const { data, error } = await supabase
    .from("vendor_documents")
    .select("doc_type, file_path, status, uploaded_at")
    .eq("vendor_id", vendorId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    docType: row.doc_type,
    filePath: row.file_path,
    status: row.status,
    uploadedAt: row.uploaded_at,
  }));
}

export async function uploadVendorDocument(vendorId: string, file: File, docType: VendorDocumentType): Promise<void> {
  const extension = file.name.split(".").pop() ?? "pdf";
  const path = `${vendorId}/${docType}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("vendor-documents").upload(path, file);
  if (uploadError) throw new Error(uploadError.message);

  await supabase.from("vendor_documents").delete().eq("vendor_id", vendorId).eq("doc_type", docType);
  const { error } = await supabase
    .from("vendor_documents")
    .insert({ vendor_id: vendorId, doc_type: docType, file_path: path, status: "pending" });
  if (error) throw new Error(error.message);
}

export type VendorPolicies = { returnPolicy: string; refundPolicy: string };

export async function fetchVendorPolicies(vendorId: string): Promise<VendorPolicies> {
  const { data } = await supabase
    .from("vendor_profiles")
    .select("return_policy, refund_policy")
    .eq("id", vendorId)
    .single();
  return {
    returnPolicy: data?.return_policy ?? "",
    refundPolicy: data?.refund_policy ?? "",
  };
}

export async function updateVendorPolicies(vendorId: string, policies: VendorPolicies): Promise<void> {
  await supabase
    .from("vendor_profiles")
    .update({ return_policy: policies.returnPolicy, refund_policy: policies.refundPolicy })
    .eq("id", vendorId);
}

export type ShippingRate = { id: string; label: string; hint: string; price: number };

export type ShippingSettings = {
  rates: ShippingRate[];
  freeShippingEnabled: boolean;
  freeShippingThreshold: number | null;
};

export async function fetchShippingSettings(vendorId: string): Promise<ShippingSettings> {
  const { data } = await supabase
    .from("vendor_profiles")
    .select("shipping_rates, free_shipping_enabled, free_shipping_threshold")
    .eq("id", vendorId)
    .single();
  return {
    rates: (data?.shipping_rates as ShippingRate[]) ?? [],
    freeShippingEnabled: data?.free_shipping_enabled ?? false,
    freeShippingThreshold: data?.free_shipping_threshold !== null && data?.free_shipping_threshold !== undefined ? Number(data.free_shipping_threshold) : null,
  };
}

export async function updateShippingSettings(vendorId: string, settings: ShippingSettings): Promise<void> {
  await supabase
    .from("vendor_profiles")
    .update({
      shipping_rates: settings.rates,
      free_shipping_enabled: settings.freeShippingEnabled,
      free_shipping_threshold: settings.freeShippingThreshold,
    })
    .eq("id", vendorId);
}

import { supabase } from "@/lib/supabase";
import type { AddressLabel, CustomerAddress } from "@/data/customers";

type AddressRow = {
  id: string;
  label: "home" | "office" | "other";
  full_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
};

const ADDRESS_COLUMNS = "id, label, full_name, phone, street, city, state, zip_code, is_default";

function toLabel(label: AddressRow["label"]): AddressLabel {
  if (label === "home") return "Home";
  if (label === "office") return "Office";
  return "Other";
}

function toDbLabel(label: AddressLabel): AddressRow["label"] {
  return label.toLowerCase() as AddressRow["label"];
}

function toCustomerAddress(row: AddressRow): CustomerAddress {
  return {
    id: row.id,
    label: toLabel(row.label),
    fullName: row.full_name,
    phone: row.phone,
    street: row.street,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    isDefault: row.is_default,
  };
}

export async function fetchAddresses(userId: string): Promise<CustomerAddress[]> {
  const { data } = await supabase
    .from("addresses")
    .select(ADDRESS_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return (data ?? []).map(toCustomerAddress);
}

export type AddressInput = Omit<CustomerAddress, "id">;

/** Respects the DB's `addresses_one_default_per_user` partial unique index. */
async function clearOtherDefaults(userId: string, exceptId?: string) {
  const query = supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  await (exceptId ? query.neq("id", exceptId) : query);
}

export async function addAddress(userId: string, input: AddressInput): Promise<CustomerAddress> {
  if (input.isDefault) await clearOtherDefaults(userId);

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: userId,
      label: toDbLabel(input.label),
      full_name: input.fullName,
      phone: input.phone,
      street: input.street,
      city: input.city,
      state: input.state,
      zip_code: input.zipCode,
      is_default: input.isDefault,
    })
    .select(ADDRESS_COLUMNS)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not save address.");
  return toCustomerAddress(data);
}

export async function updateAddress(userId: string, id: string, input: AddressInput): Promise<CustomerAddress> {
  if (input.isDefault) await clearOtherDefaults(userId, id);

  const { data, error } = await supabase
    .from("addresses")
    .update({
      label: toDbLabel(input.label),
      full_name: input.fullName,
      phone: input.phone,
      street: input.street,
      city: input.city,
      state: input.state,
      zip_code: input.zipCode,
      is_default: input.isDefault,
    })
    .eq("id", id)
    .select(ADDRESS_COLUMNS)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not update address.");
  return toCustomerAddress(data);
}

/** Mirrors the address book's old client-only behavior: if the deleted
 * address was the default, promote the oldest remaining one. */
export async function deleteAddress(userId: string, id: string): Promise<void> {
  const { data: target } = await supabase.from("addresses").select("is_default").eq("id", id).single();

  await supabase.from("addresses").delete().eq("id", id);

  if (!target?.is_default) return;

  const { data: remaining } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (remaining && remaining.length > 0) {
    await supabase.from("addresses").update({ is_default: true }).eq("id", remaining[0].id);
  }
}

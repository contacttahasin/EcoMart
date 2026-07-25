"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { vendors as vendorSeed, type Vendor } from "@/data/vendors";
import type { VendorBusinessInfo, VendorPersonalInfo } from "@/app/types/vendor";
import { buildVendorFromRegistration } from "@/services/vendor.service";

type VendorContextValue = {
  vendors: Vendor[];
  addVendor: (data: { personal: VendorPersonalInfo; business: VendorBusinessInfo }) => Vendor;
};

const VendorContext = createContext<VendorContextValue | null>(null);

export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>(vendorSeed);

  const addVendor = useCallback((data: { personal: VendorPersonalInfo; business: VendorBusinessInfo }) => {
    let created!: Vendor;
    setVendors((prev) => {
      created = buildVendorFromRegistration(data, prev.map((vendor) => vendor.slug));
      return [...prev, created];
    });
    return created;
  }, []);

  const value = useMemo(() => ({ vendors, addVendor }), [vendors, addVendor]);

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export function useVendors() {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error("useVendors must be used within a VendorProvider");
  }
  return context;
}

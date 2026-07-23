"use client";

import Navbar from "@/app/components/Navbar";
import { AccountBottomNav } from "@/app/components/account/AccountBottomNav";
import { AccountSidebar } from "@/app/components/account/AccountSidebar";
import { AddressesPageClient } from "@/app/components/account/AddressesPageClient";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

export default function AddressesPage() {
  const { user: customer, isLoading } = useAuthGuard();

  if (isLoading || !customer) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
        <AccountSidebar customer={customer} />

        <main className="w-full py-12 pb-24 md:ml-64 md:pb-12">
          <AddressesPageClient initialAddresses={customer.addresses} />
        </main>
      </div>

      <AccountBottomNav />
    </div>
  );
}

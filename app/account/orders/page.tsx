"use client";

import Navbar from "@/app/components/Navbar";
import { AccountBottomNav } from "@/app/components/account/AccountBottomNav";
import { AccountSidebar } from "@/app/components/account/AccountSidebar";
import { OrdersPageClient } from "@/app/components/account/OrdersPageClient";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { orders } from "@/data/orders";

export default function OrdersPage() {
  const { user: customer, isLoading } = useAuthGuard();

  if (isLoading || !customer) return null;

  const customerOrders = orders
    .filter((order) => order.customerId === customer.id)
    .sort((a, b) => new Date(b.placedOn).getTime() - new Date(a.placedOn).getTime());

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
        <AccountSidebar customer={customer} />

        <main className="w-full py-12 pb-24 md:ml-64 md:pb-12">
          <div className="mx-auto max-w-4xl">
            <OrdersPageClient orders={customerOrders} />
          </div>
        </main>
      </div>

      <AccountBottomNav />
    </div>
  );
}

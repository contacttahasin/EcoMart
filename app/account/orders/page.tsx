"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import { AccountBottomNav } from "@/app/components/account/AccountBottomNav";
import { AccountSidebar } from "@/app/components/account/AccountSidebar";
import { OrdersPageClient } from "@/app/components/account/OrdersPageClient";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { fetchCustomerOrders, type RealOrder } from "@/services/order.service";

export default function OrdersPage() {
  const { user: customer, isLoading } = useAuthGuard();
  const [orders, setOrders] = useState<RealOrder[]>([]);

  useEffect(() => {
    if (!customer) return;
    fetchCustomerOrders(customer.id).then(setOrders);
  }, [customer]);

  if (isLoading || !customer) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
        <AccountSidebar customer={customer} />

        <main className="w-full py-12 pb-24 md:ml-64 md:pb-12">
          <div className="mx-auto max-w-4xl">
            <OrdersPageClient orders={orders} />
          </div>
        </main>
      </div>

      <AccountBottomNav />
    </div>
  );
}

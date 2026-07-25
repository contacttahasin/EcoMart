"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  History,
  Info,
  Landmark,
  Menu,
  MoreVertical,
  Plus,
  Search,
  ShoppingCart,
  Smartphone,
  Star,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";

const summaryCards = [
  {
    label: "Available for Payout",
    value: "৳42,300",
    icon: Wallet,
    valueColor: "text-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    dotBg: "bg-primary/5",
    note: "Ready to withdraw",
    noteIcon: CheckCircle2,
    noteColor: "text-primary",
  },
  {
    label: "Pending Clearance",
    value: "৳8,500",
    icon: Clock,
    valueColor: "text-foreground",
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    dotBg: "bg-secondary/5",
    note: "Clears in 3-5 business days",
    noteIcon: Info,
    noteColor: "text-outline",
  },
  {
    label: "Lifetime Earnings",
    value: "৳2,45,000",
    icon: TrendingUp,
    valueColor: "text-foreground",
    iconBg: "bg-tertiary-container/20",
    iconColor: "text-tertiary",
    dotBg: "bg-tertiary-container/10",
    note: "Top 5% of Vendors",
    noteIcon: Star,
    noteColor: "text-on-secondary-container",
  },
];

type TxType = "Sale" | "Payout" | "Refund";
type TxStatus = "Completed" | "Processing" | "Refunded";

type Transaction = {
  id: string;
  date: string;
  type: TxType;
  amount: string;
  status: TxStatus;
};

const transactions: Transaction[] = [
  { id: "#TRX-98210", date: "Oct 24, 2024", type: "Sale", amount: "+৳12,450", status: "Completed" },
  { id: "#TRX-98205", date: "Oct 22, 2024", type: "Payout", amount: "-৳25,000", status: "Processing" },
  { id: "#TRX-98192", date: "Oct 20, 2024", type: "Sale", amount: "+৳4,200", status: "Completed" },
  { id: "#TRX-98188", date: "Oct 18, 2024", type: "Refund", amount: "-৳1,150", status: "Refunded" },
  { id: "#TRX-98170", date: "Oct 15, 2024", type: "Sale", amount: "+৳18,900", status: "Completed" },
];

const typeStyles: Record<TxType, { icon: typeof ShoppingCart; color: string }> = {
  Sale: { icon: ShoppingCart, color: "text-primary" },
  Payout: { icon: Landmark, color: "text-tertiary" },
  Refund: { icon: History, color: "text-error" },
};

const statusStyles: Record<TxStatus, string> = {
  Completed: "bg-secondary-container text-on-secondary-container",
  Processing: "bg-blue-100 text-blue-700",
  Refunded: "bg-error-container text-on-error-container",
};

const payoutMethods = [
  {
    id: "bank",
    label: "Bank Account",
    detail: "City Bank • **** 4492",
    icon: Landmark,
    verified: true,
  },
  {
    id: "bkash",
    label: "bKash",
    detail: "Personal • 017****889",
    icon: Smartphone,
    verified: false,
  },
  {
    id: "nagad",
    label: "Nagad",
    detail: "Add Nagad account",
    icon: Wallet,
    verified: false,
  },
] as const;

type PayoutMethodId = (typeof payoutMethods)[number]["id"];

const availableBalance = 42300;

export default function VendorPayoutsPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(String(availableBalance));
  const [selectedMethod, setSelectedMethod] = useState<PayoutMethodId>("bank");

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const openModal = () => {
    setWithdrawAmount(String(availableBalance));
    setSelectedMethod("bank");
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  if (isLoading || !vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">Loading dashboard…</p>
      </div>
    );
  }

  const initials = vendor.businessName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <VendorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex min-h-screen flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex w-full items-center justify-between gap-4 border-b border-outline-variant bg-surface/80 px-4 py-4 shadow-md backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setIsSidebarOpen(true)}
              className="text-on-surface-variant lg:hidden"
            >
              <Menu aria-hidden="true" className="h-6 w-6" />
            </button>
            <div className="relative w-full max-w-md">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              />
              <input
                type="text"
                placeholder="Search transactions, IDs…"
                className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-secondary-container"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-full p-2 transition-all hover:bg-surface-container-high/50"
            >
              <Bell aria-hidden="true" className="h-5 w-5 text-on-surface-variant" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
            </button>
            <div className="flex items-center gap-3 border-l border-outline-variant pl-3 sm:pl-6">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{vendor.businessName}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Premium Vendor
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container bg-secondary-container text-sm font-bold text-on-secondary-container">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1280px] space-y-6 sm:space-y-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="mb-1 text-2xl font-semibold text-foreground sm:text-3xl">Wallet &amp; Payouts</h2>
                <p className="text-sm text-on-surface-variant sm:text-base">
                  Manage your earnings, view transaction history, and request withdrawals.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-full border border-outline px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-surface-container-high"
                >
                  <Download aria-hidden="true" className="h-5 w-5" />
                  Export Statement
                </button>
                <button
                  type="button"
                  onClick={openModal}
                  className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Wallet aria-hidden="true" className="h-5 w-5" />
                  Request Payout
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                const NoteIcon = card.noteIcon;
                return (
                  <div
                    key={card.label}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
                  >
                    <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${card.dotBg} transition-transform duration-500 group-hover:scale-150`} />
                    <div>
                      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}>
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-medium text-on-surface-variant">{card.label}</h3>
                      <p className={`mt-2 text-3xl font-bold sm:text-4xl ${card.valueColor}`}>{card.value}</p>
                    </div>
                    <div className={`relative mt-4 flex items-center gap-2 ${card.noteColor}`}>
                      <NoteIcon aria-hidden="true" className="h-4 w-4" />
                      <span className="text-xs font-semibold">{card.note}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
              <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between border-b border-outline-variant p-6">
                  <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
                  <div className="flex items-center gap-2">
                    <select className="rounded-lg border-none bg-surface-container-low px-3 py-1.5 text-xs font-semibold focus:ring-primary">
                      <option>All Types</option>
                      <option>Sale</option>
                      <option>Payout</option>
                      <option>Refund</option>
                    </select>
                    <button
                      type="button"
                      aria-label="Filter transactions"
                      className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container-high"
                    >
                      <Filter aria-hidden="true" className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-outline-variant bg-surface-container-low">
                      <tr>
                        <th className="whitespace-nowrap px-6 py-4 text-sm font-medium text-on-surface-variant">ID</th>
                        <th className="whitespace-nowrap px-6 py-4 text-sm font-medium text-on-surface-variant">Date</th>
                        <th className="whitespace-nowrap px-6 py-4 text-sm font-medium text-on-surface-variant">Type</th>
                        <th className="whitespace-nowrap px-6 py-4 text-sm font-medium text-on-surface-variant">Amount</th>
                        <th className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-on-surface-variant">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {transactions.map((tx) => {
                        const TypeIcon = typeStyles[tx.type].icon;
                        return (
                          <tr key={tx.id} className="transition-colors hover:bg-surface-container-low/50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">{tx.id}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-outline">{tx.date}</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className={`flex items-center gap-1.5 text-sm font-semibold ${typeStyles[tx.type].color}`}>
                                <TypeIcon aria-hidden="true" className="h-[18px] w-[18px]" />
                                {tx.type}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                              {tx.amount}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[tx.status]}`}
                              >
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low p-6">
                  <p className="text-sm text-outline">Showing 5 of 124 transactions</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled
                      aria-label="Previous page"
                      className="rounded-lg border border-outline-variant p-1.5 text-outline transition-colors hover:bg-surface-container-high disabled:opacity-50"
                    >
                      <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next page"
                      className="rounded-lg border border-outline-variant p-1.5 text-outline transition-colors hover:bg-surface-container-high"
                    >
                      <ChevronRight aria-hidden="true" className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary-container">
                  <div className="relative z-10">
                    <h4 className="text-sm font-medium opacity-90">Monthly Target</h4>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-3xl font-bold">৳84,600</span>
                      <span className="pb-1 text-sm opacity-80">/ ৳100k</span>
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
                      <div className="h-full w-[84.6%] rounded-full bg-white" />
                    </div>
                    <p className="mt-3 text-sm opacity-90">
                      Keep it up! You&apos;re 15% away from your seasonal bonus.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Payout Methods</h4>
                    <button type="button" className="text-sm font-semibold text-primary hover:underline">
                      Edit
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-outline-variant bg-white">
                        <Landmark aria-hidden="true" className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-tight text-foreground">City Bank Ltd.</p>
                        <p className="text-xs text-outline">**** 4492</p>
                      </div>
                      <BadgeCheck aria-hidden="true" className="h-[18px] w-[18px] flex-shrink-0 text-primary" />
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-outline-variant p-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-[#e2136e]/20 bg-[#e2136e]/10">
                        <Smartphone aria-hidden="true" className="h-5 w-5 text-[#e2136e]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-tight text-foreground">bKash Personal</p>
                        <p className="text-xs text-outline">017****889</p>
                      </div>
                      <button
                        type="button"
                        aria-label="bKash options"
                        className="flex-shrink-0 rounded-full p-1 text-outline transition-colors hover:bg-surface-container"
                      >
                        <MoreVertical aria-hidden="true" className="h-[18px] w-[18px]" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant py-2 text-sm font-semibold text-outline transition-all hover:border-primary hover:text-primary"
                  >
                    <Plus aria-hidden="true" className="h-[18px] w-[18px]" />
                    Add Method
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-auto flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-low p-6 sm:flex-row sm:p-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-primary">EcoMart Vendor Solutions</span>
            <span className="text-sm text-on-surface-variant">© {new Date().getFullYear()} All Rights Reserved</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
              Support
            </a>
          </div>
        </footer>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={closeModal} aria-hidden="true" />

          <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/50 bg-surface-container-lowest/70 shadow-2xl backdrop-blur-md">
            <div className="border-b border-outline-variant p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Request Payout</h3>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-container"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 text-sm text-on-surface-variant">
                Available balance: <span className="font-bold text-primary">৳{availableBalance.toLocaleString("en-IN")}</span>
              </p>
            </div>

            <div className="space-y-6 overflow-y-auto p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Amount to Withdraw</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-outline">৳</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border-none bg-surface-container-low py-3 pl-10 pr-4 text-2xl font-semibold outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(availableBalance))}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Withdraw All
                  </button>
                  <p className="text-xs text-outline">Min. withdrawal: ৳1,000</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Select Payout Method</label>
                <div className="space-y-2">
                  {payoutMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;
                    return (
                      <label
                        key={method.id}
                        className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                          isSelected ? "border-2 border-primary bg-primary/5" : "border-outline-variant hover:bg-surface-container-low"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payout-method"
                          checked={isSelected}
                          onChange={() => setSelectedMethod(method.id)}
                          className="text-primary focus:ring-primary"
                        />
                        <Icon
                          aria-hidden="true"
                          className={`h-5 w-5 ${isSelected ? "text-primary" : "text-outline group-hover:text-primary"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{method.label}</p>
                          <p className="truncate text-xs text-outline">{method.detail}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-on-primary shadow-xl shadow-primary/30 transition-all hover:brightness-110 active:scale-95"
                >
                  Confirm Payout
                </button>
                <p className="mt-4 text-center text-[11px] text-outline">
                  By clicking confirm, you agree to our{" "}
                  <a href="#" className="underline">
                    payment terms
                  </a>
                  . Funds may take up to 24 hours to reflect.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

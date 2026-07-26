"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  History,
  Info,
  Landmark,
  Loader2,
  Menu,
  Plus,
  Search,
  ShoppingCart,
  Smartphone,
  Star,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";
import { VendorNotificationBell } from "@/app/components/vendor/dashboard/VendorNotificationBell";
import {
  addPayoutMethod,
  createPayoutRequest,
  deletePayoutMethod,
  fetchPayoutBalances,
  fetchPayoutMethods,
  fetchTransactions,
  transactionsToCsv,
  type PayoutBalances,
  type PayoutMethod,
  type PayoutMethodType,
  type TransactionEntry,
} from "@/services/vendor-payout.service";

type TxType = "Sale" | "Payout" | "Refund";
type TxFilter = "All Types" | TxType;

const typeStyles: Record<TxType, { icon: typeof ShoppingCart; color: string }> = {
  Sale: { icon: ShoppingCart, color: "text-primary" },
  Payout: { icon: Landmark, color: "text-tertiary" },
  Refund: { icon: History, color: "text-error" },
};

const statusStyles: Record<TransactionEntry["status"], string> = {
  Completed: "bg-secondary-container text-on-secondary-container",
  Processing: "bg-blue-100 text-blue-700",
  Refunded: "bg-error-container text-on-error-container",
  Pending: "bg-surface-container-highest text-on-surface-variant",
  Rejected: "bg-error-container text-on-error-container",
};

const methodIcons: Record<PayoutMethodType, typeof Landmark> = {
  bank: Landmark,
  bkash: Smartphone,
  nagad: Wallet,
};

const PAGE_SIZE = 5;

function formatTaka(amount: number) {
  const sign = amount < 0 ? "-" : "+";
  return `${sign}৳${Math.abs(amount).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

function formatTakaPlain(amount: number) {
  return `৳${Math.round(amount).toLocaleString("en-BD")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VendorPayoutsPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TxFilter>("All Types");
  const [currentPage, setCurrentPage] = useState(1);

  const [balances, setBalances] = useState<PayoutBalances | null>(null);
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isEditingMethods, setIsEditingMethods] = useState(false);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({ methodType: "bank" as PayoutMethodType, label: "", accountDetail: "" });

  const [withdrawAmount, setWithdrawAmount] = useState("0");
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  const loadAll = useCallback(async (vendorId: string) => {
    const [balanceData, txRows, methodRows] = await Promise.all([
      fetchPayoutBalances(vendorId),
      fetchTransactions(vendorId),
      fetchPayoutMethods(vendorId),
    ]);
    setBalances(balanceData);
    setTransactions(txRows);
    setMethods(methodRows);
  }, []);

  useEffect(() => {
    if (!vendor) return;
    let active = true;
    Promise.all([fetchPayoutBalances(vendor.id), fetchTransactions(vendor.id), fetchPayoutMethods(vendor.id)])
      .then(([balanceData, txRows, methodRows]) => {
        if (!active) return;
        setBalances(balanceData);
        setTransactions(txRows);
        setMethods(methodRows);
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });
    return () => {
      active = false;
    };
  }, [vendor?.id]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const openModal = () => {
    setWithdrawAmount(balances ? String(Math.floor(balances.availableForPayout)) : "0");
    setSelectedMethodId(methods[0]?.id ?? null);
    setPayoutError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (typeFilter !== "All Types" && tx.type !== typeFilter) return false;
      if (!q) return true;
      return tx.id.toLowerCase().includes(q) || tx.type.toLowerCase().includes(q);
    });
  }, [transactions, typeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const [prevFilterKey, setPrevFilterKey] = useState(`${typeFilter}|${searchQuery}`);
  const filterKey = `${typeFilter}|${searchQuery}`;
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const handleExportStatement = () => {
    const csv = transactionsToCsv(filteredTransactions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payout-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddMethod = async () => {
    if (!vendor || !newMethod.label.trim() || !newMethod.accountDetail.trim()) return;
    await addPayoutMethod(vendor.id, newMethod);
    setNewMethod({ methodType: "bank", label: "", accountDetail: "" });
    setIsAddingMethod(false);
    setMethods(await fetchPayoutMethods(vendor.id));
  };

  const handleDeleteMethod = async (methodId: string) => {
    await deletePayoutMethod(methodId);
    setMethods((prev) => prev.filter((m) => m.id !== methodId));
  };

  const handleConfirmPayout = async () => {
    if (!vendor || !balances) return;
    const amount = Number(withdrawAmount);
    if (Number.isNaN(amount) || amount < 1000) {
      setPayoutError("Minimum withdrawal is ৳1,000.");
      return;
    }
    if (amount > balances.availableForPayout) {
      setPayoutError("Amount exceeds your available balance.");
      return;
    }
    if (!selectedMethodId) {
      setPayoutError("Add a payout method first.");
      return;
    }
    setPayoutSubmitting(true);
    setPayoutError(null);
    try {
      await createPayoutRequest(vendor.id, selectedMethodId, amount);
      setIsModalOpen(false);
      await loadAll(vendor.id);
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : "Could not submit the payout request.");
    } finally {
      setPayoutSubmitting(false);
    }
  };

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

  const summaryCards = balances
    ? [
        {
          label: "Available for Payout",
          value: formatTakaPlain(balances.availableForPayout),
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
          value: formatTakaPlain(balances.pendingClearance),
          icon: Clock,
          valueColor: "text-foreground",
          iconBg: "bg-secondary/10",
          iconColor: "text-secondary",
          dotBg: "bg-secondary/5",
          note: "Clears once delivered",
          noteIcon: Info,
          noteColor: "text-outline",
        },
        {
          label: "Lifetime Earnings",
          value: formatTakaPlain(balances.lifetimeEarnings),
          icon: TrendingUp,
          valueColor: "text-foreground",
          iconBg: "bg-tertiary-container/20",
          iconColor: "text-tertiary",
          dotBg: "bg-tertiary-container/10",
          note: "Since joining EcoMart",
          noteIcon: Star,
          noteColor: "text-on-secondary-container",
        },
      ]
    : [];

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
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search transactions, IDs…"
                className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-secondary-container"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <VendorNotificationBell />
            <div className="flex items-center gap-3 border-l border-outline-variant pl-3 sm:pl-6">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{vendor.businessName}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Premium Vendor
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary-container bg-secondary-container text-sm font-bold text-on-secondary-container">
                {vendor.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendor.avatar} alt={vendor.businessName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
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
                  onClick={handleExportStatement}
                  className="flex items-center justify-center gap-2 rounded-full border border-outline px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-surface-container-high"
                >
                  <Download aria-hidden="true" className="h-5 w-5" />
                  Export Statement
                </button>
                <button
                  type="button"
                  onClick={openModal}
                  disabled={!balances || balances.availableForPayout < 1000}
                  className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
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
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value as TxFilter)}
                      className="rounded-lg border-none bg-surface-container-low px-3 py-1.5 text-xs font-semibold focus:ring-primary"
                    >
                      <option>All Types</option>
                      <option>Sale</option>
                      <option>Payout</option>
                      <option>Refund</option>
                    </select>
                    <button
                      type="button"
                      aria-label="Reset filter"
                      onClick={() => setTypeFilter("All Types")}
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
                      {dataLoading && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center">
                            <Loader2 aria-hidden="true" className="mx-auto h-5 w-5 animate-spin text-outline" />
                          </td>
                        </tr>
                      )}
                      {!dataLoading && paginatedTransactions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                            No transactions yet.
                          </td>
                        </tr>
                      )}
                      {!dataLoading &&
                        paginatedTransactions.map((tx) => {
                          const TypeIcon = typeStyles[tx.type].icon;
                          return (
                            <tr key={tx.id + tx.date} className="transition-colors hover:bg-surface-container-low/50">
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">#{tx.id}</td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-outline">{formatDate(tx.date)}</td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <span className={`flex items-center gap-1.5 text-sm font-semibold ${typeStyles[tx.type].color}`}>
                                  <TypeIcon aria-hidden="true" className="h-[18px] w-[18px]" />
                                  {tx.type}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                                {formatTaka(tx.amount)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[tx.status]}`}>
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
                  <p className="text-sm text-outline">
                    Showing {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                      className="rounded-lg border border-outline-variant p-1.5 text-outline transition-colors hover:bg-surface-container-high disabled:opacity-50"
                    >
                      <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Next page"
                      className="rounded-lg border border-outline-variant p-1.5 text-outline transition-colors hover:bg-surface-container-high disabled:opacity-50"
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
                      <span className="text-3xl font-bold">{formatTakaPlain(balances?.lifetimeEarnings ?? 0)}</span>
                      <span className="pb-1 text-sm opacity-80">lifetime</span>
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${Math.min(100, balances ? (balances.availableForPayout / Math.max(1, balances.lifetimeEarnings)) * 100 : 0)}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm opacity-90">
                      {balances && balances.availableForPayout >= 1000
                        ? `৳${Math.floor(balances.availableForPayout).toLocaleString("en-BD")} ready to withdraw right now.`
                        : "Deliver more orders to unlock your next payout."}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Payout Methods</h4>
                    <button
                      type="button"
                      onClick={() => setIsEditingMethods((prev) => !prev)}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {isEditingMethods ? "Done" : "Edit"}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {methods.length === 0 && !dataLoading && (
                      <p className="text-sm text-on-surface-variant">No payout methods yet.</p>
                    )}
                    {methods.map((method) => {
                      const Icon = methodIcons[method.methodType];
                      return (
                        <div
                          key={method.id}
                          className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-outline-variant bg-white">
                            <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-tight text-foreground">{method.label}</p>
                            <p className="text-xs text-outline">{method.accountDetail}</p>
                          </div>
                          {isEditingMethods ? (
                            <button
                              type="button"
                              aria-label="Remove method"
                              onClick={() => handleDeleteMethod(method.id)}
                              className="shrink-0 rounded-full p-1 text-error transition-colors hover:bg-error-container/40"
                            >
                              <Trash2 aria-hidden="true" className="h-[18px] w-[18px]" />
                            </button>
                          ) : method.isVerified ? (
                            <BadgeCheck aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-primary" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  {isAddingMethod ? (
                    <div className="mt-4 space-y-2 rounded-lg border border-outline-variant bg-surface-container-low p-3">
                      <select
                        value={newMethod.methodType}
                        onChange={(event) => setNewMethod((prev) => ({ ...prev, methodType: event.target.value as PayoutMethodType }))}
                        className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
                      >
                        <option value="bank">Bank Account</option>
                        <option value="bkash">bKash</option>
                        <option value="nagad">Nagad</option>
                      </select>
                      <input
                        value={newMethod.label}
                        onChange={(event) => setNewMethod((prev) => ({ ...prev, label: event.target.value }))}
                        placeholder="Label (e.g. City Bank Ltd.)"
                        className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
                      />
                      <input
                        value={newMethod.accountDetail}
                        onChange={(event) => setNewMethod((prev) => ({ ...prev, accountDetail: event.target.value }))}
                        placeholder="Account / phone number"
                        className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={handleAddMethod} className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white">
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingMethod(false)}
                          className="flex-1 rounded-lg border border-outline-variant py-2 text-sm font-medium text-on-surface-variant"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingMethod(true)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant py-2 text-sm font-semibold text-outline transition-all hover:border-primary hover:text-primary"
                    >
                      <Plus aria-hidden="true" className="h-[18px] w-[18px]" />
                      Add Method
                    </button>
                  )}
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
                Available balance:{" "}
                <span className="font-bold text-primary">{formatTakaPlain(balances?.availableForPayout ?? 0)}</span>
              </p>
            </div>

            <div className="space-y-6 overflow-y-auto p-6">
              {payoutError && (
                <div className="rounded-xl border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
                  {payoutError}
                </div>
              )}
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
                    onClick={() => setWithdrawAmount(String(Math.floor(balances?.availableForPayout ?? 0)))}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Withdraw All
                  </button>
                  <p className="text-xs text-outline">Min. withdrawal: ৳1,000</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Select Payout Method</label>
                {methods.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Add a payout method first.</p>
                ) : (
                  <div className="space-y-2">
                    {methods.map((method) => {
                      const Icon = methodIcons[method.methodType];
                      const isSelected = selectedMethodId === method.id;
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
                            onChange={() => setSelectedMethodId(method.id)}
                            className="text-primary focus:ring-primary"
                          />
                          <Icon
                            aria-hidden="true"
                            className={`h-5 w-5 ${isSelected ? "text-primary" : "text-outline group-hover:text-primary"}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{method.label}</p>
                            <p className="truncate text-xs text-outline">{method.accountDetail}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  disabled={payoutSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-semibold text-on-primary shadow-xl shadow-primary/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {payoutSubmitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
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

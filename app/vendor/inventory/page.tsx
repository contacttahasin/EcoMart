"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  BellRing,
  ClipboardCheck,
  Download,
  Leaf,
  ListFilter,
  Menu,
  Save,
  Search,
  TrendingUp,
  UploadCloud,
  X,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";

type SkuItem = {
  id: string;
  name: string;
  category: string;
  sku: string;
  stock: number;
  threshold: number;
  emoji: string;
};

const initialSkus: SkuItem[] = [
  {
    id: "sku-1",
    name: "Bamboo Toothbrush Set",
    category: "Personal Care / Sustainable",
    sku: "SKU-2024-BTB",
    stock: 8,
    threshold: 15,
    emoji: "🪥",
  },
  {
    id: "sku-2",
    name: "Organic Cotton Bags (L)",
    category: "Kitchen / Reusable",
    sku: "SKU-BAG-L-C",
    stock: 142,
    threshold: 20,
    emoji: "🛍️",
  },
  {
    id: "sku-3",
    name: "Bio-Degradable Detergent",
    category: "Cleaning / Eco-Home",
    sku: "SKU-CLEAN-BDD",
    stock: 45,
    threshold: 10,
    emoji: "🧴",
  },
];

const movementLog = [
  {
    date: "Oct 24, 2024 • 14:22",
    sku: "SKU-2024-BTB",
    change: "-2",
    changeColor: "text-error",
    reason: "Order #8832",
    reasonStyle: "bg-secondary-container text-on-secondary-container",
    updatedBy: "System Auto",
  },
  {
    date: "Oct 23, 2024 • 09:15",
    sku: "SKU-BAG-L-C",
    change: "+100",
    changeColor: "text-primary",
    reason: "RESTOCK",
    reasonStyle: "bg-surface-container-highest text-on-surface-variant uppercase tracking-tighter",
    updatedBy: "Admin Alex",
  },
  {
    date: "Oct 22, 2024 • 11:45",
    sku: "SKU-CLEAN-BDD",
    change: "+1",
    changeColor: "text-primary",
    reason: "Return",
    reasonStyle: "bg-tertiary-container/20 text-tertiary",
    updatedBy: "Warehouse Bot",
  },
];

export default function VendorInventoryPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [skus, setSkus] = useState(initialSkus);
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [globalThreshold, setGlobalThreshold] = useState(15);
  const [draftThreshold, setDraftThreshold] = useState(String(globalThreshold));
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsModalOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const updateThreshold = (id: string, threshold: number) => {
    setSkus((prev) => prev.map((item) => (item.id === id ? { ...item, threshold } : item)));
  };

  const saveGlobalThreshold = () => {
    const parsed = Number(draftThreshold);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setGlobalThreshold(parsed);
    } else {
      setDraftThreshold(String(globalThreshold));
    }
    setIsEditingThreshold(false);
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
                placeholder="Search SKU, Product Name…"
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

        <section className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="mb-1 text-2xl font-semibold text-foreground sm:text-3xl">Inventory Management</h2>
              <p className="text-sm text-on-surface-variant sm:text-base">
                Monitor stock levels and manage SKU availability across warehouses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 sm:w-auto"
            >
              <ArrowLeftRight aria-hidden="true" className="h-5 w-5" />
              Adjust Stock
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-4">
              <div className="relative z-10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
                  <BellRing aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Global Threshold</h3>
                <p className="mb-6 text-sm text-on-surface-variant">
                  Automatically tag items as &apos;Low Stock&apos; when they fall below this value.
                </p>
              </div>
              <div className="relative z-10 rounded-2xl border border-outline-variant bg-surface-container p-4">
                <label className="mb-1 block text-[10px] font-bold uppercase text-outline">Units Threshold</label>
                {isEditingThreshold ? (
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="number"
                      value={draftThreshold}
                      onChange={(event) => setDraftThreshold(event.target.value)}
                      autoFocus
                      className="w-20 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-lg font-semibold text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    />
                    <button
                      type="button"
                      onClick={saveGlobalThreshold}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-semibold text-primary">{globalThreshold}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftThreshold(String(globalThreshold));
                        setIsEditingThreshold(true);
                      }}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Edit Setting
                    </button>
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-5">
                <Leaf aria-hidden="true" className="h-[200px] w-[200px]" />
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-8">
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-outline">Inventory Overview</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6">
                  <ClipboardCheck aria-hidden="true" className="h-8 w-8 text-primary" />
                  <span className="text-3xl font-bold leading-none text-foreground sm:text-4xl">1,284</span>
                  <span className="text-sm text-on-surface-variant">Total SKU Count</span>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border border-error/20 bg-error-container/10 p-6">
                  <AlertTriangle aria-hidden="true" className="h-8 w-8 text-error" />
                  <span className="text-3xl font-bold leading-none text-error sm:text-4xl">24</span>
                  <span className="text-sm text-on-surface-variant">Low Stock Alerts</span>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border border-tertiary/20 bg-tertiary-container/10 p-6">
                  <TrendingUp aria-hidden="true" className="h-8 w-8 text-tertiary" />
                  <span className="text-3xl font-bold leading-none text-tertiary sm:text-4xl">+12%</span>
                  <span className="text-sm text-on-surface-variant">Restock Efficiency</span>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-sm lg:col-span-12">
              <div className="flex flex-col gap-4 border-b border-outline-variant p-6 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-foreground">Product Inventory Status</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-highest"
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Export PDF
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container transition-colors hover:opacity-80"
                  >
                    <ListFilter aria-hidden="true" className="h-4 w-4" />
                    Filter: Low Stock
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="whitespace-nowrap px-6 py-4 text-sm font-medium text-outline">Product Detail</th>
                      <th className="whitespace-nowrap px-6 py-4 text-sm font-medium text-outline">SKU</th>
                      <th className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-outline">
                        Current Stock
                      </th>
                      <th className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-outline">
                        Threshold
                      </th>
                      <th className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium text-outline">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {skus.map((item) => {
                      const isLow = item.stock < item.threshold;
                      return (
                        <tr key={item.id} className="group transition-colors hover:bg-surface-container">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-outline-variant/30 bg-surface-container-high text-xl">
                                {item.emoji}
                              </div>
                              <div>
                                <p className="whitespace-nowrap font-bold text-foreground">{item.name}</p>
                                <p className="whitespace-nowrap text-sm text-on-surface-variant">{item.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-outline">{item.sku}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            {isLow ? (
                              <span className="inline-flex items-center rounded-full bg-error-container px-3 py-1 text-sm font-medium text-on-error-container">
                                {item.stock} Units
                              </span>
                            ) : (
                              <span className="text-foreground">{item.stock} Units</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <input
                              type="number"
                              value={item.threshold}
                              onChange={(event) => updateThreshold(item.id, Number(event.target.value))}
                              className="w-16 rounded-lg border border-outline-variant bg-surface-container px-2 py-1 text-right text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              aria-label="Save threshold"
                              className="rounded-full p-2 text-primary transition-colors hover:bg-secondary-container/20"
                            >
                              <Save aria-hidden="true" className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-4 overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-sm lg:col-span-12">
              <div className="border-b border-outline-variant p-6">
                <h3 className="text-lg font-semibold text-foreground">Stock Movement Log</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-outline">
                        Date
                      </th>
                      <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-outline">
                        SKU Reference
                      </th>
                      <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-outline">
                        Change
                      </th>
                      <th className="whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-outline">
                        Reason
                      </th>
                      <th className="whitespace-nowrap px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-outline">
                        Updated By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {movementLog.map((entry) => (
                      <tr key={`${entry.sku}-${entry.date}`}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-on-surface-variant">{entry.date}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-foreground">{entry.sku}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`font-bold ${entry.changeColor}`}>{entry.change}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${entry.reasonStyle}`}>
                            {entry.reason}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm italic text-outline">
                          {entry.updatedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>

        <footer className="flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-low p-6 sm:flex-row sm:p-8">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">EcoMart Admin</span>
            <span className="text-xs text-outline">|</span>
            <p className="text-sm text-on-surface-variant">© {new Date().getFullYear()} EcoMart Vendor Solutions</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="text-sm text-on-surface-variant transition-all hover:text-primary hover:underline">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-on-surface-variant transition-all hover:text-primary hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-on-surface-variant transition-all hover:text-primary hover:underline">
              Support
            </a>
          </div>
        </footer>
      </main>

      <div
        onClick={() => setIsModalOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-300 ${
          isModalOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Batch stock adjustment"
          onClick={(event) => event.stopPropagation()}
          className={`flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-surface-container-lowest shadow-2xl transition-transform duration-300 ${
            isModalOpen ? "scale-100" : "scale-90"
          }`}
        >
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-foreground sm:text-xl">Batch Stock Adjustment</h3>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-container"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Option 1: Import CSV</h4>
                <div className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant p-8 text-center transition-colors hover:border-primary">
                  <UploadCloud
                    aria-hidden="true"
                    className="mb-4 h-12 w-12 text-outline transition-colors group-hover:text-primary"
                  />
                  <p className="text-sm text-on-surface-variant">
                    Drop your inventory spreadsheet here or <span className="font-bold text-primary">browse</span>
                  </p>
                  <p className="mt-2 text-[10px] text-outline">Supports .CSV, .XLSX (Max 5MB)</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Option 2: Manual Batch</h4>
                <div className="space-y-4">
                  <div className="rounded-xl bg-surface-container p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">Select Warehouse</p>
                    <select className="w-full border-none bg-transparent p-0 text-sm focus:outline-none focus:ring-0">
                      <option>Seattle Central (Main)</option>
                      <option>Austin Distribution</option>
                      <option>New Jersey Hub</option>
                    </select>
                  </div>
                  <div className="rounded-xl bg-surface-container p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">Adjustment Action</p>
                    <select className="w-full border-none bg-transparent p-0 text-sm focus:outline-none focus:ring-0">
                      <option>Add Stock (Restock)</option>
                      <option>Subtract Stock (Shrinkage)</option>
                      <option>Reset Exact Count</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 bg-surface-container p-6 sm:flex-row sm:justify-end sm:p-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl px-6 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-primary px-8 py-2 text-sm font-medium text-white shadow-lg transition-all active:scale-95"
            >
              Start Batch Process
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

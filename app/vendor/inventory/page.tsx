"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeftRight,
  BellRing,
  ClipboardCheck,
  Download,
  Leaf,
  ListFilter,
  Loader2,
  Menu,
  Save,
  Search,
  TrendingUp,
  UploadCloud,
  X,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";
import { VendorNotificationBell } from "@/app/components/vendor/dashboard/VendorNotificationBell";
import {
  applyCsvStockAdjustments,
  batchAdjustStock,
  bulkApplyThreshold,
  fetchStockMovements,
  fetchVendorInventory,
  parseStockCsv,
  updateProductThreshold,
  type InventoryRow,
  type StockAction,
  type StockMovementRow,
} from "@/services/vendor-inventory.service";

function formatMovementDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function printDocument(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      body { font-family: -apple-system, sans-serif; padding: 32px; color: #1b211d; }
      h1 { font-size: 20px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
    </style></head><body>${bodyHtml}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export default function VendorInventoryPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [globalThreshold, setGlobalThreshold] = useState(10);
  const [draftThreshold, setDraftThreshold] = useState(String(globalThreshold));
  const [globalThresholdSaving, setGlobalThresholdSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [items, setItems] = useState<InventoryRow[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [thresholdDrafts, setThresholdDrafts] = useState<Record<string, string>>({});
  const [savingThresholdId, setSavingThresholdId] = useState<string | null>(null);

  const [movements, setMovements] = useState<StockMovementRow[]>([]);

  const [warehouse, setWarehouse] = useState("Seattle Central (Main)");
  const [batchAction, setBatchAction] = useState<StockAction>("add");
  const [batchQuantity, setBatchQuantity] = useState("10");
  const [batchSaving, setBatchSaving] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvSaving, setCsvSaving] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

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

  const loadInventory = useCallback(async (vendorId: string) => {
    const [rows, moves] = await Promise.all([fetchVendorInventory(vendorId), fetchStockMovements(vendorId)]);
    setItems(rows);
    setThresholdDrafts(Object.fromEntries(rows.map((row) => [row.id, String(row.threshold)])));
    setMovements(moves);
    if (rows.length > 0) {
      const counts: Record<number, number> = {};
      rows.forEach((row) => {
        counts[row.threshold] = (counts[row.threshold] ?? 0) + 1;
      });
      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setGlobalThreshold(Number(mostCommon));
      setDraftThreshold(mostCommon);
    }
  }, []);

  const vendorId = vendor?.id;

  useEffect(() => {
    if (!vendorId) return;
    let active = true;
    Promise.all([fetchVendorInventory(vendorId), fetchStockMovements(vendorId)])
      .then(([rows, moves]) => {
        if (!active) return;
        setItems(rows);
        setThresholdDrafts(Object.fromEntries(rows.map((row) => [row.id, String(row.threshold)])));
        setMovements(moves);
        if (rows.length > 0) {
          const counts: Record<number, number> = {};
          rows.forEach((row) => {
            counts[row.threshold] = (counts[row.threshold] ?? 0) + 1;
          });
          const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
          setGlobalThreshold(Number(mostCommon));
          setDraftThreshold(mostCommon);
        }
      })
      .finally(() => {
        if (active) setItemsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [vendorId]);

  const saveGlobalThreshold = async () => {
    if (!vendor) return;
    const parsed = Number(draftThreshold);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setDraftThreshold(String(globalThreshold));
      setIsEditingThreshold(false);
      return;
    }
    setGlobalThresholdSaving(true);
    try {
      await bulkApplyThreshold(vendor.id, parsed);
      setGlobalThreshold(parsed);
      await loadInventory(vendor.id);
    } finally {
      setGlobalThresholdSaving(false);
      setIsEditingThreshold(false);
    }
  };

  const handleSaveThreshold = async (item: InventoryRow) => {
    const parsed = Number(thresholdDrafts[item.id]);
    if (Number.isNaN(parsed) || parsed < 0 || parsed === item.threshold) return;
    setSavingThresholdId(item.id);
    try {
      await updateProductThreshold(item.id, parsed);
      setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, threshold: parsed } : row)));
    } finally {
      setSavingThresholdId(null);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (lowStockOnly && item.stock >= item.threshold) return false;
      if (!q) return true;
      return item.title.toLowerCase().includes(q) || (item.sku ?? "").toLowerCase().includes(q);
    });
  }, [items, searchQuery, lowStockOnly]);

  const totalSkuCount = items.length;
  const lowStockCount = items.filter((item) => item.stock < item.threshold).length;
  const restockEfficiency = totalSkuCount === 0 ? 0 : Math.round(((totalSkuCount - lowStockCount) / totalSkuCount) * 100);

  const handleExportPdf = () => {
    const rows = filteredItems
      .map(
        (item) =>
          `<tr><td>${item.title}</td><td>${item.sku ?? "—"}</td><td>${item.category}</td><td>${item.stock}</td><td>${item.threshold}</td></tr>`
      )
      .join("");
    printDocument(
      "Inventory Report",
      `<h1>Inventory Report — ${vendor?.businessName ?? ""}</h1>
       <table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Threshold</th></tr></thead>
       <tbody>${rows}</tbody></table>`
    );
  };

  const handleBatchProcess = async () => {
    if (!vendor) return;
    const quantity = Number(batchQuantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      setModalMessage("Enter a valid quantity.");
      return;
    }
    setBatchSaving(true);
    setModalMessage(null);
    try {
      const count = await batchAdjustStock(batchAction, quantity, vendor.businessName);
      await loadInventory(vendor.id);
      setModalMessage(`Applied to ${count} product${count === 1 ? "" : "s"}.`);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Could not process the batch.");
    } finally {
      setBatchSaving(false);
    }
  };

  const handleCsvImport = async () => {
    if (!vendor || !csvFile) return;
    setCsvSaving(true);
    setModalMessage(null);
    try {
      const text = await csvFile.text();
      const rows = parseStockCsv(text);
      if (rows.length === 0) {
        setModalMessage("No valid rows found. Expect columns: sku,change,reason");
        return;
      }
      const result = await applyCsvStockAdjustments(vendor.id, rows, vendor.businessName);
      await loadInventory(vendor.id);
      setModalMessage(
        `Applied ${result.applied} adjustment${result.applied === 1 ? "" : "s"}.` +
          (result.skipped.length ? ` Skipped unknown SKUs: ${result.skipped.join(", ")}` : "")
      );
    } finally {
      setCsvSaving(false);
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
                placeholder="Search SKU, Product Name…"
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
              onClick={() => {
                setModalMessage(null);
                setIsModalOpen(true);
              }}
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
                  Automatically tag items as &apos;Low Stock&apos; when they fall below this value. Saving applies it to every product.
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
                      disabled={globalThresholdSaving}
                      className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      {globalThresholdSaving && <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />}
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
                <Leaf aria-hidden="true" className="h-50 w-50" />
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-8">
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-outline">Inventory Overview</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6">
                  <ClipboardCheck aria-hidden="true" className="h-8 w-8 text-primary" />
                  <span className="text-3xl font-bold leading-none text-foreground sm:text-4xl">{totalSkuCount}</span>
                  <span className="text-sm text-on-surface-variant">Total SKU Count</span>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border border-error/20 bg-error-container/10 p-6">
                  <AlertTriangle aria-hidden="true" className="h-8 w-8 text-error" />
                  <span className="text-3xl font-bold leading-none text-error sm:text-4xl">{lowStockCount}</span>
                  <span className="text-sm text-on-surface-variant">Low Stock Alerts</span>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border border-tertiary/20 bg-tertiary-container/10 p-6">
                  <TrendingUp aria-hidden="true" className="h-8 w-8 text-tertiary" />
                  <span className="text-3xl font-bold leading-none text-tertiary sm:text-4xl">{restockEfficiency}%</span>
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
                    onClick={handleExportPdf}
                    className="flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-highest"
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setLowStockOnly((prev) => !prev)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      lowStockOnly
                        ? "bg-error-container text-on-error-container"
                        : "bg-secondary-container text-on-secondary-container hover:opacity-80"
                    }`}
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
                    {itemsLoading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                          <Loader2 aria-hidden="true" className="mx-auto h-5 w-5 animate-spin" />
                        </td>
                      </tr>
                    )}
                    {!itemsLoading && filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                          No products match this view yet.
                        </td>
                      </tr>
                    )}
                    {!itemsLoading &&
                      filteredItems.map((item) => {
                        const isLow = item.stock < item.threshold;
                        const draft = thresholdDrafts[item.id] ?? String(item.threshold);
                        return (
                          <tr key={item.id} className="group transition-colors hover:bg-surface-container">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-high text-xl">
                                  {item.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                                  ) : (
                                    "📦"
                                  )}
                                </div>
                                <div>
                                  <p className="whitespace-nowrap font-bold text-foreground">{item.title}</p>
                                  <p className="whitespace-nowrap text-sm text-on-surface-variant">{item.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-outline">{item.sku ?? "—"}</td>
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
                                value={draft}
                                onChange={(event) =>
                                  setThresholdDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                                }
                                className="w-16 rounded-lg border border-outline-variant bg-surface-container px-2 py-1 text-right text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                type="button"
                                aria-label="Save threshold"
                                onClick={() => handleSaveThreshold(item)}
                                disabled={savingThresholdId === item.id || Number(draft) === item.threshold}
                                className="rounded-full p-2 text-primary transition-colors hover:bg-secondary-container/20 disabled:opacity-30"
                              >
                                {savingThresholdId === item.id ? (
                                  <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Save aria-hidden="true" className="h-5 w-5" />
                                )}
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
                    {movements.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                          No stock movements yet.
                        </td>
                      </tr>
                    )}
                    {movements.map((entry) => (
                      <tr key={entry.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-on-surface-variant">
                          {formatMovementDate(entry.date)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-foreground">{entry.sku}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`font-bold ${entry.change < 0 ? "text-error" : "text-primary"}`}>
                            {entry.change > 0 ? `+${entry.change}` : entry.change}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="rounded-full bg-surface-container-highest px-3 py-1 text-[11px] font-bold uppercase tracking-tighter text-on-surface-variant">
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-container"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            {modalMessage && (
              <div className="mb-4 rounded-xl bg-secondary-container px-4 py-3 text-sm text-on-secondary-container">
                {modalMessage}
              </div>
            )}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Option 1: Import CSV</h4>
                <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant p-8 text-center transition-colors hover:border-primary">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)}
                  />
                  <UploadCloud
                    aria-hidden="true"
                    className="mb-4 h-12 w-12 text-outline transition-colors group-hover:text-primary"
                  />
                  <p className="text-sm text-on-surface-variant">
                    {csvFile ? csvFile.name : (
                      <>
                        Drop your inventory spreadsheet here or <span className="font-bold text-primary">browse</span>
                      </>
                    )}
                  </p>
                  <p className="mt-2 text-[10px] text-outline">Columns: sku,change,reason</p>
                </label>
                <button
                  type="button"
                  onClick={handleCsvImport}
                  disabled={!csvFile || csvSaving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container transition-colors hover:opacity-80 disabled:opacity-40"
                >
                  {csvSaving && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                  Apply CSV Adjustments
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Option 2: Manual Batch</h4>
                <div className="space-y-4">
                  <div className="rounded-xl bg-surface-container p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">Select Warehouse</p>
                    <select
                      value={warehouse}
                      onChange={(event) => setWarehouse(event.target.value)}
                      className="w-full border-none bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
                    >
                      <option>Seattle Central (Main)</option>
                      <option>Austin Distribution</option>
                      <option>New Jersey Hub</option>
                    </select>
                  </div>
                  <div className="rounded-xl bg-surface-container p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">Adjustment Action</p>
                    <select
                      value={batchAction}
                      onChange={(event) => setBatchAction(event.target.value as StockAction)}
                      className="w-full border-none bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
                    >
                      <option value="add">Add Stock (Restock)</option>
                      <option value="subtract">Subtract Stock (Shrinkage)</option>
                      <option value="reset">Reset Exact Count</option>
                    </select>
                  </div>
                  <div className="rounded-xl bg-surface-container p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">Quantity (applies to all SKUs)</p>
                    <input
                      type="number"
                      min={0}
                      value={batchQuantity}
                      onChange={(event) => setBatchQuantity(event.target.value)}
                      className="w-full border-none bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
                    />
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
              onClick={handleBatchProcess}
              disabled={batchSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-2 text-sm font-medium text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {batchSaving && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
              Start Batch Process
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  DollarSign,
  Download,
  Filter,
  Loader2,
  LineChart,
  Megaphone,
  Menu,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  Rocket,
  Search,
  Smartphone,
  Star,
  TrendingUp,
  Trophy,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";
import { VendorNotificationBell } from "@/app/components/vendor/dashboard/VendorNotificationBell";
import {
  campaignsToCsv,
  createCampaign,
  extendCampaign,
  fetchCampaigns,
  fetchEligibleProducts,
  fetchPromotionsSummary,
  setCampaignStatus,
  type CampaignPaymentMethod,
  type CampaignRow,
  type CampaignStatus,
  type CampaignType,
  type EligibleProduct,
  type PricingModel,
  type PromotionsSummary,
} from "@/services/vendor-promotion.service";

const campaignTypeBadgeStyles: Record<CampaignType, string> = {
  featured: "bg-secondary-container text-on-secondary-container",
  sponsored: "bg-tertiary-container text-on-tertiary-container",
  flash_deal: "bg-error-container text-on-error-container",
  top_rank: "bg-primary-container text-on-primary-container",
};

const campaignTypeLabels: Record<CampaignType, string> = {
  featured: "Featured",
  sponsored: "Sponsored",
  flash_deal: "Flash Deal",
  top_rank: "Top Rank",
};

const campaignTypeOptions: { id: CampaignType; label: string; description: string; icon: typeof Star }[] = [
  { id: "featured", label: "Featured", description: "Top of category results", icon: Star },
  { id: "sponsored", label: "Sponsored", description: "In-feed product ads", icon: Megaphone },
  { id: "flash_deal", label: "Flash Deal", description: "Limited time highlight", icon: Zap },
  { id: "top_rank", label: "Top Rank", description: "Search priority boost", icon: Trophy },
];

const pricingModels: { id: PricingModel; label: string }[] = [
  { id: "fixed", label: "Fixed Duration" },
  { id: "ppc", label: "Pay-Per-Click (PPC)" },
];

const paymentMethods: { id: CampaignPaymentMethod; label: string; icon: typeof Wallet; accent: string; ring: string }[] = [
  { id: "wallet", label: "Store Wallet", icon: Wallet, accent: "text-primary", ring: "hover:border-primary" },
  { id: "bkash", label: "bKash", icon: Smartphone, accent: "text-[#E2136E]", ring: "hover:border-[#E2136E]" },
  { id: "nagad", label: "Nagad", icon: Smartphone, accent: "text-[#ED1C24]", ring: "hover:border-[#ED1C24]" },
];

const statusFilters: (CampaignStatus | "all")[] = ["all", "active", "paused", "completed"];

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export default function VendorPromotionsPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [summary, setSummary] = useState<PromotionsSummary | null>(null);
  const [eligibleProducts, setEligibleProducts] = useState<EligibleProduct[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [busyCampaignId, setBusyCampaignId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EligibleProduct | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignType>("featured");
  const [pricingModel, setPricingModel] = useState<PricingModel>("fixed");
  const [paymentMethod, setPaymentMethod] = useState<CampaignPaymentMethod>("wallet");
  const [budgetAmount, setBudgetAmount] = useState("50");
  const [durationDays, setDurationDays] = useState("7");
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  const loadAll = useCallback(async (vendorId: string) => {
    const [campaignRows, summaryData, eligible] = await Promise.all([
      fetchCampaigns(vendorId),
      fetchPromotionsSummary(vendorId),
      fetchEligibleProducts(vendorId),
    ]);
    setCampaigns(campaignRows);
    setSummary(summaryData);
    setEligibleProducts(eligible);
  }, []);

  useEffect(() => {
    if (!vendor) return;
    let active = true;
    Promise.all([fetchCampaigns(vendor.id), fetchPromotionsSummary(vendor.id), fetchEligibleProducts(vendor.id)])
      .then(([campaignRows, summaryData, eligible]) => {
        if (!active) return;
        setCampaigns(campaignRows);
        setSummary(summaryData);
        setEligibleProducts(eligible);
      })
      .finally(() => {
        if (active) setCampaignsLoading(false);
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

  const openBoostModal = (product?: EligibleProduct) => {
    const target = product ?? eligibleProducts[0];
    if (!target) return;
    setSelectedProduct(target);
    setCampaignType("featured");
    setPricingModel("fixed");
    setPaymentMethod("wallet");
    setBudgetAmount("50");
    setDurationDays("7");
    setLaunchError(null);
    setIsModalOpen(true);
  };

  const closeBoostModal = () => setIsModalOpen(false);

  const handleLaunchCampaign = async () => {
    if (!vendor || !selectedProduct) return;
    const budget = Number(budgetAmount);
    if (Number.isNaN(budget) || budget <= 0) {
      setLaunchError("Enter a valid budget amount.");
      return;
    }
    setLaunching(true);
    setLaunchError(null);
    try {
      await createCampaign({
        vendorId: vendor.id,
        productId: selectedProduct.id,
        campaignType,
        pricingModel,
        paymentMethod,
        budgetAmount: budget,
        durationDays: pricingModel === "fixed" ? Number(durationDays) || 7 : null,
      });
      setIsModalOpen(false);
      await loadAll(vendor.id);
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : "Could not launch the campaign.");
    } finally {
      setLaunching(false);
    }
  };

  const handleToggleStatus = async (campaign: CampaignRow) => {
    setBusyCampaignId(campaign.id);
    try {
      const nextStatus: CampaignStatus = campaign.status === "active" ? "paused" : "active";
      await setCampaignStatus(campaign.id, nextStatus);
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c)));
    } finally {
      setBusyCampaignId(null);
    }
  };

  const handleExtend = async (campaign: CampaignRow) => {
    setBusyCampaignId(campaign.id);
    try {
      const additionalBudget = Math.max(10, Math.round(campaign.budgetAmount * 0.5));
      await extendCampaign(campaign.id, 7, additionalBudget);
      if (vendor) await loadAll(vendor.id);
    } finally {
      setBusyCampaignId(null);
    }
  };

  const visibleCampaigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return c.productTitle.toLowerCase().includes(q);
    });
  }, [campaigns, statusFilter, searchQuery]);

  const visibleEligibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return eligibleProducts;
    return eligibleProducts.filter((p) => p.title.toLowerCase().includes(q));
  }, [eligibleProducts, searchQuery]);

  const handleDownloadReport = () => {
    const csv = campaignsToCsv(visibleCampaigns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campaigns-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cycleStatusFilter = () => {
    const currentIndex = statusFilters.indexOf(statusFilter);
    setStatusFilter(statusFilters[(currentIndex + 1) % statusFilters.length]);
  };

  const analyticsCards = summary
    ? [
        { label: "Active Campaigns", value: String(summary.activeCampaignsCount), icon: Rocket, iconBg: "bg-primary-container/20", iconColor: "text-primary" },
        { label: "Total Budget", value: formatMoney(summary.totalBudget), icon: DollarSign, iconBg: "bg-secondary-container/20", iconColor: "text-secondary" },
        { label: "Total Spent", value: formatMoney(summary.totalSpent), icon: Wallet, iconBg: "bg-tertiary-container/20", iconColor: "text-tertiary" },
        { label: "Budget Utilization", value: `${summary.avgUtilizationPct}%`, icon: LineChart, iconBg: "bg-primary-container/20", iconColor: "text-primary" },
      ]
    : [];

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

      <main className="min-h-screen lg:ml-64">
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
                placeholder="Search campaigns, products…"
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

        <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Marketing Center</h2>
              <p className="mt-1 text-sm text-on-surface-variant sm:text-base">
                Boost your product visibility and reach 10x more customers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openBoostModal()}
              disabled={eligibleProducts.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 sm:w-auto"
            >
              <Rocket aria-hidden="true" className="h-5 w-5" />
              Boost New Product
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {analyticsCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mb-1 text-sm font-medium text-on-surface-variant">{card.label}</p>
                  <h3 className="text-2xl font-semibold text-foreground">{card.value}</h3>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/30 bg-white/70 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-outline-variant px-4 py-5 sm:px-6">
              <h3 className="text-lg font-semibold text-foreground">
                Active Campaigns {statusFilter !== "all" && <span className="text-sm font-normal capitalize text-on-surface-variant">({statusFilter})</span>}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Filter campaigns"
                  onClick={cycleStatusFilter}
                  className={`rounded-lg p-2 transition-colors hover:bg-surface-container ${statusFilter !== "all" ? "text-primary" : "text-outline"}`}
                >
                  <Filter aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Download report"
                  onClick={handleDownloadReport}
                  className="rounded-lg p-2 text-outline transition-colors hover:bg-surface-container"
                >
                  <Download aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-4">Campaign Name</th>
                    <th className="whitespace-nowrap px-6 py-4">Type</th>
                    <th className="whitespace-nowrap px-6 py-4">Budget</th>
                    <th className="whitespace-nowrap px-6 py-4">Spent</th>
                    <th className="whitespace-nowrap px-6 py-4">Status</th>
                    <th className="whitespace-nowrap px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {campaignsLoading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant">
                        <Loader2 aria-hidden="true" className="mx-auto h-5 w-5 animate-spin" />
                      </td>
                    </tr>
                  )}
                  {!campaignsLoading && visibleCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                        No campaigns yet.
                      </td>
                    </tr>
                  )}
                  {!campaignsLoading &&
                    visibleCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="group transition-colors hover:bg-surface-container-low/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-high text-xl">
                              {campaign.productImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={campaign.productImage} alt={campaign.productTitle} className="h-full w-full object-cover" />
                              ) : (
                                "📦"
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {campaignTypeLabels[campaign.campaignType]} — {campaign.productTitle}
                              </p>
                              <p className="truncate text-xs text-on-surface-variant">{campaign.productTitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${campaignTypeBadgeStyles[campaign.campaignType]}`}>
                            {campaignTypeLabels[campaign.campaignType]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">{formatMoney(campaign.budgetAmount)}</td>
                        <td className="whitespace-nowrap px-6 py-4">{formatMoney(campaign.spent)}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`flex items-center gap-1.5 text-sm font-semibold capitalize ${
                              campaign.status === "active" ? "text-primary" : "text-on-surface-variant"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${campaign.status === "active" ? "animate-pulse bg-primary" : "bg-outline"}`} />
                            {campaign.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                            {busyCampaignId === campaign.id ? (
                              <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-outline" />
                            ) : campaign.status === "active" ? (
                              <button
                                type="button"
                                aria-label="Pause campaign"
                                onClick={() => handleToggleStatus(campaign)}
                                className="rounded-lg p-2 text-outline hover:bg-surface-container"
                              >
                                <PauseCircle aria-hidden="true" className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                aria-label="Resume campaign"
                                onClick={() => handleToggleStatus(campaign)}
                                className="rounded-lg p-2 text-primary hover:bg-surface-container"
                              >
                                <PlayCircle aria-hidden="true" className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label="Extend campaign"
                              title="Extend by 7 days"
                              onClick={() => handleExtend(campaign)}
                              disabled={busyCampaignId === campaign.id}
                              className="rounded-lg p-2 text-primary hover:bg-surface-container disabled:opacity-40"
                            >
                              <PlusCircle aria-hidden="true" className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-semibold text-foreground">Eligible for Boosting</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleEligibleProducts.map((product) => (
                <div
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openBoostModal(product)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openBoostModal(product);
                    }
                  }}
                  className="group cursor-pointer rounded-3xl border border-white/30 bg-white/70 p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-xl"
                >
                  <div className="relative mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-surface-container text-6xl transition-transform duration-500 group-hover:scale-105">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                      "📦"
                    )}
                    {product.highPotential && (
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-primary backdrop-blur-md">
                        <TrendingUp aria-hidden="true" className="h-3 w-3" /> High Potential
                      </div>
                    )}
                  </div>
                  <h4 className="mb-1 text-sm font-medium text-foreground">{product.title}</h4>
                  <p className="mb-4 text-xs text-on-surface-variant">Stock: {product.stock} Units Available</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-primary">${product.price.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openBoostModal(product);
                      }}
                      className="flex items-center gap-1 text-sm font-semibold text-primary transition-transform group-hover:translate-x-1"
                    >
                      Select <ChevronRight aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {!campaignsLoading && visibleEligibleProducts.length === 0 && (
                <p className="text-sm text-on-surface-variant sm:col-span-2 lg:col-span-3">
                  No eligible products — publish an active product, or it may already be boosted.
                </p>
              )}
            </div>
          </div>
        </div>

        <footer className="flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-low p-6 sm:flex-row sm:p-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-primary">EcoMart Admin</span>
            <span className="text-sm text-on-surface-variant">© {new Date().getFullYear()} EcoMart Vendor Solutions</span>
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

      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={closeBoostModal} aria-hidden="true" />

          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5 sm:px-8 sm:py-6">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">Launch Boost Campaign</h3>
                <p className="truncate text-sm text-on-surface-variant">Boost: {selectedProduct.title}</p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={closeBoostModal}
                className="shrink-0 rounded-full p-2 hover:bg-surface-container"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="custom-scrollbar space-y-8 overflow-y-auto p-6 sm:p-8">
              {launchError && (
                <div className="rounded-xl border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
                  {launchError}
                </div>
              )}
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">Choose Campaign Type</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {campaignTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = campaignType === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`relative flex cursor-pointer gap-4 rounded-2xl border-2 p-4 transition-all hover:bg-primary/5 hover:border-primary ${
                          isSelected ? "border-primary bg-primary/5" : "border-outline-variant"
                        }`}
                      >
                        <input
                          type="radio"
                          name="campaign_type"
                          checked={isSelected}
                          onChange={() => setCampaignType(option.id)}
                          className="absolute right-4 top-4 h-4 w-4 text-primary focus:ring-primary"
                        />
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-primary">
                          <Icon aria-hidden="true" className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground">{option.label}</p>
                          <p className="text-[11px] text-on-surface-variant">{option.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 border-t border-outline-variant pt-4">
                <p className="text-sm font-medium text-foreground">Pricing Model</p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  {pricingModels.map((model) => {
                    const isSelected = pricingModel === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setPricingModel(model.id)}
                        className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-colors ${
                          isSelected ? "border-primary bg-primary/5 text-primary" : "border-outline-variant text-on-surface-variant"
                        }`}
                      >
                        {model.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-bold uppercase text-outline">
                      {pricingModel === "fixed" ? "Total Budget ($)" : "Bid Per Click ($)"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={budgetAmount}
                      onChange={(event) => setBudgetAmount(event.target.value)}
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-secondary-container"
                    />
                  </div>
                  {pricingModel === "fixed" && (
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-bold uppercase text-outline">Duration (days)</label>
                      <input
                        type="number"
                        min={1}
                        value={durationDays}
                        onChange={(event) => setDurationDays(event.target.value)}
                        className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-secondary-container"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t border-outline-variant pt-4">
                <p className="text-sm font-medium text-foreground">Payment Method</p>
                <div className="flex flex-wrap gap-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center gap-2 rounded-xl border px-6 py-3 transition-all ${method.ring} ${
                          isSelected ? "border-current grayscale-0" : "border-outline-variant grayscale hover:grayscale-0"
                        } ${method.accent}`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-container/20 text-primary">
                          <Icon aria-hidden="true" className="h-4 w-4" />
                        </div>
                        <span className={`text-xs font-bold ${method.accent}`}>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-stretch justify-between gap-4 border-t border-outline-variant bg-surface-container-low p-6 sm:flex-row sm:items-center sm:p-8">
              <span className="text-lg font-bold text-foreground">Total: {formatMoney(Number(budgetAmount) || 0)}</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeBoostModal}
                  className="flex-1 rounded-xl px-6 py-3 text-sm font-medium text-outline transition-colors hover:bg-surface-container-high sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLaunchCampaign}
                  disabled={launching}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-medium text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 sm:flex-none"
                >
                  {launching && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                  Launch Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

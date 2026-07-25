"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  DollarSign,
  Download,
  Eye,
  Filter,
  LineChart,
  Megaphone,
  Menu,
  MousePointerClick,
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

const analyticsCards = [
  {
    label: "Total Impressions",
    value: "142.8K",
    delta: "+12.5%",
    icon: Eye,
    iconBg: "bg-primary-container/20",
    iconColor: "text-primary",
  },
  {
    label: "Total Clicks",
    value: "12.4K",
    delta: "+8.2%",
    icon: MousePointerClick,
    iconBg: "bg-secondary-container/20",
    iconColor: "text-secondary",
  },
  {
    label: "Total Sales",
    value: "$4,120.00",
    delta: "+15.1%",
    icon: DollarSign,
    iconBg: "bg-tertiary-container/20",
    iconColor: "text-tertiary",
  },
  {
    label: "Avg. ROAS",
    value: "4.8x",
    delta: "+4.3%",
    icon: LineChart,
    iconBg: "bg-primary-container/20",
    iconColor: "text-primary",
  },
];

type CampaignBadgeType = "Featured" | "Sponsored";

const campaignTypeBadgeStyles: Record<CampaignBadgeType, string> = {
  Featured: "bg-secondary-container text-on-secondary-container",
  Sponsored: "bg-tertiary-container text-on-tertiary-container",
};

const activeCampaigns = [
  {
    id: "camp-1",
    name: "Summer Eco-Hydration",
    product: "Bamboo Water Bottle",
    emoji: "💧",
    type: "Featured" as CampaignBadgeType,
    budget: "$500.00",
    spent: "$243.10",
    status: "Active" as const,
  },
  {
    id: "camp-2",
    name: "Organic Linen Promo",
    product: "Handmade Tote Bag",
    emoji: "👜",
    type: "Sponsored" as CampaignBadgeType,
    budget: "$0.15 / click",
    spent: "$89.40",
    status: "Paused" as const,
  },
];

type EligibleProduct = {
  id: string;
  name: string;
  emoji: string;
  stock: number;
  price: number;
  highPotential?: boolean;
};

const eligibleProducts: EligibleProduct[] = [
  { id: "prod-1", name: "Artisanal Ceramic Mug", emoji: "☕", stock: 42, price: 18, highPotential: true },
  { id: "prod-2", name: "Sustainable Hemp Sneakers", emoji: "👟", stock: 12, price: 85 },
  { id: "prod-3", name: "Organic Face Serum Kit", emoji: "🧴", stock: 156, price: 45 },
];

const campaignTypeOptions = [
  { id: "Featured", label: "Featured", description: "Top of category results", icon: Star },
  { id: "Sponsored", label: "Sponsored", description: "In-feed product ads", icon: Megaphone },
  { id: "Flash Deal", label: "Flash Deal", description: "Limited time highlight", icon: Zap },
  { id: "Top Rank", label: "Top Rank", description: "Search priority boost", icon: Trophy },
] as const;

type CampaignTypeId = (typeof campaignTypeOptions)[number]["id"];

const pricingModels = [
  { id: "fixed", label: "Fixed Duration" },
  { id: "ppc", label: "Pay-Per-Click (PPC)" },
] as const;

type PricingModelId = (typeof pricingModels)[number]["id"];

const paymentMethods = [
  { id: "wallet", label: "Store Wallet", icon: Wallet, accent: "text-primary", ring: "hover:border-primary" },
  { id: "bkash", label: "bKash", icon: Smartphone, accent: "text-[#E2136E]", ring: "hover:border-[#E2136E]" },
  { id: "nagad", label: "Nagad", icon: Smartphone, accent: "text-[#ED1C24]", ring: "hover:border-[#ED1C24]" },
] as const;

type PaymentMethodId = (typeof paymentMethods)[number]["id"];

export default function VendorPromotionsPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EligibleProduct | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignTypeId>("Featured");
  const [pricingModel, setPricingModel] = useState<PricingModelId>("fixed");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("wallet");

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

  const openBoostModal = (product?: EligibleProduct) => {
    setSelectedProduct(product ?? eligibleProducts[0]);
    setIsModalOpen(true);
  };

  const closeBoostModal = () => setIsModalOpen(false);

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
                placeholder="Search campaigns, products…"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg transition-all hover:scale-[1.02] active:scale-95 sm:w-auto"
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
                    <span className="text-sm font-bold text-primary">{card.delta}</span>
                  </div>
                  <p className="mb-1 text-sm font-medium text-on-surface-variant">{card.label}</p>
                  <h3 className="text-2xl font-semibold text-foreground">{card.value}</h3>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/30 bg-white/70 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-outline-variant px-4 py-5 sm:px-6">
              <h3 className="text-lg font-semibold text-foreground">Active Campaigns</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Filter campaigns"
                  className="rounded-lg p-2 text-outline transition-colors hover:bg-surface-container"
                >
                  <Filter aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Download report"
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
                  {activeCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="group transition-colors hover:bg-surface-container-low/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-xl">
                            {campaign.emoji}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{campaign.name}</p>
                            <p className="truncate text-xs text-on-surface-variant">{campaign.product}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${campaignTypeBadgeStyles[campaign.type]}`}
                        >
                          {campaign.type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">{campaign.budget}</td>
                      <td className="whitespace-nowrap px-6 py-4">{campaign.spent}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`flex items-center gap-1.5 text-sm font-semibold ${
                            campaign.status === "Active" ? "text-primary" : "text-on-surface-variant"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              campaign.status === "Active" ? "animate-pulse bg-primary" : "bg-outline"
                            }`}
                          />
                          {campaign.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          {campaign.status === "Active" ? (
                            <button
                              type="button"
                              aria-label="Pause campaign"
                              className="rounded-lg p-2 text-outline hover:bg-surface-container"
                            >
                              <PauseCircle aria-hidden="true" className="h-5 w-5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              aria-label="Resume campaign"
                              className="rounded-lg p-2 text-primary hover:bg-surface-container"
                            >
                              <PlayCircle aria-hidden="true" className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label="Extend campaign"
                            className="rounded-lg p-2 text-primary hover:bg-surface-container"
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
              {eligibleProducts.map((product) => (
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
                    {product.emoji}
                    {product.highPotential && (
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-primary backdrop-blur-md">
                        <TrendingUp aria-hidden="true" className="h-3 w-3" /> High Potential
                      </div>
                    )}
                  </div>
                  <h4 className="mb-1 text-sm font-medium text-foreground">{product.name}</h4>
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
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={closeBoostModal}
            aria-hidden="true"
          />

          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5 sm:px-8 sm:py-6">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">Launch Boost Campaign</h3>
                <p className="truncate text-sm text-on-surface-variant">Boost: {selectedProduct.name}</p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={closeBoostModal}
                className="flex-shrink-0 rounded-full p-2 hover:bg-surface-container"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-between overflow-x-auto bg-surface-container-low px-6 py-4 sm:px-8">
              <div className="flex items-center gap-2 whitespace-nowrap font-bold text-primary">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] text-on-primary">
                  1
                </span>
                <span className="text-xs">Type</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap text-outline">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-outline text-[10px]">
                  2
                </span>
                <span className="text-xs">Pricing</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap text-outline">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-outline text-[10px]">
                  3
                </span>
                <span className="text-xs">Payment</span>
              </div>
            </div>

            <div className="custom-scrollbar space-y-8 overflow-y-auto p-6 sm:p-8">
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
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary-container text-primary">
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
                          isSelected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-outline-variant text-on-surface-variant"
                        }`}
                      >
                        {model.label}
                      </button>
                    );
                  })}
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
              <span className="text-lg font-bold text-foreground">Total: ${selectedProduct.price.toFixed(2)}</span>
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
                  onClick={closeBoostModal}
                  className="flex-1 rounded-xl bg-primary px-8 py-3 text-sm font-medium text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95 sm:flex-none"
                >
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

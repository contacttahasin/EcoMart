"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  BadgeCheck,
  Bell,
  CheckCircle2,
  Eye,
  FileText,
  Globe,
  IdCard,
  Image as ImageIcon,
  Info,
  Menu,
  Pencil,
  PlusCircle,
  RefreshCw,
  Save,
  Share2,
  ToggleRight,
  Truck,
  Undo2,
  Wallet,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";

const tabs = ["Profile", "Security", "Notifications"] as const;
type Tab = (typeof tabs)[number];

const shippingRates = [
  { id: "local", label: "Local Delivery", hint: "Within 10km", price: "$5.00" },
  { id: "standard", label: "Standard", hint: "3-5 Days", price: "$12.00" },
];

type SaveState = "idle" | "saving" | "saved";

const defaultShopName = "EcoMart Fresh Selects";
const defaultBio =
  "Premium organic produce and ethically sourced household essentials delivered with carbon-neutral shipping. Committed to transparency and local sustainability since 2021.";
const defaultReturnPolicy =
  "Items can be returned within 14 days of receipt. Products must be in original packaging and unused. Fresh produce items are eligible for returns within 24 hours only if quality is compromised.";
const defaultRefundPolicy =
  "Refunds are processed within 5-7 business days after the return is received and inspected. Store credit is available as an instant refund option.";

export default function VendorSettingsPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Profile");

  const [shopName, setShopName] = useState(defaultShopName);
  const [bio, setBio] = useState(defaultBio);
  const [returnPolicy, setReturnPolicy] = useState(defaultReturnPolicy);
  const [refundPolicy, setRefundPolicy] = useState(defaultRefundPolicy);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const handleDiscard = () => {
    setShopName(defaultShopName);
    setBio(defaultBio);
    setReturnPolicy(defaultReturnPolicy);
    setRefundPolicy(defaultRefundPolicy);
  };

  const handleSave = () => {
    if (saveState !== "idle") return;
    setSaveState("saving");
    const savedTimeout = setTimeout(() => {
      setSaveState("saved");
      const idleTimeout = setTimeout(() => setSaveState("idle"), 2000);
      timeoutsRef.current.push(idleTimeout);
    }, 1200);
    timeoutsRef.current.push(savedTimeout);
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

      <main className="min-h-screen pb-28 lg:ml-64 lg:pb-24">
        <header className="sticky top-0 z-30 flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-outline-variant bg-surface/80 px-4 py-4 shadow-md backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setIsSidebarOpen(true)}
              className="text-on-surface-variant lg:hidden"
            >
              <Menu aria-hidden="true" className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-black text-primary">Store Settings</h2>
            <div className="hidden h-6 w-px bg-outline-variant sm:block" />
            <nav className="flex gap-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap pb-1 text-sm transition-all ${
                    activeTab === tab
                      ? "border-b-2 border-primary font-bold text-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-surface-container-high/50"
            >
              <Bell aria-hidden="true" className="h-5 w-5 text-on-surface-variant" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-secondary bg-secondary-container text-sm font-bold text-on-secondary-container">
              {initials}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-10">
            {/* Section 1: Store Branding */}
            <section>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Store Branding</h3>
                  <p className="text-sm text-on-surface-variant">Define how customers perceive your brand.</p>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-6">
                <div className="group relative col-span-12 h-56 overflow-hidden rounded-3xl bg-gradient-to-br from-secondary-container/40 to-primary-container/20 sm:h-64 md:col-span-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon aria-hidden="true" className="h-12 w-12 text-primary/40" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-100 backdrop-blur-[2px] transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-6 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white hover:text-primary active:scale-95"
                    >
                      <ImageIcon aria-hidden="true" className="h-5 w-5" />
                      Change Cover
                    </button>
                  </div>
                </div>

                <div className="col-span-12 flex flex-col items-center justify-center rounded-3xl border border-white/30 bg-white/70 p-6 text-center shadow-sm backdrop-blur-md md:col-span-4">
                  <div className="group relative mb-4">
                    <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white bg-primary-container text-3xl font-bold text-on-primary-container shadow-lg">
                      {initials}
                    </div>
                    <button
                      type="button"
                      aria-label="Edit store logo"
                      className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-110"
                    >
                      <Pencil aria-hidden="true" className="h-5 w-5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Store Logo</h4>
                  <p className="mt-1 text-sm text-on-surface-variant">PNG, JPG up to 5MB</p>
                </div>

                <div className="col-span-12 grid grid-cols-1 gap-8 rounded-3xl border border-white/30 bg-white/70 p-8 shadow-sm backdrop-blur-md md:grid-cols-2">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-medium text-on-surface-variant">Shop Name</label>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(event) => setShopName(event.target.value)}
                        className="w-full rounded-2xl border border-outline-variant bg-surface px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-medium text-on-surface-variant">Store Description (Bio)</label>
                      <textarea
                        rows={4}
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        className="w-full resize-none rounded-2xl border border-outline-variant bg-surface px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-medium text-on-surface-variant">Social Media Links</label>
                      <div className="space-y-3">
                        <div className="relative">
                          <Globe
                            aria-hidden="true"
                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
                          />
                          <input
                            type="text"
                            placeholder="Website URL"
                            className="w-full rounded-2xl border border-outline-variant bg-surface py-3.5 pl-12 pr-5 outline-none transition-all focus:ring-2 focus:ring-secondary-container"
                          />
                        </div>
                        <div className="relative">
                          <AtSign
                            aria-hidden="true"
                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
                          />
                          <input
                            type="text"
                            placeholder="Instagram Handle"
                            className="w-full rounded-2xl border border-outline-variant bg-surface py-3.5 pl-12 pr-5 outline-none transition-all focus:ring-2 focus:ring-secondary-container"
                          />
                        </div>
                        <div className="relative">
                          <Share2
                            aria-hidden="true"
                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
                          />
                          <input
                            type="text"
                            placeholder="LinkedIn Profile"
                            className="w-full rounded-2xl border border-outline-variant bg-surface py-3.5 pl-12 pr-5 outline-none transition-all focus:ring-2 focus:ring-secondary-container"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Business Info & KYC */}
            <section>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Business Info &amp; KYC</h3>
                  <p className="text-sm text-on-surface-variant">Compliance and verification documents.</p>
                </div>
                <div className="flex w-fit items-center gap-2 rounded-full border border-secondary/20 bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container">
                  <BadgeCheck aria-hidden="true" className="h-[18px] w-[18px]" />
                  Verified
                </div>
              </div>
              <div className="rounded-3xl border border-white/30 bg-white/70 p-8 shadow-sm backdrop-blur-md">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface-variant">Business Registration Number</label>
                    <input
                      type="text"
                      readOnly
                      value="BR-8829-00192-X"
                      className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-3.5 outline-none focus:ring-2 focus:ring-secondary-container"
                    />
                    <p className="ml-1 text-[11px] text-primary/70">Approved on Oct 12, 2023</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface-variant">Trade License</label>
                    <div className="group flex cursor-pointer items-center justify-between rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-4 transition-all hover:border-primary">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText aria-hidden="true" className="h-8 w-8 flex-shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">Trade_License_2024.pdf</p>
                          <p className="text-[11px] text-on-surface-variant">1.4 MB • Uploaded</p>
                        </div>
                      </div>
                      <Eye
                        aria-hidden="true"
                        className="h-5 w-5 flex-shrink-0 text-on-surface-variant group-hover:text-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface-variant">NID / ID Proof</label>
                    <div className="group flex cursor-pointer items-center justify-between rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-4 transition-all hover:border-primary">
                      <div className="flex min-w-0 items-center gap-3">
                        <IdCard aria-hidden="true" className="h-8 w-8 flex-shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">Identity_Verified.png</p>
                          <p className="text-[11px] text-on-surface-variant">800 KB • Verified</p>
                        </div>
                      </div>
                      <CheckCircle2
                        aria-hidden="true"
                        className="h-5 w-5 flex-shrink-0 text-on-surface-variant group-hover:text-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Policy Configuration */}
            <section>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">Policy Configuration</h3>
                <p className="text-sm text-on-surface-variant">Set expectations for shipping and returns.</p>
              </div>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <div className="space-y-4 rounded-3xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-2 text-primary">
                      <Undo2 aria-hidden="true" className="h-5 w-5" />
                      <h4 className="text-sm font-bold">Return Policy</h4>
                    </div>
                    <textarea
                      rows={5}
                      value={returnPolicy}
                      onChange={(event) => setReturnPolicy(event.target.value)}
                      className="w-full resize-none rounded-2xl border border-outline-variant bg-surface px-5 py-4 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container"
                    />
                  </div>
                  <div className="space-y-4 rounded-3xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-2 text-primary">
                      <Wallet aria-hidden="true" className="h-5 w-5" />
                      <h4 className="text-sm font-bold">Refund Policy</h4>
                    </div>
                    <textarea
                      rows={5}
                      value={refundPolicy}
                      onChange={(event) => setRefundPolicy(event.target.value)}
                      className="w-full resize-none rounded-2xl border border-outline-variant bg-surface px-5 py-4 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-full rounded-3xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                    <div className="mb-6 flex items-center gap-2 text-primary">
                      <Truck aria-hidden="true" className="h-5 w-5" />
                      <h4 className="text-sm font-bold">Shipping Rates</h4>
                    </div>
                    <div className="space-y-4">
                      {shippingRates.map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface-container p-4"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{rate.label}</span>
                            <span className="text-xs text-on-surface-variant">{rate.hint}</span>
                          </div>
                          <div className="font-bold text-primary">{rate.price}</div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary-container/10 p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-primary">Free Shipping</span>
                          <span className="text-xs text-on-surface-variant">Over $100</span>
                        </div>
                        <ToggleRight aria-hidden="true" className="h-7 w-7 text-primary" />
                      </div>
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant py-3 text-sm font-medium text-on-surface-variant transition-all hover:border-primary hover:text-primary"
                      >
                        <PlusCircle aria-hidden="true" className="h-5 w-5" />
                        Add Rate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="mx-auto mt-4 flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-low p-6 opacity-80 sm:flex-row sm:p-8">
          <p className="text-sm text-on-surface-variant">© {new Date().getFullYear()} EcoMart Vendor Solutions</p>
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

      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 border-t border-outline-variant bg-surface/60 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:left-64 lg:px-12">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant sm:justify-start">
          <Info aria-hidden="true" className="h-5 w-5" />
          <span className="text-sm italic">Last saved 4 minutes ago</span>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex-1 rounded-full px-6 py-3.5 text-sm font-medium text-on-surface-variant transition-all hover:bg-surface-container active:scale-95 sm:flex-none sm:px-8"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState !== "idle"}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-white shadow-lg transition-all active:scale-95 disabled:active:scale-100 sm:flex-none sm:px-10 ${
              saveState === "saved" ? "bg-tertiary shadow-tertiary/20" : "bg-primary shadow-primary/20 hover:bg-primary-container"
            }`}
          >
            {saveState === "idle" && (
              <>
                <Save aria-hidden="true" className="h-5 w-5" />
                Save Changes
              </>
            )}
            {saveState === "saving" && (
              <>
                <RefreshCw aria-hidden="true" className="h-5 w-5 animate-spin" />
                Saving...
              </>
            )}
            {saveState === "saved" && (
              <>
                <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                Saved Successfully
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  BadgeCheck,
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  IdCard,
  Image as ImageIcon,
  Info,
  KeyRound,
  Laptop,
  LogOut,
  Menu,
  Pencil,
  PlusCircle,
  RefreshCw,
  Save,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Truck,
  Undo2,
  Wallet,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";
import { VendorNotificationBell } from "@/app/components/vendor/dashboard/VendorNotificationBell";
import { formatRelativeTime } from "@/lib/format";
import {
  fetchVendorBranding,
  updateVendorBranding,
  uploadVendorCoverImage,
  uploadVendorLogo,
} from "@/services/vendor.service";
import {
  fetchShippingSettings,
  fetchVendorDocuments,
  fetchVendorKyc,
  fetchVendorPolicies,
  updateShippingSettings,
  updateVendorKycNumbers,
  updateVendorPolicies,
  uploadVendorDocument,
  type ShippingRate,
  type VendorDocument,
} from "@/services/vendor-settings.service";
import {
  changePassword,
  enrollTwoFactor,
  fetchActiveSessions,
  fetchLoginActivity,
  fetchNotificationPreferences,
  listTwoFactorFactors,
  signOutOtherSessions,
  unenrollTwoFactor,
  updateNotificationPreferences,
  verifyTwoFactorEnrollment,
  type LoginActivityEntry,
  type NotificationPreferences,
  type SessionEntry,
} from "@/services/account.service";

const tabs = ["Profile", "Security", "Notifications"] as const;
type Tab = (typeof tabs)[number];

type SaveState = "idle" | "saving" | "saved";

export default function VendorSettingsPage() {
  const { vendor, isLoading, setVendorAvatar } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Profile");

  const [shopName, setShopName] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");

  const [tradeLicenseNumber, setTradeLicenseNumber] = useState("");
  const [tin, setTin] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const tradeLicenseFileRef = useRef<HTMLInputElement>(null);
  const idProofFileRef = useRef<HTMLInputElement>(null);

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");
  const [isAddingRate, setIsAddingRate] = useState(false);
  const [newRate, setNewRate] = useState({ label: "", hint: "", price: "" });

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // --- Security tab state ---
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorEnrollment, setTwoFactorEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivityEntry[]>([]);

  // --- Notifications tab state ---
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    orderUpdates: true,
    ecoTips: true,
    securityAlerts: true,
  });
  const [notificationSaving, setNotificationSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  const loadBranding = useCallback(async () => {
    if (!vendor) return;
    const [branding, kyc, docs, policies, shipping] = await Promise.all([
      fetchVendorBranding(vendor.id),
      fetchVendorKyc(vendor.id),
      fetchVendorDocuments(vendor.id),
      fetchVendorPolicies(vendor.id),
      fetchShippingSettings(vendor.id),
    ]);
    if (branding) {
      setShopName(branding.shopName);
      setBio(branding.bio);
      setLogoUrl(branding.logoUrl);
      setCoverImageUrl(branding.coverImageUrl);
      setWebsiteUrl(branding.websiteUrl);
      setInstagramHandle(branding.instagramHandle);
      setLinkedinUrl(branding.linkedinUrl);
    }
    if (kyc) {
      setTradeLicenseNumber(kyc.tradeLicenseNumber);
      setTin(kyc.tin);
      setVerificationStatus(kyc.verificationStatus);
    }
    setDocuments(docs);
    setReturnPolicy(policies.returnPolicy);
    setRefundPolicy(policies.refundPolicy);
    setShippingRates(shipping.rates);
    setFreeShippingEnabled(shipping.freeShippingEnabled);
    setFreeShippingThreshold(shipping.freeShippingThreshold !== null ? String(shipping.freeShippingThreshold) : "");
  }, [vendor?.id]);

  useEffect(() => {
    if (!vendor) return;
    let active = true;
    Promise.all([
      fetchVendorBranding(vendor.id),
      fetchVendorKyc(vendor.id),
      fetchVendorDocuments(vendor.id),
      fetchVendorPolicies(vendor.id),
      fetchShippingSettings(vendor.id),
    ]).then(([branding, kyc, docs, policies, shipping]) => {
      if (!active) return;
      if (branding) {
        setShopName(branding.shopName);
        setBio(branding.bio);
        setLogoUrl(branding.logoUrl);
        setCoverImageUrl(branding.coverImageUrl);
        setWebsiteUrl(branding.websiteUrl);
        setInstagramHandle(branding.instagramHandle);
        setLinkedinUrl(branding.linkedinUrl);
      }
      if (kyc) {
        setTradeLicenseNumber(kyc.tradeLicenseNumber);
        setTin(kyc.tin);
        setVerificationStatus(kyc.verificationStatus);
      }
      setDocuments(docs);
      setReturnPolicy(policies.returnPolicy);
      setRefundPolicy(policies.refundPolicy);
      setShippingRates(shipping.rates);
      setFreeShippingEnabled(shipping.freeShippingEnabled);
      setFreeShippingThreshold(shipping.freeShippingThreshold !== null ? String(shipping.freeShippingThreshold) : "");
    });
    return () => {
      active = false;
    };
  }, [vendor?.id]);

  useEffect(() => {
    if (!vendor) return;
    fetchNotificationPreferences(vendor.id).then((prefs) => {
      if (prefs) setNotificationPrefs(prefs);
    });
    fetchActiveSessions(vendor.id).then(setSessions);
    fetchLoginActivity(vendor.id).then(setLoginActivity);
    listTwoFactorFactors().then((factors) => setTwoFactorEnabled(factors.some((f) => f.status === "verified")));
  }, [vendor?.id]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const handleDiscard = () => {
    loadBranding();
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !vendor) return;
    const url = await uploadVendorLogo(vendor.id, file);
    setLogoUrl(url);
    setVendorAvatar(url);
  };

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !vendor) return;
    const url = await uploadVendorCoverImage(vendor.id, file);
    setCoverImageUrl(url);
  };

  const handleTradeLicenseFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !vendor) return;
    await uploadVendorDocument(vendor.id, file, "trade_license");
    setDocuments(await fetchVendorDocuments(vendor.id));
  };

  const handleIdProofFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !vendor) return;
    await uploadVendorDocument(vendor.id, file, "id_front");
    setDocuments(await fetchVendorDocuments(vendor.id));
  };

  const tradeLicenseDoc = documents.find((d) => d.docType === "trade_license");
  const idProofDoc = documents.find((d) => d.docType === "id_front");

  const handleAddRate = () => {
    if (!newRate.label.trim() || !newRate.price.trim()) return;
    const priceNumber = Number(newRate.price);
    if (Number.isNaN(priceNumber)) return;
    setShippingRates((prev) => [...prev, { id: crypto.randomUUID(), label: newRate.label, hint: newRate.hint, price: priceNumber }]);
    setNewRate({ label: "", hint: "", price: "" });
    setIsAddingRate(false);
  };

  const handleSave = () => {
    if (saveState !== "idle" || !vendor) return;
    setSaveState("saving");
    const savedTimeout = setTimeout(async () => {
      await Promise.all([
        updateVendorBranding(vendor.id, { shopName, bio, websiteUrl, instagramHandle, linkedinUrl }),
        updateVendorKycNumbers(vendor.id, { tradeLicenseNumber, tin }),
        updateVendorPolicies(vendor.id, { returnPolicy, refundPolicy }),
        updateShippingSettings(vendor.id, {
          rates: shippingRates,
          freeShippingEnabled,
          freeShippingThreshold: freeShippingThreshold.trim() ? Number(freeShippingThreshold) : null,
        }),
      ]);
      setSaveState("saved");
      setLastSavedAt(new Date());
      const idleTimeout = setTimeout(() => setSaveState("idle"), 2000);
      timeoutsRef.current.push(idleTimeout);
    }, 1200);
    timeoutsRef.current.push(savedTimeout);
  };

  const handleChangePassword = async () => {
    if (!vendor) return;
    setPasswordMessage(null);
    if (password.next !== password.confirm) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    if (password.next.length < 8) {
      setPasswordMessage("New password must be at least 8 characters.");
      return;
    }
    setPasswordSaving(true);
    try {
      const result = await changePassword(vendor.email, password.current, password.next);
      if (!result.success) {
        setPasswordMessage(result.error);
        return;
      }
      setPasswordMessage("Password updated.");
      setPassword({ current: "", next: "", confirm: "" });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleEnrollTwoFactor = async () => {
    const data = await enrollTwoFactor();
    setTwoFactorEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    setTwoFactorError(null);
  };

  const handleVerifyTwoFactor = async () => {
    if (!vendor || !twoFactorEnrollment) return;
    const result = await verifyTwoFactorEnrollment(vendor.id, twoFactorEnrollment.factorId, twoFactorCode);
    if (!result.success) {
      setTwoFactorError(result.error);
      return;
    }
    setTwoFactorEnabled(true);
    setTwoFactorEnrollment(null);
    setTwoFactorCode("");
    setTwoFactorError(null);
  };

  const handleDisableTwoFactor = async () => {
    if (!vendor) return;
    const factors = await listTwoFactorFactors();
    const verified = factors.find((f) => f.status === "verified");
    if (verified) {
      await unenrollTwoFactor(vendor.id, verified.id);
      setTwoFactorEnabled(false);
    }
  };

  const handleSignOutOthers = async () => {
    if (!vendor) return;
    await signOutOtherSessions();
    setSessions(await fetchActiveSessions(vendor.id));
  };

  const handleToggleNotification = async (key: keyof NotificationPreferences) => {
    if (!vendor) return;
    const next = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(next);
    setNotificationSaving(true);
    try {
      await updateNotificationPreferences(vendor.id, next);
    } finally {
      setNotificationSaving(false);
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
            <VendorNotificationBell buttonClassName="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-surface-container-high/50" />
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-secondary bg-secondary-container text-sm font-bold text-on-secondary-container">
              {vendor.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.avatar} alt={vendor.businessName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
          {activeTab === "Profile" && (
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
                    {coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverImageUrl} alt="Store cover" className="h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon aria-hidden="true" className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverChange}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-100 backdrop-blur-[2px] transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-6 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white hover:text-primary active:scale-95"
                      >
                        <ImageIcon aria-hidden="true" className="h-5 w-5" />
                        Change Cover
                      </button>
                    </div>
                  </div>

                  <div className="col-span-12 flex flex-col items-center justify-center rounded-3xl border border-white/30 bg-white/70 p-6 text-center shadow-sm backdrop-blur-md md:col-span-4">
                    <div className="group relative mb-4">
                      <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-primary-container text-3xl font-bold text-on-primary-container shadow-lg">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="Store logo" className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <button
                        type="button"
                        aria-label="Edit store logo"
                        onClick={() => logoInputRef.current?.click()}
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
                              value={websiteUrl}
                              onChange={(event) => setWebsiteUrl(event.target.value)}
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
                              value={instagramHandle}
                              onChange={(event) => setInstagramHandle(event.target.value)}
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
                              value={linkedinUrl}
                              onChange={(event) => setLinkedinUrl(event.target.value)}
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
                  <div
                    className={`flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                      verificationStatus === "approved"
                        ? "border-secondary/20 bg-secondary-container text-on-secondary-container"
                        : verificationStatus === "rejected"
                          ? "border-error/20 bg-error-container text-on-error-container"
                          : "border-outline-variant bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    <BadgeCheck aria-hidden="true" className="h-[18px] w-[18px]" />
                    {verificationStatus === "approved"
                      ? "Verified"
                      : verificationStatus === "rejected"
                        ? "Rejected"
                        : "Pending Review"}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/30 bg-white/70 p-8 shadow-sm backdrop-blur-md">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-on-surface-variant">Business Registration Number</label>
                      <input
                        type="text"
                        value={tradeLicenseNumber}
                        onChange={(event) => setTradeLicenseNumber(event.target.value)}
                        placeholder="TL-0000-00000-X"
                        className="w-full rounded-2xl border border-outline-variant bg-surface px-5 py-3.5 outline-none focus:border-primary focus:ring-2 focus:ring-secondary-container"
                      />
                      <label className="ml-1 mt-3 block text-sm font-medium text-on-surface-variant">TIN</label>
                      <input
                        type="text"
                        value={tin}
                        onChange={(event) => setTin(event.target.value)}
                        placeholder="000000000"
                        className="w-full rounded-2xl border border-outline-variant bg-surface px-5 py-3.5 outline-none focus:border-primary focus:ring-2 focus:ring-secondary-container"
                      />
                      <label className="ml-1 mt-3 block text-sm font-medium text-on-surface-variant">Trade License Document</label>
                      <input ref={tradeLicenseFileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleTradeLicenseFile} />
                      <button
                        type="button"
                        onClick={() => tradeLicenseFileRef.current?.click()}
                        className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-4 text-left transition-all hover:border-primary"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <IdCard aria-hidden="true" className="h-8 w-8 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {tradeLicenseDoc ? tradeLicenseDoc.filePath.split("/").pop() : "Upload trade license"}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">
                              {tradeLicenseDoc ? `${tradeLicenseDoc.status} • ${formatRelativeTime(tradeLicenseDoc.uploadedAt)}` : "No file uploaded"}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2
                          aria-hidden="true"
                          className={`h-5 w-5 shrink-0 ${tradeLicenseDoc ? "text-primary" : "text-on-surface-variant group-hover:text-primary"}`}
                        />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-on-surface-variant">NID / ID Proof</label>
                      <input ref={idProofFileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleIdProofFile} />
                      <button
                        type="button"
                        onClick={() => idProofFileRef.current?.click()}
                        className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-4 text-left transition-all hover:border-primary"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <IdCard aria-hidden="true" className="h-8 w-8 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {idProofDoc ? idProofDoc.filePath.split("/").pop() : "Upload ID proof"}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">
                              {idProofDoc ? `${idProofDoc.status} • ${formatRelativeTime(idProofDoc.uploadedAt)}` : "No file uploaded"}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2
                          aria-hidden="true"
                          className={`h-5 w-5 shrink-0 ${idProofDoc ? "text-primary" : "text-on-surface-variant group-hover:text-primary"}`}
                        />
                      </button>
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
                        placeholder="Describe your return policy…"
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
                        placeholder="Describe your refund policy…"
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
                            <div className="font-bold text-primary">${rate.price.toFixed(2)}</div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setFreeShippingEnabled((prev) => !prev)}
                          className="flex w-full items-center justify-between rounded-2xl border border-primary/20 bg-primary-container/10 p-4 text-left"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-primary">Free Shipping</span>
                            <input
                              type="text"
                              value={freeShippingThreshold}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => setFreeShippingThreshold(event.target.value)}
                              placeholder="Threshold ($)"
                              className="mt-1 w-24 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-xs outline-none"
                            />
                          </div>
                          {freeShippingEnabled ? (
                            <ToggleRight aria-hidden="true" className="h-7 w-7 text-primary" />
                          ) : (
                            <ToggleLeft aria-hidden="true" className="h-7 w-7 text-on-surface-variant" />
                          )}
                        </button>
                        {isAddingRate ? (
                          <div className="space-y-2 rounded-2xl border border-outline-variant bg-surface-container p-4">
                            <input
                              value={newRate.label}
                              onChange={(event) => setNewRate((prev) => ({ ...prev, label: event.target.value }))}
                              placeholder="Label (e.g. Express)"
                              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm outline-none"
                            />
                            <input
                              value={newRate.hint}
                              onChange={(event) => setNewRate((prev) => ({ ...prev, hint: event.target.value }))}
                              placeholder="Hint (e.g. 1-2 Days)"
                              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm outline-none"
                            />
                            <input
                              value={newRate.price}
                              onChange={(event) => setNewRate((prev) => ({ ...prev, price: event.target.value }))}
                              placeholder="Price"
                              type="number"
                              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleAddRate}
                                className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsAddingRate(false)}
                                className="flex-1 rounded-lg border border-outline-variant py-2 text-sm font-medium text-on-surface-variant"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsAddingRate(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant py-3 text-sm font-medium text-on-surface-variant transition-all hover:border-primary hover:text-primary"
                          >
                            <PlusCircle aria-hidden="true" className="h-5 w-5" />
                            Add Rate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "Security" && (
            <div className="flex flex-col gap-10">
              <section>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground">Change Password</h3>
                  <p className="text-sm text-on-surface-variant">Update the password used to sign in.</p>
                </div>
                <div className="space-y-4 rounded-3xl border border-white/30 bg-white/70 p-8 shadow-sm backdrop-blur-md">
                  {passwordMessage && <p className="text-sm text-primary">{passwordMessage}</p>}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <input
                      type="password"
                      value={password.current}
                      onChange={(event) => setPassword((prev) => ({ ...prev, current: event.target.value }))}
                      placeholder="Current password"
                      className="rounded-2xl border border-outline-variant bg-surface px-5 py-3.5 outline-none focus:border-primary focus:ring-2 focus:ring-secondary-container"
                    />
                    <input
                      type="password"
                      value={password.next}
                      onChange={(event) => setPassword((prev) => ({ ...prev, next: event.target.value }))}
                      placeholder="New password"
                      className="rounded-2xl border border-outline-variant bg-surface px-5 py-3.5 outline-none focus:border-primary focus:ring-2 focus:ring-secondary-container"
                    />
                    <input
                      type="password"
                      value={password.confirm}
                      onChange={(event) => setPassword((prev) => ({ ...prev, confirm: event.target.value }))}
                      placeholder="Confirm new password"
                      className="rounded-2xl border border-outline-variant bg-surface px-5 py-3.5 outline-none focus:border-primary focus:ring-2 focus:ring-secondary-container"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={passwordSaving}
                    className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-md disabled:opacity-50"
                  >
                    <KeyRound aria-hidden="true" className="h-4 w-4" />
                    Update Password
                  </button>
                </div>
              </section>

              <section>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground">Two-Factor Authentication</h3>
                  <p className="text-sm text-on-surface-variant">Add an authenticator app for extra login security.</p>
                </div>
                <div className="space-y-4 rounded-3xl border border-white/30 bg-white/70 p-8 shadow-sm backdrop-blur-md">
                  {twoFactorEnabled ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary">
                        <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                        <span className="text-sm font-medium">Two-factor authentication is enabled</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisableTwoFactor}
                        className="rounded-full border border-error/30 px-4 py-2 text-sm font-medium text-error"
                      >
                        Disable
                      </button>
                    </div>
                  ) : twoFactorEnrollment ? (
                    <div className="space-y-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={twoFactorEnrollment.qrCode} alt="2FA QR code" className="h-40 w-40 rounded-xl border border-outline-variant" />
                      <p className="text-xs text-on-surface-variant">Secret: {twoFactorEnrollment.secret}</p>
                      {twoFactorError && <p className="text-sm text-error">{twoFactorError}</p>}
                      <div className="flex gap-2">
                        <input
                          value={twoFactorCode}
                          onChange={(event) => setTwoFactorCode(event.target.value)}
                          placeholder="6-digit code"
                          className="rounded-2xl border border-outline-variant bg-surface px-5 py-2.5 text-sm outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyTwoFactor}
                          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnrollTwoFactor}
                      className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-md"
                    >
                      <Shield aria-hidden="true" className="h-4 w-4" />
                      Enable Two-Factor Authentication
                    </button>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Active Sessions</h3>
                    <p className="text-sm text-on-surface-variant">Devices currently signed in to your account.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOutOthers}
                    className="flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
                  >
                    <LogOut aria-hidden="true" className="h-4 w-4" />
                    Sign Out Other Sessions
                  </button>
                </div>
                <div className="space-y-3 rounded-3xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                  {sessions.length === 0 && <p className="text-sm text-on-surface-variant">No active sessions.</p>}
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4">
                      {session.device === "Mobile" ? (
                        <Smartphone aria-hidden="true" className="h-5 w-5 text-primary" />
                      ) : (
                        <Laptop aria-hidden="true" className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {session.browser} on {session.device}
                        </p>
                        <p className="text-xs text-on-surface-variant">Active {formatRelativeTime(session.last_active_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground">Recent Login Activity</h3>
                </div>
                <div className="space-y-3 rounded-3xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                  {loginActivity.length === 0 && <p className="text-sm text-on-surface-variant">No login activity yet.</p>}
                  {loginActivity.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low p-4">
                      <div className="flex items-center gap-3">
                        <Clock aria-hidden="true" className="h-5 w-5 text-on-surface-variant" />
                        <span className="text-sm text-foreground">{entry.success ? "Successful login" : "Failed login attempt"}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{formatRelativeTime(entry.created_at)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Notification Preferences</h3>
                <p className="text-sm text-on-surface-variant">Choose what you want to be notified about.</p>
              </div>
              <div className="space-y-4 rounded-3xl border border-white/30 bg-white/70 p-8 shadow-sm backdrop-blur-md">
                {(
                  [
                    { key: "orderUpdates" as const, label: "Order Updates", hint: "New orders and status changes" },
                    { key: "ecoTips" as const, label: "Platform Tips", hint: "Best practices and platform news" },
                    { key: "securityAlerts" as const, label: "Security Alerts", hint: "New sign-ins and account changes" },
                  ]
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggleNotification(item.key)}
                    disabled={notificationSaving}
                    className="flex w-full items-center justify-between rounded-2xl border border-outline-variant bg-surface-container-low p-5 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Bell aria-hidden="true" className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-on-surface-variant">{item.hint}</p>
                      </div>
                    </div>
                    {notificationPrefs[item.key] ? (
                      <ToggleRight aria-hidden="true" className="h-7 w-7 text-primary" />
                    ) : (
                      <ToggleLeft aria-hidden="true" className="h-7 w-7 text-on-surface-variant" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
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

      {activeTab === "Profile" && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 border-t border-outline-variant bg-surface/60 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:left-64 lg:px-12">
          <div className="flex items-center justify-center gap-2 text-on-surface-variant sm:justify-start">
            <Info aria-hidden="true" className="h-5 w-5" />
            <span className="text-sm italic">
              {lastSavedAt ? `Last saved ${formatRelativeTime(lastSavedAt.toISOString())}` : "Not saved yet"}
            </span>
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
      )}
    </div>
  );
}

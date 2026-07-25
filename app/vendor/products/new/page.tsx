"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Bold,
  CheckCircle2,
  History,
  Image as ImageIcon,
  Info,
  Italic,
  Layers,
  Lightbulb,
  Link2,
  List,
  Menu,
  PlayCircle,
  Plus,
  PlusCircle,
  Redo2,
  Search,
  Send,
  Trash2,
  Undo2,
  UploadCloud,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";

const steps = [
  { id: "basic-info", label: "Basic Info", hint: "Identity & Details", icon: Info },
  { id: "media", label: "Media", hint: "Gallery & Video", icon: ImageIcon },
  { id: "variants", label: "Variants", hint: "Attributes & Stock", icon: Layers },
  { id: "seo", label: "SEO", hint: "Search Optimization", icon: Search },
];

type UploadedImage = { id: string; url: string; name: string; isBlob: boolean };

type VariantRow = { id: string; tags: string[]; price: string; stock: string; sku: string };

const initialVariants: VariantRow[] = [
  { id: "v1", tags: ["Size: Queen", "Color: Sage"], price: "129.00", stock: "45", sku: "ECO-BAM-001-QS" },
  { id: "v2", tags: ["Size: King", "Color: Sage"], price: "149.00", stock: "22", sku: "ECO-BAM-001-KS" },
];

const toolbarIcons = [Bold, Italic, List, Link2];

export default function NewProductPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(steps[0].id);
  const [images, setImages] = useState<UploadedImage[]>([
    { id: "seed", url: "", name: "Main product photo", isBlob: false },
  ]);
  const [variants, setVariants] = useState<VariantRow[]>(initialVariants);
  const [metaTitle, setMetaTitle] = useState("Organic Bamboo Bed Sheets | Sustainable Home | EcoMart");
  const [metaDescription, setMetaDescription] = useState(
    "Experience unparalleled comfort with our GOTS certified organic bamboo sheets. Sustainably sourced, breathable, and naturally hypoallergenic..."
  );
  const [urlSlug, setUrlSlug] = useState("organic-bamboo-bed-sheets");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveStep(entry.target.id);
          }
        });
      },
      { root: null, threshold: 0.5 }
    );

    steps.forEach((step) => {
      const el = document.getElementById(step.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleStepClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveStep(id);
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const newImages: UploadedImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name,
      isBlob: true,
    }));
    setImages((prev) => [...prev, ...newImages]);
    event.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.isBlob) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  if (isLoading || !vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">Loading…</p>
      </div>
    );
  }

  const initials = vendor.businessName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const activeStepIndex = steps.findIndex((step) => step.id === activeStep);
  const completionPct = Math.round(((activeStepIndex + 1) / steps.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <VendorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex w-full items-center justify-between gap-3 border-b border-outline-variant bg-surface/80 px-4 py-4 shadow-md backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setIsSidebarOpen(true)}
              className="text-on-surface-variant lg:hidden"
            >
              <Menu aria-hidden="true" className="h-6 w-6" />
            </button>
            <Link
              href="/vendor/dashboard"
              aria-label="Back to dashboard"
              className="flex items-center justify-center rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container"
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </Link>
            <h2 className="hidden text-lg font-black text-primary sm:block sm:text-xl">EcoMart Admin</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden lg:block">
              <input
                type="text"
                placeholder="Search product IDs…"
                className="w-64 rounded-full border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-sm outline-none transition-all duration-300 focus:w-80"
              />
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              />
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-full p-2 transition-all hover:bg-surface-container-high/50"
            >
              <Bell aria-hidden="true" className="h-5 w-5 text-on-surface-variant" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-surface bg-error" />
            </button>
            <div className="mx-1 hidden h-8 w-px bg-outline-variant sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-foreground">{vendor.businessName}</p>
                <p className="text-[10px] uppercase tracking-wider text-outline">Premium Vendor</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-secondary-container bg-secondary-container text-sm font-bold text-on-secondary-container">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <nav className="mb-2 flex gap-2 text-xs text-outline">
                <span>Catalog</span>
                <span>/</span>
                <span>Products</span>
                <span>/</span>
                <span className="font-bold text-primary">New Product</span>
              </nav>
              <h1 className="mb-2 text-2xl font-semibold text-foreground sm:text-3xl">Create New Product</h1>
              <p className="max-w-xl text-on-surface-variant">
                Fill in the details below to add a new sustainable item to your shop catalog. High-quality media and
                SEO details help visibility.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <button
                type="button"
                className="rounded-full border border-primary px-6 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary/5 active:scale-95"
              >
                Save Draft
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary-container active:scale-95"
              >
                <Send aria-hidden="true" className="h-[18px] w-[18px]" />
                Publish Product
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 items-start gap-6 lg:gap-8">
            <aside className="col-span-12 md:sticky md:top-24 md:col-span-3">
              <div className="space-y-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                <h3 className="text-xs uppercase tracking-widest text-outline">Product Setup</h3>
                <div className="flex gap-3 overflow-x-auto md:block md:space-y-4 md:overflow-visible">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = step.id === activeStep;
                    return (
                      <div key={step.id} className="flex flex-shrink-0 flex-col md:contents">
                        <button
                          type="button"
                          onClick={() => handleStepClick(step.id)}
                          className={`group flex items-center gap-4 text-left transition-colors ${
                            isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              isActive
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-outline-variant group-hover:border-primary"
                            }`}
                          >
                            <Icon aria-hidden="true" className="h-5 w-5" />
                          </div>
                          <div className="hidden md:block">
                            <p className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>{step.label}</p>
                            <p className="text-[11px] text-outline">{step.hint}</p>
                          </div>
                        </button>
                        {index < steps.length - 1 && (
                          <div className="ml-5 hidden h-6 w-0.5 bg-outline-variant/50 md:block" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-outline-variant pt-6">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Profile Completion</span>
                    <span className="font-bold text-primary">{completionPct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
              </div>
            </aside>

            <div className="col-span-12 space-y-6 md:col-span-9 lg:space-y-8">
              <section
                id="basic-info"
                className="scroll-mt-24 rounded-3xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:p-8"
              >
                <div className="mb-8 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                    1
                  </span>
                  <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-foreground">
                      Product Title <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Organic Bamboo Bed Sheets"
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-foreground">
                      SKU <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ECO-BAM-001"
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-2 block text-sm font-bold text-foreground">Description</label>
                    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
                      <div className="flex gap-1 border-b border-outline-variant bg-surface-container p-2">
                        {toolbarIcons.map((ToolIcon, i) => (
                          <button
                            key={i}
                            type="button"
                            className="rounded p-1.5 transition-colors hover:bg-surface-container-highest"
                          >
                            <ToolIcon aria-hidden="true" className="h-4 w-4" />
                          </button>
                        ))}
                        <div className="mx-1 w-px bg-outline-variant" />
                        <button type="button" className="rounded p-1.5 transition-colors hover:bg-surface-container-highest">
                          <Undo2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded p-1.5 transition-colors hover:bg-surface-container-highest">
                          <Redo2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        placeholder="Describe the eco-friendly materials, sourcing, and benefits..."
                        rows={6}
                        className="w-full resize-none border-none bg-transparent p-4 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-foreground">Category</label>
                    <select className="w-full cursor-pointer appearance-none rounded-xl border border-outline-variant bg-surface-container-low p-3 focus:outline-none focus:ring-2 focus:ring-secondary-container">
                      <option>Select Category</option>
                      <option>Home &amp; Living</option>
                      <option>Apparel</option>
                      <option>Beauty &amp; Health</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-foreground">Sub-category</label>
                    <select className="w-full cursor-pointer appearance-none rounded-xl border border-outline-variant bg-surface-container-low p-3 focus:outline-none focus:ring-2 focus:ring-secondary-container">
                      <option>Select Sub-category</option>
                      <option>Bedding</option>
                      <option>Kitchenware</option>
                      <option>Bath</option>
                    </select>
                  </div>
                </div>
              </section>

              <section
                id="media"
                className="scroll-mt-24 rounded-3xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:p-8"
              >
                <div className="mb-8 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                    2
                  </span>
                  <h2 className="text-xl font-semibold text-foreground">Product Media</h2>
                </div>
                <div className="space-y-6">
                  <div className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-outline-variant p-8 text-center transition-colors hover:border-primary sm:p-12">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container/30 transition-transform group-hover:scale-110">
                      <UploadCloud aria-hidden="true" className="h-8 w-8 text-primary" />
                    </div>
                    <p className="mb-1 font-bold text-foreground">Click or drag images here to upload</p>
                    <p className="text-sm text-outline">
                      Upload up to 10 high-resolution images. Recommended size: 1200x1200px.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFilesSelected}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-outline-variant bg-surface-container"
                      >
                        {image.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary-container/40 to-primary-container/20">
                            <ImageIcon aria-hidden="true" className="h-6 w-6 text-primary/60" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            aria-label="Remove image"
                            className="rounded-full bg-white p-1.5 text-error"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                        {index === 0 && (
                          <div className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Add image"
                      className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low text-outline transition-colors hover:border-primary hover:text-primary"
                    >
                      <Plus aria-hidden="true" className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="border-t border-outline-variant pt-6">
                    <label className="mb-2 block text-sm font-bold text-foreground">Video Embed URL (Optional)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 focus:outline-none focus:ring-2 focus:ring-secondary-container"
                        />
                        <PlayCircle
                          aria-hidden="true"
                          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
                        />
                      </div>
                      <button
                        type="button"
                        className="flex-shrink-0 rounded-xl bg-surface-container px-4 py-3 font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section
                id="variants"
                className="scroll-mt-24 rounded-3xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:p-8"
              >
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                      3
                    </span>
                    <h2 className="text-xl font-semibold text-foreground">Product Variants</h2>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-primary transition-all hover:bg-primary/5"
                  >
                    <Plus aria-hidden="true" className="h-5 w-5" />
                    Add Attribute
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="whitespace-nowrap rounded-tl-xl p-4 text-xs text-outline">Variant Name</th>
                        <th className="whitespace-nowrap p-4 text-xs text-outline">Price (৳)</th>
                        <th className="whitespace-nowrap p-4 text-xs text-outline">Stock</th>
                        <th className="whitespace-nowrap p-4 text-xs text-outline">SKU</th>
                        <th className="whitespace-nowrap rounded-tr-xl p-4 text-xs text-outline">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {variants.map((variant) => (
                        <tr key={variant.id} className="transition-colors hover:bg-surface-container-lowest">
                          <td className="whitespace-nowrap p-4">
                            <div className="flex items-center gap-2">
                              {variant.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md bg-secondary-container/30 px-2 py-1 text-xs font-bold text-secondary"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              defaultValue={variant.price}
                              className="w-24 rounded-lg border border-outline-variant p-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              defaultValue={variant.stock}
                              className="w-20 rounded-lg border border-outline-variant p-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              defaultValue={variant.sku}
                              className="w-32 rounded-lg border border-outline-variant p-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                            />
                          </td>
                          <td className="whitespace-nowrap p-4">
                            <button
                              type="button"
                              onClick={() => removeVariant(variant.id)}
                              aria-label="Remove variant"
                              className="p-2 text-outline transition-colors hover:text-error"
                            >
                              <Trash2 aria-hidden="true" className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-outline-variant p-4">
                  <button
                    type="button"
                    className="mx-auto flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
                  >
                    <PlusCircle aria-hidden="true" className="h-[18px] w-[18px]" />
                    Generate all combinations
                  </button>
                </div>
              </section>

              <section
                id="seo"
                className="scroll-mt-24 rounded-3xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:p-8"
              >
                <div className="mb-8 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                    4
                  </span>
                  <h2 className="text-xl font-semibold text-foreground">Search Engine Optimization</h2>
                </div>
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-foreground">Meta Title</label>
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(event) => setMetaTitle(event.target.value)}
                        className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 focus:outline-none focus:ring-2 focus:ring-secondary-container"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-outline">
                        <span>Focus keyword: Bamboo Sheets</span>
                        <span>{metaTitle.length} / 60 characters</span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-foreground">Meta Description</label>
                      <textarea
                        value={metaDescription}
                        onChange={(event) => setMetaDescription(event.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container-low p-3 focus:outline-none focus:ring-2 focus:ring-secondary-container"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-outline">
                        <span>Recommended: 150-160 chars</span>
                        <span>{metaDescription.length} / 160 characters</span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-foreground">URL Slug</label>
                      <div className="flex items-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                        <span className="whitespace-nowrap border-r border-outline-variant bg-surface-container-high px-4 py-3 text-sm text-outline">
                          ecomart.com/p/
                        </span>
                        <input
                          type="text"
                          value={urlSlug}
                          onChange={(event) => setUrlSlug(event.target.value)}
                          className="flex-grow border-none bg-transparent p-3 text-sm focus:outline-none focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-inner">
                    <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-outline">
                      Google Search Preview
                    </h4>
                    <div className="space-y-2">
                      <p className="truncate text-sm font-medium leading-tight text-[#1a0dab]">{metaTitle}</p>
                      <p className="truncate text-xs text-[#006621]">{`https://ecomart.com/p/${urlSlug}`}</p>
                      <p className="text-[13px] leading-relaxed text-on-surface-variant">{metaDescription}</p>
                    </div>
                    <div className="mt-10 flex gap-4 rounded-xl border border-secondary-container/20 bg-secondary-container/10 p-4">
                      <Lightbulb aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-secondary" />
                      <div>
                        <p className="text-xs font-bold text-secondary">SEO Tip</p>
                        <p className="text-[11px] text-on-surface-variant">
                          Adding &quot;Eco-friendly&quot; or &quot;Sustainable&quot; to your title can increase
                          click-through rates by up to 15% for your target audience.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-4 rounded-3xl border border-primary/20 bg-surface-container-lowest/80 p-6 shadow-xl shadow-primary/5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-outline">
                  <History aria-hidden="true" className="h-[18px] w-[18px]" />
                  <span className="text-xs">Last auto-saved 2 mins ago</span>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push("/vendor/dashboard")}
                    className="rounded-full border border-outline-variant px-8 py-3 font-bold text-on-surface-variant transition-all hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-full bg-primary px-10 py-3 font-bold text-on-primary shadow-lg transition-all hover:shadow-primary/30"
                  >
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                    Save &amp; List Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-low p-6 sm:flex-row sm:p-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-primary">EcoMart Vendor Solutions</span>
            <span className="text-xs text-outline">|</span>
            <p className="text-sm text-on-surface-variant">© {new Date().getFullYear()} EcoMart</p>
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
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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
  Loader2,
  Menu,
  PlayCircle,
  Plus,
  PlusCircle,
  Search,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { VendorSidebar } from "@/app/components/vendor/dashboard/VendorSidebar";
import { VendorNotificationBell } from "@/app/components/vendor/dashboard/VendorNotificationBell";
import { formatRelativeTime } from "@/lib/format";
import { slugify } from "@/services/vendor.service";
import {
  fetchTopLevelCategories,
  findOrCreateSubcategory,
  generateUniqueProductSlug,
  replaceProductImages,
  replaceProductVariants,
  saveProduct,
  uploadProductImage,
  type CategoryOption,
} from "@/services/product-management.service";

const steps = [
  { id: "basic-info", label: "Basic Info", hint: "Identity & Details", icon: Info },
  { id: "media", label: "Media", hint: "Gallery & Video", icon: ImageIcon },
  { id: "variants", label: "Variants", hint: "Attributes & Stock", icon: Layers },
  { id: "seo", label: "SEO", hint: "Search Optimization", icon: Search },
];

type UploadedImage = { id: string; url: string; isUploading: boolean };
type VariantRow = { id: string; tags: string[]; price: string; stock: string; sku: string };
type AttributeGroup = { id: string; name: string; valuesText: string };

function wrapSelection(text: string, start: number, end: number, before: string, after: string) {
  return text.slice(0, start) + before + text.slice(start, end) + after + text.slice(end);
}

/** Cartesian product across every attribute group's comma-separated values. */
function generateCombinations(groups: AttributeGroup[]): string[][] {
  const valueLists = groups
    .map((group) => ({
      name: group.name.trim(),
      values: group.valuesText
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    }))
    .filter((group) => group.name && group.values.length > 0);

  if (valueLists.length === 0) return [];

  return valueLists.reduce<string[][]>(
    (acc, group) => acc.flatMap((combo) => group.values.map((value) => [...combo, `${group.name}: ${value}`])),
    [[]]
  );
}

export default function NewProductPage() {
  const { vendor, isLoading } = useVendorAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(steps[0].id);
  const [productId] = useState(() => crypto.randomUUID());

  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoConfirmed, setVideoConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrValues, setNewAttrValues] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([]);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaTitleTouched, setMetaTitleTouched] = useState(false);
  const [metaDescription, setMetaDescription] = useState("");
  const [urlSlug, setUrlSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/vendor/login");
    }
  }, [isLoading, vendor, router]);

  useEffect(() => {
    fetchTopLevelCategories().then(setCategories);
  }, []);

  const [prevTitleForMeta, setPrevTitleForMeta] = useState(title);
  if (title !== prevTitleForMeta) {
    setPrevTitleForMeta(title);
    if (!metaTitleTouched) setMetaTitle(title);
    if (!slugTouched) setUrlSlug(slugify(title));
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveStep(entry.target.id);
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

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!vendor || files.length === 0) return;

    const placeholders = files.map((file) => ({ id: crypto.randomUUID(), file }));
    setImages((prev) => [...prev, ...placeholders.map(({ id }) => ({ id, url: "", isUploading: true }))]);

    for (const { id, file } of placeholders) {
      try {
        const url = await uploadProductImage(vendor.id, productId, file, images.length);
        setImages((prev) => prev.map((img) => (img.id === id ? { id, url, isUploading: false } : img)));
      } catch {
        setImages((prev) => prev.filter((img) => img.id !== id));
        setFormError("One of the images failed to upload. Please try again.");
      }
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAddVideo = () => {
    setVideoConfirmed(/^https?:\/\/.+/.test(videoUrl.trim()));
  };

  const handleAddAttribute = () => {
    if (!newAttrName.trim() || !newAttrValues.trim()) return;
    setAttributeGroups((prev) => [...prev, { id: crypto.randomUUID(), name: newAttrName, valuesText: newAttrValues }]);
    setNewAttrName("");
    setNewAttrValues("");
  };

  const removeAttributeGroup = (id: string) => {
    setAttributeGroups((prev) => prev.filter((group) => group.id !== id));
  };

  const handleGenerateCombinations = () => {
    const combos = generateCombinations(attributeGroups);
    if (combos.length === 0) return;
    setVariants(
      combos.map((tags, index) => ({
        id: crypto.randomUUID(),
        tags,
        price: "0.00",
        stock: "0",
        sku: sku ? `${sku}-${index + 1}` : `VAR-${index + 1}`,
      }))
    );
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  const updateVariantField = (id: string, field: "price" | "stock" | "sku", value: string) => {
    setVariants((prev) => prev.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant)));
  };

  const applyDescriptionFormat = (before: string, after: string) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const next = wrapSelection(description, selectionStart, selectionEnd, before, after);
    setDescription(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + before.length, selectionEnd + before.length);
    });
  };

  const applyListFormat = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = description.slice(selectionStart, selectionEnd) || "List item";
    const formatted = selected
      .split("\n")
      .map((line) => `- ${line}`)
      .join("\n");
    setDescription(description.slice(0, selectionStart) + formatted + description.slice(selectionEnd));
  };

  const persistProduct = async (status: "draft" | "pending_review" | "active"): Promise<boolean> => {
    if (!vendor) return false;

    if (!title.trim() || !sku.trim()) {
      setFormError("Product Title and SKU are required.");
      return false;
    }

    setFormError(null);
    setSaveState("saving");

    try {
      let subcategoryId: string | null = null;
      if (categoryId && subcategoryName.trim()) {
        subcategoryId = await findOrCreateSubcategory(categoryId, subcategoryName);
      }

      const slug = await generateUniqueProductSlug(urlSlug || title, vendor.id);

      await saveProduct({
        id: productId,
        vendorId: vendor.id,
        title: title.trim(),
        sku: sku.trim(),
        description,
        categoryId: categoryId || null,
        subcategoryId,
        videoUrl,
        metaTitle,
        metaDescription,
        slug,
        status,
      });

      await replaceProductImages(
        productId,
        images
          .filter((image) => !image.isUploading && image.url)
          .map((image, index) => ({ url: image.url, isPrimary: index === 0 }))
      );

      await replaceProductVariants(
        productId,
        attributeGroups.length > 0
          ? [
              {
                name: attributeGroups.map((g) => g.name).join(" / "),
                options: variants.map((variant) => ({
                  value: variant.tags.join(", "),
                  priceDelta: Number(variant.price) || 0,
                  stock: Number(variant.stock) || 0,
                  sku: variant.sku,
                })),
              },
            ]
          : []
      );

      setSaveState("saved");
      setLastSavedAt(new Date().toISOString());
      setTimeout(() => setSaveState("idle"), 2500);
      return true;
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong saving the product.");
      setSaveState("idle");
      return false;
    }
  };

  const handleSaveDraft = () => {
    void persistProduct("draft");
  };

  const handlePublish = async () => {
    const success = await persistProduct("active");
    if (success) router.push("/vendor/dashboard");
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
            <VendorNotificationBell buttonClassName="relative rounded-full p-2 transition-all hover:bg-surface-container-high/50" />
            <div className="mx-1 hidden h-8 w-px bg-outline-variant sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-foreground">{vendor.businessName}</p>
                <p className="text-[10px] uppercase tracking-wider text-outline">Premium Vendor</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-secondary-container bg-secondary-container text-sm font-bold text-on-secondary-container">
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
                onClick={handleSaveDraft}
                disabled={saveState === "saving"}
                className="rounded-full border border-primary px-6 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary/5 active:scale-95 disabled:opacity-60"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={saveState === "saving"}
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary-container active:scale-95 disabled:opacity-60"
              >
                {saveState === "saving" ? (
                  <Loader2 aria-hidden="true" className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <Send aria-hidden="true" className="h-4.5 w-4.5" />
                )}
                Publish Product
              </button>
            </div>
          </div>

          {formError && (
            <p role="alert" className="mb-6 rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-12 items-start gap-6 lg:gap-8">
            <aside className="col-span-12 md:sticky md:top-24 md:col-span-3">
              <div className="space-y-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                <h3 className="text-xs uppercase tracking-widest text-outline">Product Setup</h3>
                <div className="flex gap-3 overflow-x-auto md:block md:space-y-4 md:overflow-visible">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = step.id === activeStep;
                    return (
                      <div key={step.id} className="flex shrink-0 flex-col md:contents">
                        <button
                          type="button"
                          onClick={() => handleStepClick(step.id)}
                          className={`group flex items-center gap-4 text-left transition-colors ${
                            isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
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
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
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
                      value={sku}
                      onChange={(event) => setSku(event.target.value)}
                      placeholder="ECO-BAM-001"
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-2 block text-sm font-bold text-foreground">Description</label>
                    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
                      <div className="flex gap-1 border-b border-outline-variant bg-surface-container p-2">
                        <button
                          type="button"
                          onClick={() => applyDescriptionFormat("**", "**")}
                          className="rounded p-1.5 transition-colors hover:bg-surface-container-highest"
                        >
                          <Bold aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyDescriptionFormat("_", "_")}
                          className="rounded p-1.5 transition-colors hover:bg-surface-container-highest"
                        >
                          <Italic aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={applyListFormat}
                          className="rounded p-1.5 transition-colors hover:bg-surface-container-highest"
                        >
                          <List aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyDescriptionFormat("[", "](https://)")}
                          className="rounded p-1.5 transition-colors hover:bg-surface-container-highest"
                        >
                          <Link2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        ref={descriptionRef}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Describe the eco-friendly materials, sourcing, and benefits..."
                        rows={6}
                        className="w-full resize-none border-none bg-transparent p-4 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-foreground">Category</label>
                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-xl border border-outline-variant bg-surface-container-low p-3 focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-foreground">Sub-category</label>
                    <input
                      type="text"
                      value={subcategoryName}
                      onChange={(event) => setSubcategoryName(event.target.value)}
                      disabled={!categoryId}
                      placeholder={categoryId ? "e.g. Bedding" : "Select a category first"}
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary-container disabled:cursor-not-allowed disabled:opacity-60"
                    />
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
                        {image.isUploading ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-primary/60" />
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image.url} alt="" className="h-full w-full object-cover" />
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
                        {index === 0 && !image.isUploading && (
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
                      <div className="relative grow">
                        <input
                          type="text"
                          value={videoUrl}
                          onChange={(event) => {
                            setVideoUrl(event.target.value);
                            setVideoConfirmed(false);
                          }}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 focus:outline-none focus:ring-2 focus:ring-secondary-container"
                        />
                        {videoConfirmed ? (
                          <CheckCircle2
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary"
                          />
                        ) : (
                          <PlayCircle
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVideo}
                        className="shrink-0 rounded-xl bg-surface-container px-4 py-3 font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high"
                      >
                        Add
                      </button>
                    </div>
                    {videoUrl && !videoConfirmed && (
                      <p className="mt-1.5 text-xs text-outline">Enter a valid http(s) URL, then click Add.</p>
                    )}
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
                </div>

                <div className="mb-6 space-y-3 rounded-2xl border border-dashed border-outline-variant p-4">
                  <p className="text-sm font-bold text-foreground">Attributes</p>
                  {attributeGroups.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attributeGroups.map((group) => (
                        <span
                          key={group.id}
                          className="flex items-center gap-2 rounded-full bg-secondary-container/30 px-3 py-1 text-xs font-bold text-secondary"
                        >
                          {group.name}: {group.valuesText}
                          <button type="button" onClick={() => removeAttributeGroup(group.id)} aria-label={`Remove ${group.name}`}>
                            <Trash2 aria-hidden="true" className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={newAttrName}
                      onChange={(event) => setNewAttrName(event.target.value)}
                      placeholder="Attribute (e.g. Size)"
                      className="w-full rounded-lg border border-outline-variant p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container sm:w-40"
                    />
                    <input
                      type="text"
                      value={newAttrValues}
                      onChange={(event) => setNewAttrValues(event.target.value)}
                      placeholder="Values, comma separated (e.g. Small, Medium, Large)"
                      className="w-full flex-1 rounded-lg border border-outline-variant p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                    />
                    <button
                      type="button"
                      onClick={handleAddAttribute}
                      className="flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/5"
                    >
                      <Plus aria-hidden="true" className="h-5 w-5" />
                      Add Attribute
                    </button>
                  </div>
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
                      {variants.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-sm text-on-surface-variant">
                            No variants yet — add attributes above and generate combinations, or this product will be
                            listed as a single SKU.
                          </td>
                        </tr>
                      )}
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
                              value={variant.price}
                              onChange={(event) => updateVariantField(variant.id, "price", event.target.value)}
                              className="w-24 rounded-lg border border-outline-variant p-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={(event) => updateVariantField(variant.id, "stock", event.target.value)}
                              className="w-20 rounded-lg border border-outline-variant p-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              value={variant.sku}
                              onChange={(event) => updateVariantField(variant.id, "sku", event.target.value)}
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
                    onClick={handleGenerateCombinations}
                    disabled={attributeGroups.length === 0}
                    className="mx-auto flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PlusCircle aria-hidden="true" className="h-4.5 w-4.5" />
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
                        onChange={(event) => {
                          setMetaTitle(event.target.value);
                          setMetaTitleTouched(true);
                        }}
                        className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 focus:outline-none focus:ring-2 focus:ring-secondary-container"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-outline">
                        <span>Auto-filled from title until edited</span>
                        <span>{metaTitle.length} / 60 characters</span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-foreground">Meta Description</label>
                      <textarea
                        value={metaDescription}
                        onChange={(event) => setMetaDescription(event.target.value)}
                        rows={3}
                        placeholder="Summarize this product for search results…"
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
                          onChange={(event) => {
                            setUrlSlug(event.target.value);
                            setSlugTouched(true);
                          }}
                          className="grow border-none bg-transparent p-3 text-sm focus:outline-none focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-inner">
                    <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-outline">
                      Google Search Preview
                    </h4>
                    <div className="space-y-2">
                      <p className="truncate text-sm font-medium leading-tight text-[#1a0dab]">
                        {metaTitle || "Your product title"}
                      </p>
                      <p className="truncate text-xs text-[#006621]">{`https://ecomart.com/p/${urlSlug || "your-product-slug"}`}</p>
                      <p className="text-[13px] leading-relaxed text-on-surface-variant">
                        {metaDescription || "Your meta description will appear here."}
                      </p>
                    </div>
                    <div className="mt-10 flex gap-4 rounded-xl border border-secondary-container/20 bg-secondary-container/10 p-4">
                      <Lightbulb aria-hidden="true" className="h-5 w-5 shrink-0 text-secondary" />
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
                  <History aria-hidden="true" className="h-4.5 w-4.5" />
                  <span className="text-xs">
                    {lastSavedAt ? `Last saved ${formatRelativeTime(lastSavedAt)}` : "Not saved yet"}
                  </span>
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
                    onClick={handlePublish}
                    disabled={saveState === "saving"}
                    className="flex items-center justify-center gap-2 rounded-full bg-primary px-10 py-3 font-bold text-on-primary shadow-lg transition-all hover:shadow-primary/30 disabled:opacity-60"
                  >
                    {saveState === "saving" ? (
                      <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                    )}
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

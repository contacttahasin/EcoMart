"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, LockKeyhole, Pencil, Plus, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { AddressLabel, CustomerAddress } from "@/data/customers";
import { addAddress, deleteAddress, fetchAddresses, updateAddress } from "@/services/address.service";

const LABEL_STYLES: Record<AddressLabel, string> = {
  Home: "bg-tertiary-container text-on-tertiary-container",
  Office: "bg-secondary-container text-on-secondary-container",
  Other: "bg-surface-container-highest text-on-surface-variant",
};

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50";

type FormState = {
  label: AddressLabel;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
};

const EMPTY_FORM: FormState = {
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  isDefault: false,
};

type AddressesPageClientProps = {
  customerId: string;
};

export function AddressesPageClient({ customerId }: AddressesPageClientProps) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAddresses(customerId).then((data) => {
      if (active) {
        setAddresses(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [customerId]);

  useEffect(() => {
    if (!modalOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setModalOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, isDefault: addresses.length === 0 });
    setModalOpen(true);
  };

  const openEditModal = (address: CustomerAddress) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    await deleteAddress(customerId, id);
    setAddresses(await fetchAddresses(customerId));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (editingId) {
        await updateAddress(customerId, editingId, form);
      } else {
        await addAddress(customerId, form);
      }
      setAddresses(await fetchAddresses(customerId));
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Address Book</h1>
          <p className="text-on-surface-variant">Manage your shipping and billing locations.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all active:scale-95"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add New Address
        </button>
      </header>

      {isLoading && <p className="text-sm text-on-surface-variant">Loading your addresses...</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {!isLoading && addresses.map((address) => (
          <div
            key={address.id}
            className="flex flex-col justify-between rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0px_8px_24px_rgba(0,0,0,0.08)]"
          >
            <div>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${LABEL_STYLES[address.label]}`}>
                  {address.label}
                </span>
                {address.isDefault && (
                  <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
                    <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                    Default
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-semibold text-foreground">{address.fullName}</h4>
                <p className="text-on-surface-variant">{address.phone}</p>
                <p className="leading-relaxed text-on-surface-variant">
                  {address.street}
                  <br />
                  {address.city}, {address.state} {address.zipCode}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-4 border-t border-outline-variant/30 pt-4">
              <button
                type="button"
                onClick={() => openEditModal(address)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(address.id)}
                className="text-sm font-medium text-on-surface-variant/60 transition-colors hover:text-error"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={openAddModal}
          className="group flex min-h-55 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant p-6 transition-all hover:border-primary/50 hover:bg-surface-container-low"
        >
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high transition-colors group-hover:bg-primary-container">
            <Plus aria-hidden="true" className="h-5 w-5 text-on-surface-variant group-hover:text-on-primary-container" />
          </div>
          <span className="text-sm font-medium text-on-surface-variant transition-colors group-hover:text-primary">
            Add New Address
          </span>
        </button>
      </div>

      <section className="mt-12 flex flex-col items-center gap-6 rounded-2xl bg-secondary-container/20 p-8 md:flex-row">
        <div className="flex-1">
          <h2 className="mb-1 text-xl font-semibold text-primary">Why your data is safe?</h2>
          <p className="text-on-surface-variant">
            We encrypt your personal information and address details using industry-standard protocols. Your data
            is only shared with verified delivery partners at the time of shipment.
          </p>
        </div>
        <div className="flex h-48 w-full shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-secondary shadow-lg md:w-64">
          <ShieldCheck aria-hidden="true" className="h-16 w-16 text-white/80" />
        </div>
      </section>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? "Edit address" : "Add new address"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-outline-variant p-6">
                <h2 className="text-lg font-bold text-foreground">
                  {editingId ? "Edit Address" : "Add New Address"}
                </h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface hover:text-error"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="address-label" className="text-sm font-medium text-foreground">
                    Label
                  </label>
                  <select
                    id="address-label"
                    value={form.label}
                    onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value as AddressLabel }))}
                    className={inputClass}
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="address-name" className="text-sm font-medium text-foreground">
                      Full Name
                    </label>
                    <input
                      id="address-name"
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="address-phone" className="text-sm font-medium text-foreground">
                      Phone
                    </label>
                    <input
                      id="address-phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="address-street" className="text-sm font-medium text-foreground">
                    Street Address
                  </label>
                  <input
                    id="address-street"
                    type="text"
                    required
                    value={form.street}
                    onChange={(event) => setForm((prev) => ({ ...prev, street: event.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="address-city" className="text-sm font-medium text-foreground">
                      City
                    </label>
                    <input
                      id="address-city"
                      type="text"
                      required
                      value={form.city}
                      onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="address-state" className="text-sm font-medium text-foreground">
                      State
                    </label>
                    <input
                      id="address-state"
                      type="text"
                      required
                      value={form.state}
                      onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="address-zip" className="text-sm font-medium text-foreground">
                      Zip Code
                    </label>
                    <input
                      id="address-zip"
                      type="text"
                      required
                      value={form.zipCode}
                      onChange={(event) => setForm((prev) => ({ ...prev, zipCode: event.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                    className="h-4 w-4 rounded border-outline-variant accent-primary"
                  />
                  <span className="text-sm text-on-surface-variant">Set as default address</span>
                </label>

                <div className="flex items-center gap-2 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-4 py-3">
                  <LockKeyhole aria-hidden="true" className="h-4 w-4 shrink-0 text-secondary" />
                  <p className="text-xs text-on-surface-variant">Your address details are encrypted and never shared without consent.</p>
                </div>

                {error && (
                  <p role="alert" className="text-sm font-medium text-error">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-on-surface-variant active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                    {editingId ? "Save Changes" : "Add Address"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

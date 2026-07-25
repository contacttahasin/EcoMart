"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Store, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AccountTypeModalProps = {
  open: boolean;
  onClose: () => void;
};

const ACCOUNT_TYPES = [
  {
    id: "customer",
    icon: ShoppingBag,
    title: "Login / Signup as Customer",
    description:
      "Shop products, track orders, and manage your wishlist. Experience a seamless eco-friendly shopping journey.",
    cta: "Continue as Customer",
    style: "bg-primary text-white hover:bg-on-surface-variant",
    href: "/login",
  },
  {
    id: "vendor",
    icon: Store,
    title: "Login / Signup as Vendor",
    description:
      "Sell your products, manage stock, and grow your business. Reach a community of conscious consumers.",
    cta: "Continue as Vendor",
    style: "border-2 border-primary bg-white text-primary hover:bg-secondary-container",
    href: "/vendor/login",
  },
] as const;

export function AccountTypeModal({ open, onClose }: AccountTypeModalProps) {
  const router = useRouter();

  const handleSelect = (href: string | null) => {
    if (href) router.push(href);
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Choose your account type"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-outline-variant p-6">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Welcome! Choose Your Account Type
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="group flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface hover:text-red-600"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              {ACCOUNT_TYPES.map(({ id, icon: Icon, title, description, cta, style, href }) => (
                <div
                  key={id}
                  onClick={() => handleSelect(href)}
                  className="group flex cursor-pointer flex-col rounded-xl border border-outline-variant bg-surface p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:scale-[1.02] hover:border-primary hover:shadow-[0px_8px_24px_rgba(0,0,0,0.08)]"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container transition-transform duration-300 group-hover:scale-110">
                    <Icon aria-hidden="true" className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
                  <p className="mb-8 flex-grow text-sm text-on-surface-variant">{description}</p>
                  <button
                    type="button"
                    className={`w-full rounded-lg py-3 text-sm font-semibold shadow-md transition-all active:scale-95 ${style}`}
                  >
                    {cta}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center p-6 pt-0 text-center">
              <p className="text-sm text-on-surface-variant">
                Already have an account? The appropriate login flow will be selected automatically.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

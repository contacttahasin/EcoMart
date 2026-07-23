"use client";

import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Leaf,
  Loader2,
  Recycle,
  Save,
} from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import type { Customer } from "@/data/customers";

const inputClass =
  "h-12 w-full rounded-lg border border-outline-variant bg-white px-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

type ProfileForm = {
  fullName: string;
  email: string;
  phone: string;
};

type PasswordForm = {
  current: string;
  next: string;
  confirm: string;
};

type NotificationPrefs = {
  orderUpdates: boolean;
  ecoTips: boolean;
  securityAlerts: boolean;
};

const EMPTY_PASSWORD: PasswordForm = { current: "", next: "", confirm: "" };
const DEFAULT_NOTIFICATIONS: NotificationPrefs = { orderUpdates: true, ecoTips: false, securityAlerts: true };

type SaveState = "idle" | "saving" | "saved";

function toProfileForm(customer: Customer): ProfileForm {
  return { fullName: customer.name, email: customer.email, phone: customer.phone };
}

export function SettingsPageClient({ customer }: { customer: Customer }) {
  const { updateProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileForm>(toProfileForm(customer));
  const [password, setPassword] = useState<PasswordForm>(EMPTY_PASSWORD);
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleDiscard = () => {
    setProfile(toProfileForm(customer));
    setPassword(EMPTY_PASSWORD);
    setNotifications(DEFAULT_NOTIFICATIONS);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateProfile({ avatar: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setSaveState("saving");
    updateProfile({ name: profile.fullName, email: profile.email, phone: profile.phone });
    setTimeout(() => {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    }, 1000);
  };

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-on-surface-variant">Manage your profile information and security preferences.</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-tertiary-container px-3 py-1 text-xs font-semibold text-on-tertiary-container sm:inline-flex">
          <BadgeCheck aria-hidden="true" className="h-4 w-4" />
          Verified Account
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-surface-container-high bg-secondary-container text-2xl font-semibold text-primary">
                {customer.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customer.avatar} alt={profile.fullName} className="h-full w-full object-cover" />
                ) : (
                  profile.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Camera aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
              <p className="text-sm text-on-surface-variant">Update your photo and personal details here.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="full-name" className="px-1 text-sm font-medium text-on-surface-variant">
                Full Name
              </label>
              <input
                id="full-name"
                type="text"
                value={profile.fullName}
                onChange={(event) => setProfile((prev) => ({ ...prev, fullName: event.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="px-1 text-sm font-medium text-on-surface-variant">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="phone" className="px-1 text-sm font-medium text-on-surface-variant">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-2xl bg-primary-container p-6 text-white shadow-md">
          <div>
            <h3 className="mb-1 text-lg font-semibold">Eco-Impact</h3>
            <p className="mb-4 text-sm opacity-90">
              Your contributions since joining in {new Date(customer.joinedDate).getFullYear()}.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2">
                  <Leaf aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-70">Carbon Saved</p>
                  <p className="text-lg font-semibold">124kg CO2</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2">
                  <Recycle aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-70">Items Recycled</p>
                  <p className="text-lg font-semibold">48 Units</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="mb-2 text-sm font-medium">Member Level: Platinum</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/20">
              <div className="h-full w-[85%] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <KeyRound aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
            </div>
            <span className="text-xs italic text-on-surface-variant">Last changed 3 months ago</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="current-password" className="px-1 text-sm font-medium text-on-surface-variant">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={password.current}
                  onChange={(event) => setPassword((prev) => ({ ...prev, current: event.target.value }))}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
                >
                  {showCurrentPassword ? (
                    <EyeOff aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Eye aria-hidden="true" className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-password" className="px-1 text-sm font-medium text-on-surface-variant">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="Min. 8 characters"
                value={password.next}
                onChange={(event) => setPassword((prev) => ({ ...prev, next: event.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="px-1 text-sm font-medium text-on-surface-variant">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Repeat new password"
                value={password.confirm}
                onChange={(event) => setPassword((prev) => ({ ...prev, confirm: event.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/20 bg-surface-container p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Notifications</h3>
          <div className="flex flex-col gap-3">
            {(
              [
                { key: "orderUpdates", label: "Order Updates" },
                { key: "ecoTips", label: "Eco-Tips & Deals" },
                { key: "securityAlerts", label: "Security Alerts" },
              ] as const
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 transition-colors hover:border-primary"
              >
                <span className="text-sm font-medium text-foreground">{label}</span>
                <div className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={(event) =>
                      setNotifications((prev) => ({ ...prev, [key]: event.target.checked }))
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-outline-variant transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
                </div>
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 flex items-center justify-end gap-4 pb-2">
        <button
          type="button"
          onClick={handleDiscard}
          className="rounded-lg px-6 py-3 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          Discard Changes
        </button>
        <button
          type="submit"
          disabled={saveState === "saving"}
          className={`flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
            saveState === "saved" ? "bg-secondary" : "bg-primary hover:bg-primary-container"
          }`}
        >
          {saveState === "saving" && (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Saving...
            </>
          )}
          {saveState === "saved" && (
            <>
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              Saved Successfully
            </>
          )}
          {saveState === "idle" && (
            <>
              <Save aria-hidden="true" className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

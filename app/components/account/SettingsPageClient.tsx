"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  Save,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import type { Customer } from "@/data/customers";
import { formatRelativeTime } from "@/lib/format";
import { getPasswordStrengthError } from "@/services/validation.service";
import {
  changePassword,
  deleteAccount,
  enrollTwoFactor,
  fetchAccountSecurityInfo,
  fetchActiveSessions,
  fetchLoginActivity,
  fetchNotificationPreferences,
  listTwoFactorFactors,
  signOutOtherSessions,
  unenrollTwoFactor,
  updateNotificationPreferences,
  uploadAvatar,
  verifyTwoFactorEnrollment,
  type LoginActivityEntry,
  type NotificationPreferences,
  type SessionEntry,
} from "@/services/account.service";

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

const EMPTY_PASSWORD: PasswordForm = { current: "", next: "", confirm: "" };
const DEFAULT_NOTIFICATIONS: NotificationPreferences = { orderUpdates: true, ecoTips: false, securityAlerts: true };

type SaveState = "idle" | "saving" | "saved";

function toProfileForm(customer: Customer): ProfileForm {
  return { fullName: customer.name, email: customer.email, phone: customer.phone };
}

export function SettingsPageClient({ customer }: { customer: Customer }) {
  const { updateProfile } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileForm>(toProfileForm(customer));
  const [password, setPassword] = useState<PasswordForm>(EMPTY_PASSWORD);
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [emailVerified, setEmailVerified] = useState(false);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivityEntry[]>([]);
  const [signingOutOthers, setSigningOutOthers] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorEnrollment, setTwoFactorEnrollment] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAccountSecurityInfo(customer.id).then((info) => {
      if (info) setEmailVerified(info.emailVerified);
    });
    fetchNotificationPreferences(customer.id).then((prefs) => {
      if (prefs) setNotifications(prefs);
    });
    fetchActiveSessions(customer.id).then(setSessions);
    fetchLoginActivity(customer.id).then(setLoginActivity);
    listTwoFactorFactors().then((factors) => setTwoFactorEnabled(factors.some((f) => f.status === "verified")));
  }, [customer.id]);

  const handleDiscard = () => {
    setProfile(toProfileForm(customer));
    setPassword(EMPTY_PASSWORD);
    setFormError(null);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const publicUrl = await uploadAvatar(customer.id, file);
    await updateProfile({ avatar: publicUrl });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (password.next || password.confirm || password.current) {
      if (!password.current) {
        setFormError("Enter your current password to set a new one.");
        return;
      }
      const passwordError = getPasswordStrengthError(password.next);
      if (passwordError) {
        setFormError(passwordError);
        return;
      }
      if (password.next !== password.confirm) {
        setFormError("New password and confirmation do not match.");
        return;
      }
    }

    setSaveState("saving");

    if (password.next) {
      const result = await changePassword(profile.email, password.current, password.next);
      if (!result.success) {
        setFormError(result.error);
        setSaveState("idle");
        return;
      }
      setPassword(EMPTY_PASSWORD);
    }

    await updateProfile({ name: profile.fullName, email: profile.email, phone: profile.phone });
    await updateNotificationPreferences(customer.id, notifications);

    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 3000);
  };

  const handleSignOutOtherSessions = async () => {
    setSigningOutOthers(true);
    await signOutOtherSessions();
    setSessions(await fetchActiveSessions(customer.id));
    setSigningOutOthers(false);
  };

  const handleStartTwoFactorEnrollment = async () => {
    setTwoFactorError(null);
    setTwoFactorBusy(true);
    try {
      const data = await enrollTwoFactor();
      setTwoFactorEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    } catch (error) {
      setTwoFactorError(error instanceof Error ? error.message : "Could not start enrollment.");
    }
    setTwoFactorBusy(false);
  };

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorEnrollment) return;
    setTwoFactorBusy(true);
    setTwoFactorError(null);
    const result = await verifyTwoFactorEnrollment(customer.id, twoFactorEnrollment.factorId, twoFactorCode);
    if (!result.success) {
      setTwoFactorError(result.error);
      setTwoFactorBusy(false);
      return;
    }
    setTwoFactorEnabled(true);
    setTwoFactorEnrollment(null);
    setTwoFactorCode("");
    setTwoFactorBusy(false);
  };

  const handleDisableTwoFactor = async () => {
    setTwoFactorBusy(true);
    const factors = await listTwoFactorFactors();
    const verified = factors.find((f) => f.status === "verified");
    if (verified) {
      await unenrollTwoFactor(customer.id, verified.id);
      setTwoFactorEnabled(false);
    }
    setTwoFactorBusy(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const result = await deleteAccount();
    if (result.success) {
      router.push("/");
      return;
    }
    setFormError(result.error);
    setDeleting(false);
    setDeleteConfirmOpen(false);
  };

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-on-surface-variant">Manage your profile information and security preferences.</p>
        </div>
        <span
          className={`hidden shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${
            emailVerified
              ? "bg-tertiary-container text-on-tertiary-container"
              : "bg-error-container text-on-error-container"
          }`}
        >
          <BadgeCheck aria-hidden="true" className="h-4 w-4" />
          {emailVerified ? "Verified Account" : "Email Unverified"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] lg:col-span-3">
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

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <KeyRound aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
            </div>
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
          {formError && <p className="mt-4 text-sm font-medium text-error">{formError}</p>}
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

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] lg:col-span-2">
          <div className="mb-6 flex items-center gap-2">
            <Shield aria-hidden="true" className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
          </div>

          {twoFactorEnabled ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-tertiary/20 bg-tertiary-container/10 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="h-5 w-5 text-tertiary" />
                <p className="text-sm font-medium text-foreground">Two-factor authentication is enabled.</p>
              </div>
              <button
                type="button"
                onClick={handleDisableTwoFactor}
                disabled={twoFactorBusy}
                className="rounded-lg border border-error px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/5"
              >
                Disable
              </button>
            </div>
          ) : twoFactorEnrollment ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={twoFactorEnrollment.qrCode}
                  alt="Two-factor authentication QR code"
                  className="h-40 w-40 rounded-lg border border-outline-variant bg-white p-2"
                />
                <p className="text-center text-xs text-on-surface-variant">
                  Or enter manually: <span className="font-mono">{twoFactorEnrollment.secret}</span>
                </p>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-3">
                <label htmlFor="two-factor-code" className="text-sm font-medium text-on-surface-variant">
                  Enter the 6-digit code from your authenticator app
                </label>
                <input
                  id="two-factor-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, ""))}
                  className={`${inputClass} max-w-50 text-center tracking-[0.3em]`}
                />
                {twoFactorError && <p className="text-sm font-medium text-error">{twoFactorError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyTwoFactor}
                    disabled={twoFactorBusy || twoFactorCode.length !== 6}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
                  >
                    Verify &amp; Enable
                  </button>
                  <button
                    type="button"
                    onClick={() => setTwoFactorEnrollment(null)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-on-surface-variant">
                Add an extra layer of security by requiring an authenticator app code at login.
              </p>
              <button
                type="button"
                onClick={handleStartTwoFactorEnrollment}
                disabled={twoFactorBusy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-container"
              >
                {twoFactorBusy ? "Loading…" : "Enable 2FA"}
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Smartphone aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Active Sessions</h2>
            </div>
            <button
              type="button"
              onClick={handleSignOutOtherSessions}
              disabled={signingOutOthers}
              className="flex items-center gap-1.5 text-xs font-semibold text-error hover:underline disabled:opacity-50"
            >
              <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
              Sign out others
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {sessions.length === 0 && <p className="text-sm text-on-surface-variant">No other sessions tracked yet.</p>}
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 rounded-xl border border-outline-variant/30 p-3"
              >
                <Laptop aria-hidden="true" className="h-4 w-4 shrink-0 text-on-surface-variant" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {session.browser ?? "Unknown"} · {session.device ?? "Unknown device"}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Active {formatRelativeTime(session.last_active_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Clock aria-hidden="true" className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Recent Login Activity</h2>
          </div>
          <div className="flex flex-col gap-2">
            {loginActivity.length === 0 && (
              <p className="text-sm text-on-surface-variant">No login activity recorded yet.</p>
            )}
            {loginActivity.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/30 p-3"
              >
                <span className="text-sm text-foreground">
                  {entry.success ? "Successful login" : "Failed login attempt"}
                </span>
                <span className="text-xs text-on-surface-variant">{formatRelativeTime(entry.created_at)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-error/20 bg-error-container/10 p-6 lg:col-span-3">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle aria-hidden="true" className="h-5 w-5 text-error" />
            <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
          </div>
          <p className="mb-4 text-sm text-on-surface-variant">
            Deleting your account permanently removes your profile, addresses, and order history. This cannot be undone.
          </p>
          {deleteConfirmOpen ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-foreground">Are you absolutely sure?</span>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-medium text-on-error transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                )}
                Yes, delete my account
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-error px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/5"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Delete Account
            </button>
          )}
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

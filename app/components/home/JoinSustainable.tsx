"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Check } from "lucide-react";

type NewsletterFormProps = {
  onSubscribe?: (email: string) => Promise<void>;
};

async function defaultSubscribe(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function NewsletterForm({ onSubscribe = defaultSubscribe }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      await onSubscribe(email);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p
        role="status"
        className="animate-fade-in flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white/15 px-5 text-sm font-semibold text-white backdrop-blur-md sm:w-auto"
      >
        <Check aria-hidden="true" className="h-4 w-4" />
        Thank you for subscribing!
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-start"
    >
      <div className="w-full sm:w-64">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === "error") {
              setStatus("idle");
              setErrorMessage("");
            }
          }}
          placeholder="Enter your email"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "newsletter-email-error" : undefined}
          className="h-11 w-full rounded-lg bg-white px-4 text-sm text-foreground outline-none transition-shadow duration-300 ease-out hover:shadow-[0_0_0_3px_rgba(255,255,255,0.35)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.5)]"
        />
        {status === "error" && (
          <p
            id="newsletter-email-error"
            role="alert"
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white"
          >
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            {errorMessage}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="h-11 shrink-0 rounded-lg bg-foreground px-6 text-sm font-semibold text-white transition-transform duration-300 ease-out hover:scale-[1.03] disabled:opacity-70"
      >
        {status === "submitting" ? "Subscribing..." : "Subscribe"}
      </button>
    </form>
  );
}

export default function JoinSustainable() {
  return (
    <section aria-labelledby="join-sustainable-heading" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary px-6 py-8 sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 id="join-sustainable-heading" className="text-xl font-bold text-white sm:text-2xl">
              Join the Sustainable Revolution
            </h2>
            <p className="mt-1 text-sm text-white/85">
              Get weekly updates on new vendors, sustainable tips, and exclusive deals.
            </p>
          </div>

          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}

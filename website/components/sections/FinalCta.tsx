"use client";

import { useId, useState } from "react";
import { DEMO_FORM, FINAL_CTA } from "@/content/copy";
import { PlayStoreBadge } from "@/components/ui/PlayStoreBadge";

type Status = "idle" | "sending" | "sent" | "error";

export function FinalCta() {
  return (
    <>
      <div className="seam-to-dark h-24" aria-hidden="true" />
      <section id="demo" className="on-dark relative overflow-hidden">
        <div className="shell section-y relative grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <p className="t-eyebrow text-cyan">{FINAL_CTA.eyebrow}</p>
            <h2 className="t-h2 mt-4 text-white">
              {FINAL_CTA.h2}
              <span className="block text-slate-light">
                {FINAL_CTA.h2Second}
              </span>
            </h2>
            <p className="t-lead mt-6 max-w-xl text-slate-light">
              {FINAL_CTA.lead}
            </p>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {FINAL_CTA.points.map((p) => (
                <li
                  key={p.title}
                  className="rounded-2xl border border-white/12 bg-white/[0.04] p-5"
                >
                  <h3 className="font-display text-sm font-semibold text-white">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-light">
                    {p.body}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <PlayStoreBadge />
              <p className="text-xs text-slate-light">
                Or download the patient app.
              </p>
            </div>
          </div>

          <DemoForm />
        </div>
      </section>
    </>
  );
}

function DemoForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const facilityId = useId();
  const typeId = useId();
  const emailId = useId();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const facility = String(form.get("facility") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const facilityType = String(form.get("facilityType") ?? "");

    const next: Record<string, string> = {};
    if (!facility) next.facility = "Enter your facility name.";
    // Deliberately permissive: the point is to catch typos, not to police
    // valid-but-unusual addresses.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facility, facilityType, email }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="flex flex-col justify-center rounded-3xl border border-serving/30 bg-serving/8 p-8 md:p-10">
        <div className="grid size-11 place-items-center rounded-full bg-serving/15">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5 10.5l3.5 3.5L15 7"
              stroke="#10B981"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <h3 className="t-h3 mt-5 text-white">Request received</h3>
        <p className="t-body mt-3 text-slate-light">
          Thanks — we&apos;ll be in touch to schedule your demo.
        </p>
        <p className="mt-6 text-xs text-slate-light">
          {"{{TODO: wire /api/contact to a real inbox or CRM — it currently only logs}}"}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-3xl border border-white/12 bg-white/[0.05] p-8 backdrop-blur-sm md:p-10"
    >
      <h3 className="t-h3 text-white">{DEMO_FORM.h3}</h3>
      <p className="mt-2 text-sm text-slate-light">{DEMO_FORM.sub}</p>

      <div className="mt-7 space-y-5">
        <Field
          id={facilityId}
          name="facility"
          label="Care centre / hospital name"
          error={errors.facility}
        />

        <div>
          <label
            htmlFor={typeId}
            className="block text-sm font-medium text-white"
          >
            Facility type
          </label>
          <select
            id={typeId}
            name="facilityType"
            defaultValue={DEMO_FORM.facilityTypes[0]}
            className="mt-2 w-full appearance-none rounded-xl border border-white/15 bg-navy-deep/60 px-4 py-3 text-white transition-colors focus:border-cyan focus:outline-none"
          >
            {DEMO_FORM.facilityTypes.map((t) => (
              <option key={t} value={t} className="bg-navy-deep">
                {t}
              </option>
            ))}
          </select>
        </div>

        <Field
          id={emailId}
          name="email"
          type="email"
          label="Contact email"
          error={errors.email}
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-8 w-full rounded-full bg-brand px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4fd8] disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : DEMO_FORM.submit}
      </button>

      {status === "error" && (
        <p role="alert" className="mt-4 text-sm text-[#fca5a5]">
          Something went wrong. Please try again, or reach us on LinkedIn.
        </p>
      )}
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-white">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 w-full rounded-xl border border-white/15 bg-navy-deep/60 px-4 py-3 text-white placeholder:text-slate-light transition-colors focus:border-cyan focus:outline-none"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-[#fca5a5]">
          {error}
        </p>
      )}
    </div>
  );
}

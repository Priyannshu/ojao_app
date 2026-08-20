"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SIMULATOR } from "@/content/copy";
import { cn } from "@/lib/cn";

/**
 * The token simulator, ported from the live site and given the design
 * attention the (cut) verification scene was going to get.
 *
 * A prospect who *uses* the product converts better than one who watches an
 * animation, so this is a first-class section rather than a toy. All state is
 * client-side: nothing is sent anywhere, nothing is stored.
 *
 * Accessibility: fully keyboard-operable, and queue-state changes are
 * announced via aria-live — an interactive demo that only works with a mouse
 * would exclude exactly the users a queue product should serve best.
 */

type TokenState = "waiting" | "called" | "serving" | "done";

type Ticket = {
  code: string;
  name: string;
  department: string;
  ahead: number;
  etaMinutes: number;
  state: TokenState;
};

const STATE_COPY: Record<TokenState, { label: string; hint: string }> = {
  waiting: { label: "In queue", hint: "Your position updates as the department calls each patient." },
  called: { label: "Called — head in now", hint: "You're next. This is when the app notifies you to leave." },
  serving: { label: "Now serving", hint: "The department has taken you in." },
  done: { label: "Complete", hint: "Token closed. The queue advances for everyone behind you." },
};

export function Simulator() {
  const [name, setName] = useState("");
  const [deptId, setDeptId] = useState<string>(SIMULATOR.departments[0].id);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const nameId = useId();
  const deptId_ = useId();

  // Any pending advance must be cancelled if the component unmounts or a new
  // token is issued, otherwise state lands on a stale ticket.
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const issue = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a name to issue a sample token.");
      return;
    }
    setError(null);
    clearTimers();

    const dept = SIMULATOR.departments.find((d) => d.id === deptId)!;
    // Deterministic-ish but varied: derive from name length so repeat
    // submissions differ without needing Math.random.
    const ahead = 2 + (trimmed.length % 4);
    const serial = 400 + ((trimmed.length * 7) % 90);

    setTicket({
      code: `${dept.prefix}-${serial}`,
      name: trimmed,
      department: dept.label,
      ahead,
      etaMinutes: ahead * dept.rateMinutes,
      state: "waiting",
    });

    // Walk the queue forward so the state transitions are visible.
    const step = (delay: number, fn: () => void) => {
      timers.current.push(setTimeout(fn, delay));
    };

    for (let i = 1; i <= ahead; i++) {
      step(i * 1400, () =>
        setTicket((t) =>
          t
            ? {
                ...t,
                ahead: t.ahead - 1,
                etaMinutes: Math.max(0, (t.ahead - 1) * dept.rateMinutes),
              }
            : t,
        ),
      );
    }
    step(ahead * 1400 + 900, () =>
      setTicket((t) => (t ? { ...t, state: "called" } : t)),
    );
    step(ahead * 1400 + 3200, () =>
      setTicket((t) => (t ? { ...t, state: "serving" } : t)),
    );
    step(ahead * 1400 + 6200, () =>
      setTicket((t) => (t ? { ...t, state: "done" } : t)),
    );
  };

  const reset = () => {
    clearTimers();
    setTicket(null);
    setError(null);
  };

  return (
    <section id="simulator" className="on-dark relative overflow-hidden">
      <div className="shell section-y relative">
        <div className="max-w-2xl">
          <p className="t-eyebrow text-cyan">{SIMULATOR.eyebrow}</p>
          <h2 className="t-h2 mt-4 text-white">{SIMULATOR.h2}</h2>
          <p className="t-lead mt-5 text-slate-light">{SIMULATOR.lead}</p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <form
            onSubmit={issue}
            className="rounded-3xl border border-white/12 bg-white/[0.04] p-7 backdrop-blur-sm md:p-9"
            noValidate
          >
            <div>
              <label
                htmlFor={nameId}
                className="block text-sm font-medium text-white"
              >
                Patient full name
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="off"
                aria-describedby={error ? `${nameId}-error` : undefined}
                aria-invalid={error ? true : undefined}
                placeholder="e.g. A. Sharma"
                className="mt-2 w-full rounded-xl border border-white/15 bg-navy-deep/60 px-4 py-3 text-white placeholder:text-slate-light transition-colors focus:border-cyan focus:outline-none"
              />
              {error && (
                <p
                  id={`${nameId}-error`}
                  role="alert"
                  className="mt-2 text-sm text-[#fca5a5]"
                >
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6">
              <label
                htmlFor={deptId_}
                className="block text-sm font-medium text-white"
              >
                Clinical department
              </label>
              <select
                id={deptId_}
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className="mt-2 w-full appearance-none rounded-xl border border-white/15 bg-navy-deep/60 px-4 py-3 text-white transition-colors focus:border-cyan focus:outline-none"
              >
                {SIMULATOR.departments.map((d) => (
                  <option key={d.id} value={d.id} className="bg-navy-deep">
                    {d.label} (~{d.rateMinutes}m per patient)
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1d4fd8]"
              >
                Request digital token
              </button>
              {ticket && (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-cyan"
                >
                  Reset
                </button>
              )}
            </div>

            <p className="mt-6 text-xs leading-relaxed text-slate-light">
              {SIMULATOR.note}
            </p>
          </form>

          <TicketPanel ticket={ticket} />
        </div>
      </div>
    </section>
  );
}

function TicketPanel({ ticket }: { ticket: Ticket | null }) {
  if (!ticket) {
    return (
      <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 p-8 text-center">
        <div className="grid size-12 place-items-center rounded-full border border-white/15">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M10 5v5l3.5 2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              className="text-slate-light"
            />
            <circle
              cx="10"
              cy="10"
              r="7.25"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="text-slate"
            />
          </svg>
        </div>
        <h3 className="t-h3 mt-5 text-white">{SIMULATOR.emptyTitle}</h3>
        <p className="t-body mt-2 max-w-xs text-slate-light">
          {SIMULATOR.emptyBody}
        </p>
      </div>
    );
  }

  const s = STATE_COPY[ticket.state];
  const accent =
    ticket.state === "serving"
      ? "border-serving/45 bg-serving/10 text-serving"
      : ticket.state === "called"
        ? "border-called/45 bg-called/10 text-called"
        : ticket.state === "done"
          ? "border-white/20 bg-white/5 text-slate-light"
          : "border-cyan/40 bg-cyan/10 text-cyan";

  return (
    <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-7 backdrop-blur-md md:p-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] tracking-widest text-slate-light uppercase">
            {ticket.department}
          </p>
          <p className="mt-1 font-display text-lg text-white">{ticket.name}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.625rem] font-semibold tracking-widest uppercase",
            accent,
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {s.label}
        </span>
      </div>

      <div className="mt-7 rounded-2xl border border-white/10 bg-navy-deep/55 p-6">
        <p className="text-[0.6875rem] tracking-widest text-slate-light uppercase">
          Token
        </p>
        <p className="t-token mt-1 text-5xl font-medium text-white">
          {ticket.code}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 px-4 py-3.5">
          <dt className="text-[0.625rem] tracking-widest text-slate-light uppercase">
            Patients ahead
          </dt>
          <dd className="t-token mt-1.5 text-2xl text-white">{ticket.ahead}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-4 py-3.5">
          <dt className="text-[0.625rem] tracking-widest text-slate-light uppercase">
            Estimated wait
          </dt>
          <dd className="t-token mt-1.5 text-2xl text-white">
            {ticket.etaMinutes}m
          </dd>
        </div>
      </dl>

      {/* The single announcement region for the whole simulator. */}
      <p
        role="status"
        aria-live="polite"
        className="mt-6 text-sm leading-relaxed text-slate-light"
      >
        {s.hint} {ticket.state === "waiting" && `${ticket.ahead} ahead of you, about ${ticket.etaMinutes} minutes.`}
      </p>
    </div>
  );
}

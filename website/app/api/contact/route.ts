import { NextResponse } from "next/server";

/**
 * Demo-request endpoint.
 *
 * Deliberately a stub: it validates, logs, and returns 200. There is no
 * inbox, CRM, or database wired up yet — see PLACEHOLDERS.md. Do not ship
 * this to production expecting to receive leads.
 */

const MAX_LEN = 200;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { facility, facilityType, email } = body as Record<string, unknown>;

  const clean = (v: unknown) =>
    typeof v === "string" ? v.trim().slice(0, MAX_LEN) : "";

  const payload = {
    facility: clean(facility),
    facilityType: clean(facilityType),
    email: clean(email),
  };

  if (!payload.facility || !payload.email) {
    return NextResponse.json(
      { error: "facility and email are required" },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Only the facility type and a redacted email are logged: writing a full
  // contact address into server logs is exactly the habit the security page
  // promises we avoid.
  const [local, domain] = payload.email.split("@");
  console.log("[demo-request]", {
    facility: payload.facility,
    facilityType: payload.facilityType,
    email: `${local.slice(0, 2)}***@${domain}`,
  });

  return NextResponse.json({ ok: true });
}

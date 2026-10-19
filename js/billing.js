// Subscription paywall. Configure with window.COURTSIDE.billing (set by build.py --billing):
//   { mode: "off" | "demo" | "stripe", api: "https://your-server", price: "$5.99", period: "month", trialDays: 7, terms, privacy }
// off    → the app is free (default, so nothing is gated unless you turn it on)
// demo   → the paywall works end to end with a clearly labeled practice checkout; no card, no charge
// stripe → Stripe Checkout through the small server in /api, which holds the secret key and checks
//          with Stripe whether a subscription is active. The browser never decides on its own.

const CFG = (globalThis.COURTSIDE && globalThis.COURTSIDE.billing) || {};
export const BILLING = { mode: "off", api: "", price: "$5.99", period: "month", trialDays: 0, terms: "", privacy: "", ...CFG };
BILLING.api = String(BILLING.api || "").replace(/\/$/, "");

const DAY = 86400000;
const GRACE = 3 * DAY; // if the server can't be reached, a paid-up subscriber keeps access this long past their period end

// sub: { customer, active, trial, until, checked, demo } — during a free trial, `until` is when the trial ends
export function isEntitled(sub, now = Date.now()) {
  if (BILLING.mode === "off") return true;
  if (!sub) return false;
  if (BILLING.mode === "demo") return !!(sub.demo && sub.active);
  if (sub.demo || !sub.customer) return false; // a practice unlock never counts; a real one always has a Stripe customer
  return !!sub.active && !!sub.until && now < sub.until + GRACE;
}

async function call(path, { method = "GET", body } = {}) {
  const res = await fetch(BILLING.api + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const appUrl = () => location.href.split("#")[0].split("?")[0];

// Send the player to Stripe Checkout. Resolves only in demo mode (with the new sub).
export async function startCheckout() {
  if (BILLING.mode === "demo") {
    const trial = BILLING.trialDays > 0;
    return { demo: true, active: true, trial, until: Date.now() + (trial ? BILLING.trialDays : 30) * DAY, checked: Date.now() };
  }
  const { url } = await call("/api/checkout", { method: "POST", body: {} });
  location.href = url;
  return new Promise(() => {}); // the page is navigating away
}

// After Checkout, Stripe sends the player back with ?session_id=… Swap it for a verified subscription.
export async function completeCheckoutFromUrl() {
  if (BILLING.mode !== "stripe") return null;
  const params = new URLSearchParams(location.search);
  const id = params.get("session_id");
  if (!id) return null;
  params.delete("session_id");
  const clean = appUrl() + (params.toString() ? `?${params}` : "") + location.hash;
  history.replaceState(null, "", clean);
  const s = await call(`/api/session?id=${encodeURIComponent(id)}`);
  return { customer: s.customer, active: s.active, trial: !!s.trial, until: s.until, checked: Date.now() };
}

// Re-check an existing subscriber with Stripe (renewals, cancellations, failed payments).
export async function refreshSubscription(sub) {
  if (BILLING.mode !== "stripe" || !sub || !sub.customer) return sub;
  const s = await call(`/api/entitlement?customer=${encodeURIComponent(sub.customer)}`);
  return { ...sub, active: s.active, trial: !!s.trial, until: s.until, checked: Date.now() };
}

// Find an existing subscription by the email used at checkout (new phone, cleared browser).
export async function restoreByEmail(email) {
  if (BILLING.mode === "demo") return null;
  const s = await call("/api/restore", { method: "POST", body: { email } });
  return s.customer ? { customer: s.customer, active: s.active, trial: !!s.trial, until: s.until, checked: Date.now() } : null;
}

// Stripe's hosted billing page: update the card, see invoices, cancel.
export async function openBillingPortal(sub) {
  const { url } = await call("/api/portal", { method: "POST", body: { customer: sub.customer } });
  location.href = url;
}

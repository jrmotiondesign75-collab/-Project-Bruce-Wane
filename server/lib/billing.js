// Shared helpers for the Courtside billing functions (deployed as Vercel serverless functions).
// Environment:
//   STRIPE_SECRET_KEY  sk_live_… or sk_test_…  (never ship this to the app)
//   STRIPE_PRICE_ID    price_… for the $5.99/month subscription
//   APP_URL            where the app is hosted, e.g. https://courtside.app (CORS origin + return address)
//   TRIAL_DAYS         free trial length in days (default 7; set 0 for no trial)
import Stripe from "stripe";

let client = null;
export function stripe() {
  if (globalThis.__courtsideStripe) return globalThis.__courtsideStripe; // test double
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

const appUrl = () => (process.env.APP_URL || "").replace(/\/$/, "");

// Players are only ever sent back to the app itself (APP_URL), never to an address a request supplies.
export function returnUrl() {
  const base = appUrl();
  if (!base) throw new Error("APP_URL is not set");
  return base;
}

export function cors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", appUrl() || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export function fail(res, status, error) {
  res.status(status).json({ error });
}

// Stripe collects the card at checkout and charges automatically when the trial ends.
export const trialLength = () => (process.env.TRIAL_DAYS === undefined || process.env.TRIAL_DAYS === "" ? 7 : Math.max(0, Number(process.env.TRIAL_DAYS) || 0));

const ACTIVE = new Set(["active", "trialing"]);

// Summarize a customer's subscriptions: active if any is active or trialing; `until` = end of the current period
// (the trial end date while trialing), in ms; `trial` = still in the free trial.
export function summarize(subs) {
  const live = subs.filter((s) => ACTIVE.has(s.status));
  const ends = live.map((s) => s.current_period_end ?? s.items?.data?.[0]?.current_period_end ?? 0);
  return { active: live.length > 0, trial: live.length > 0 && live.every((s) => s.status === "trialing"), until: live.length ? Math.max(...ends) * 1000 : null };
}

export async function customerStatus(customer) {
  const { data } = await stripe().subscriptions.list({ customer, status: "all", limit: 10 });
  return summarize(data);
}

export function handler(methods, fn) {
  return async (req, res) => {
    if (cors(req, res)) return;
    if (!methods.includes(req.method)) return fail(res, 405, "Method not allowed");
    try {
      await fn(req, res);
    } catch (err) {
      console.error(err);
      fail(res, err.statusCode && err.statusCode < 500 ? 400 : 500, err.type === "StripeInvalidRequestError" ? "Invalid request" : "Billing is unavailable right now");
    }
  };
}

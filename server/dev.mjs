// Local server for the billing functions, shaped like Vercel's runtime, that also serves the built app.
//   STRIPE_SECRET_KEY=sk_test_… STRIPE_PRICE_ID=price_… node dev.mjs     → real Stripe (test mode)
//   FAKE_STRIPE=1 node dev.mjs                                             → a built-in stand-in, no account needed
// Then build the app against it and open it:
//   python3 build.py --theme premium --billing stripe --api http://localhost:8787
//   open http://localhost:8787/app/courtside-premium.html
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const ORIGIN = `http://localhost:${PORT}`;
process.env.APP_URL ||= `${ORIGIN}/app/courtside-premium.html`;
process.env.STRIPE_PRICE_ID ||= "price_dev";

// ---- fake Stripe: just enough of the API for the five functions, kept in memory ----
export function fakeStripe() {
  const db = { sessions: {}, customers: {}, subs: [], n: 0 };
  const id = (p) => `${p}_${(++db.n).toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const api = {
    db,
    checkout: {
      sessions: {
        create: async (o) => {
          const s = { id: id("cs"), status: "open", customer: null, success_url: o.success_url, cancel_url: o.cancel_url, price: o.line_items[0].price, trial: o.subscription_data?.trial_period_days || 0 };
          db.sessions[s.id] = s;
          return { ...s, url: `${ORIGIN}/fake-checkout?s=${s.id}` };
        },
        retrieve: async (sid) => {
          if (!db.sessions[sid]) throw Object.assign(new Error("No such session"), { type: "StripeInvalidRequestError", statusCode: 404 });
          return db.sessions[sid];
        },
      },
    },
    subscriptions: { list: async ({ customer }) => ({ data: db.subs.filter((s) => s.customer === customer) }) },
    customers: { list: async ({ email }) => ({ data: Object.values(db.customers).filter((c) => c.email === email) }) },
    billingPortal: { sessions: { create: async ({ customer, return_url }) => ({ url: `${ORIGIN}/fake-portal?c=${customer}&r=${encodeURIComponent(return_url)}` }) } },
    // test helpers
    pay(sid, email) {
      const s = db.sessions[sid];
      const c = { id: id("cus"), email };
      db.customers[c.id] = c;
      s.status = "complete";
      s.customer = c.id;
      db.subs.push({ id: id("sub"), customer: c.id, status: s.trial ? "trialing" : "active", items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 }] } });
      return s;
    },
    cancel(customer) {
      db.subs.filter((s) => s.customer === customer).forEach((s) => (s.status = "canceled"));
    },
  };
  return api;
}

// ---- Vercel-style adapter ----
async function loadHandler(name) {
  const file = path.join(HERE, "api", `${name}.js`);
  if (!fs.existsSync(file)) return null;
  return (await import(file)).default;
}

function vercelRes(res) {
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (o) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(o));
  };
  return res;
}

export function start({ fake = !!process.env.FAKE_STRIPE } = {}) {
  const stripe = fake ? fakeStripe() : null;
  if (stripe) globalThis.__courtsideStripe = stripe;
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, ORIGIN);
    vercelRes(res);
    if (url.pathname.startsWith("/api/")) {
      const handler = await loadHandler(url.pathname.slice(5));
      if (!handler) return res.status(404).json({ error: "Not found" });
      let raw = "";
      for await (const chunk of req) raw += chunk;
      req.query = Object.fromEntries(url.searchParams);
      req.body = raw ? JSON.parse(raw) : {};
      return handler(req, res);
    }
    if (url.pathname.startsWith("/app/")) {
      const file = path.join(HERE, "..", "dist", path.basename(url.pathname));
      if (!fs.existsSync(file)) return res.status(404).end("Build the app first");
      res.setHeader("Content-Type", "text/html");
      return res.end(fs.readFileSync(file));
    }
    if (stripe && url.pathname === "/fake-checkout") {
      // stand-in for Stripe's hosted checkout page
      const s = stripe.db.sessions[url.searchParams.get("s")];
      if (req.method === "POST") {
        let raw = "";
        for await (const chunk of req) raw += chunk;
        const email = new URLSearchParams(raw).get("email") || "player@example.com";
        stripe.pay(s.id, email);
        res.writeHead(303, { Location: s.success_url.replace("{CHECKOUT_SESSION_ID}", s.id) });
        return res.end();
      }
      res.setHeader("Content-Type", "text/html");
      return res.end(`<!doctype html><title>Fake checkout</title><h1>Fake Stripe checkout</h1><p>Price ${s.price}${s.trial ? `, ${s.trial}-day trial` : ""}</p>
        <form method="post"><input name="email" value="player@example.com"><button id="pay">Pay</button></form><a id="back" href="${s.cancel_url}">Back</a>`);
    }
    if (stripe && url.pathname === "/fake-portal") {
      res.setHeader("Content-Type", "text/html");
      return res.end(`<!doctype html><title>Fake portal</title><h1>Fake billing portal</h1><p>${url.searchParams.get("c")}</p><a id="back" href="${url.searchParams.get("r")}">Back</a>`);
    }
    res.status(404).end("Not found");
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve({ server, stripe, origin: ORIGIN })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { origin } = await start();
  console.log(`Billing functions on ${origin}/api/* · app at ${process.env.APP_URL}${process.env.FAKE_STRIPE ? " · FAKE Stripe" : ""}`);
}

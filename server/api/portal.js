// POST { customer } → { url } — Stripe's hosted page to update the card, see invoices or cancel.
import { stripe, returnUrl, handler, fail } from "../lib/billing.js";

export default handler(["POST"], async (req, res) => {
  const customer = String((req.body && req.body.customer) || "");
  if (!customer.startsWith("cus_")) return fail(res, 400, "Missing customer");
  const session = await stripe().billingPortal.sessions.create({ customer, return_url: returnUrl() });
  res.status(200).json({ url: session.url });
});

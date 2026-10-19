// GET ?id=cs_… → { customer, active, until } — confirms a finished Checkout with Stripe.
import { stripe, customerStatus, handler, fail } from "../lib/billing.js";

export default handler(["GET"], async (req, res) => {
  const id = String(req.query.id || "");
  if (!id.startsWith("cs_")) return fail(res, 400, "Missing checkout session");
  const session = await stripe().checkout.sessions.retrieve(id);
  if (session.status !== "complete" || !session.customer) return res.status(200).json({ customer: null, active: false, until: null });
  const customer = typeof session.customer === "string" ? session.customer : session.customer.id;
  res.status(200).json({ customer, ...(await customerStatus(customer)) });
});

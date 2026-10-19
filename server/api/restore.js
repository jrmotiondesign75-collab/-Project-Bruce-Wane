// POST { email } → { customer, active, until } — find an active subscription by the checkout email
// (new phone, cleared browser). Returns customer: null when there's nothing active.
import { stripe, customerStatus, handler, fail } from "../lib/billing.js";

export default handler(["POST"], async (req, res) => {
  const email = String((req.body && req.body.email) || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(res, 400, "Enter a valid email");
  const { data } = await stripe().customers.list({ email, limit: 10 });
  for (const c of data) {
    const status = await customerStatus(c.id);
    if (status.active) return res.status(200).json({ customer: c.id, ...status });
  }
  res.status(200).json({ customer: null, active: false, until: null });
});

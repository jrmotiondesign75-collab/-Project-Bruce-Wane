// GET ?customer=cus_… → { active, until } — is this subscriber still paid up?
import { customerStatus, handler, fail } from "../lib/billing.js";

export default handler(["GET"], async (req, res) => {
  const customer = String(req.query.customer || "");
  if (!customer.startsWith("cus_")) return fail(res, 400, "Missing customer");
  res.status(200).json(await customerStatus(customer));
});

// POST → { url } — a Stripe Checkout page for the monthly subscription.
import { stripe, returnUrl, handler, trialLength } from "../lib/billing.js";

export default handler(["POST"], async (req, res) => {
  const back = returnUrl();
  const trialDays = trialLength();
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${back}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: back,
    allow_promotion_codes: true,
    ...(trialDays > 0 ? { subscription_data: { trial_period_days: trialDays } } : {}),
  });
  res.status(200).json({ url: session.url });
});

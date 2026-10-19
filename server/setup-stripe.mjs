// One-time setup: creates the Courtside product and its $5.99/month price in your Stripe account
// and prints the price ID to put in STRIPE_PRICE_ID. Run with your key:
//   STRIPE_SECRET_KEY=sk_test_… npm run setup-stripe
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const product = await stripe.products.create({ name: "Courtside membership", description: "Your personal basketball program: training plan, drills, alarms, nutrition, sleep, lessons and ranks." });
const price = await stripe.prices.create({ product: product.id, unit_amount: 599, currency: "usd", recurring: { interval: "month" } });
console.log(`Product: ${product.id}\nSTRIPE_PRICE_ID=${price.id}`);

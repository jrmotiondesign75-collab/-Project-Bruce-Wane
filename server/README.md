# Courtside billing server

Five small serverless functions that connect the Courtside paywall to Stripe. They hold the Stripe secret key, so the app never sees it, and they decide whether someone has paid, so editing browser storage can't unlock the app.

| Function | What it does |
| --- | --- |
| `POST /api/checkout` | Starts a Stripe Checkout page for the $5.99/month subscription |
| `GET /api/session?id=cs_…` | Confirms a finished checkout and returns the subscriber's Stripe customer ID |
| `GET /api/entitlement?customer=cus_…` | Checks whether a subscriber is still paid up. The app calls this on every launch |
| `POST /api/portal` | Opens Stripe's billing page, where subscribers update their card, see invoices or cancel |
| `POST /api/restore` | Finds an active subscription by the email used at checkout (new phone or cleared browser) |

## Going live

1. **Create a Stripe account** at stripe.com and stay in **test mode** until everything works.
2. **Create the $5.99/month price** in the Stripe dashboard (Product catalog → Add product → $5.99, recurring, monthly), or run:
   ```
   cd server && npm install
   STRIPE_SECRET_KEY=sk_test_… npm run setup-stripe     # prints STRIPE_PRICE_ID=price_…
   ```
3. **Turn on the customer portal** in the Stripe dashboard (Settings → Billing → Customer portal), so subscribers can cancel themselves.
4. **Deploy this `server/` folder to Vercel** (or any host that runs Node functions in an `api/` folder) and set these environment variables:
   - `STRIPE_SECRET_KEY`: your `sk_test_…` key (later `sk_live_…`)
   - `STRIPE_PRICE_ID`: the `price_…` ID from step 2
   - `APP_URL`: the exact address where the app is hosted, e.g. `https://courtside.app/`
   - `TRIAL_DAYS` (optional): free-trial length, if you want one
5. **Build the app against it** and host `dist/courtside-premium.html` at `APP_URL`:
   ```
   python3 build.py --theme premium --billing stripe --api https://YOUR-BILLING.vercel.app \
     --terms https://…/terms --privacy https://…/privacy
   ```
6. **Test a purchase** with Stripe's test card `4242 4242 4242 4242` (any future date, any CVC). Then swap in your live key and live price ID.

## Try it locally

```
cd server && npm install
FAKE_STRIPE=1 node dev.mjs                         # built-in stand-in for Stripe, no account needed
# or: STRIPE_SECRET_KEY=sk_test_… STRIPE_PRICE_ID=price_… node dev.mjs
cd .. && python3 build.py --theme premium --billing stripe --api http://localhost:8787
open http://localhost:8787/app/courtside-premium.html
```

## Notes

- **Native app stores:** if Courtside ships as an iPhone or Android app, Apple and Google generally require their own in-app purchase system for digital subscriptions, and they take a 15–30% cut. Rules vary by country (in the US, apps may now also link out to web checkout). This Stripe setup is for the web app.
- **Restore by email** trusts the email address someone types in. That's fine to launch with. Before you scale, swap it for an emailed sign-in link (Stripe's customer portal can send one).
- **Offline:** a paid-up subscriber keeps access for up to 3 days past their billing date if the server can't be reached, so a bad connection never locks out a paying player.

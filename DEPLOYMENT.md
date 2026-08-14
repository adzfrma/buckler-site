# Buckler — Deployment Guide (Real Stripe Payments, No Shopify)

This project is ready to deploy as a real, live website with real Stripe payments.
No Shopify subscription needed.

## What's in this project

```
buckler-site/
├── index.html                      Your whole site (homepage, order page, cart, checkout, confirmation)
├── api/
│   ├── create-checkout-session.js  Creates a REAL Stripe Checkout session (runs on the server)
│   └── verify-session.js           Verifies a completed order using real Stripe data
├── vercel.json                     Routing config (makes /order, /checkout etc. work properly)
└── package.json                    Tells Vercel to install the Stripe library
```

## How the payment flow actually works

1. Customer picks a bundle, clicks "Add to cart", goes to checkout, enters their email
2. Clicking "Continue to secure payment" calls `/api/create-checkout-session` — a real
   server function that asks Stripe to create a Checkout Session
3. The customer is redirected to Stripe's own hosted payment page (stripe.com URL) —
   this is where they enter their real card. **Your site never sees or touches card
   numbers, which is exactly what keeps you PCI-compliant without extra work.**
4. After payment, Stripe redirects them back to `yoursite.com/order-confirmed?session_id=...`
5. Your site calls `/api/verify-session` to fetch the REAL, verified order details
   directly from Stripe (never trusting anything the browser itself claims)

---

## Step 1 — Create a Stripe account (10 min)

1. Go to **stripe.com** → Sign up
2. You'll land in **Test mode** by default — perfect, this lets you test the whole
   flow with fake card numbers before going live
3. Go to **Developers → API keys**
4. Copy your **Secret key** (starts with `sk_test_...`) — you'll need this in Step 3

## Step 2 — Deploy to Vercel (10 min)

1. Go to **vercel.com** → Sign up (free tier is enough to start)
2. Install the Vercel CLI, or just drag-and-drop:
   - **Easiest path:** create a free GitHub account if you don't have one, create a
     new repository, upload these project files to it, then in Vercel click
     **"Add New Project"** → **Import** your GitHub repo → **Deploy**
   - Vercel auto-detects the `api/` folder and deploys those as real serverless functions

## Step 3 — Add your Stripe key as an environment variable

**Never put your Stripe secret key directly in the code.** Instead:

1. In your Vercel project → **Settings → Environment Variables**
2. Add: `STRIPE_SECRET_KEY` = `sk_test_...` (your key from Step 1)
3. Redeploy (Vercel prompts you to after adding an env var)

## Step 4 — Test it for real

1. Visit your new `*.vercel.app` URL
2. Go through the whole flow: add to cart → checkout → enter email → "Continue to secure payment"
3. You'll land on a real Stripe page. Use Stripe's official test card:
   **4242 4242 4242 4242**, any future expiry date, any 3-digit CVC, any ZIP
4. Complete payment → you'll be redirected back to your confirmation page showing
   the real order number, amount, and shipping address — all pulled live from Stripe

## Step 5 — Connect your domain

1. Buy your domain (Namecheap, Porkbun, etc. — see earlier steps)
2. In Vercel → **Settings → Domains** → add your domain
3. Vercel gives you exact DNS records to add at your registrar (usually just one
   A record or CNAME) — follow their on-screen instructions exactly
4. Takes a few minutes to a few hours to propagate

## Step 6 — Go live for real

1. In Stripe, flip from **Test mode** to **Live mode** (top-left toggle)
2. Get your **live** secret key (starts with `sk_live_...`)
3. Update the `STRIPE_SECRET_KEY` environment variable in Vercel with the live key
4. Stripe will ask you to complete business verification (business details, bank
   account for payouts) before you can accept real charges — this is Stripe's
   standard requirement, usually takes minutes to a day to approve

---

## One thing to fix before launch

In `api/create-checkout-session.js`, there's a placeholder product image URL:
```js
images: ['https://YOUR_DOMAIN/buckler-product.png']
```
Replace this with a real, publicly accessible image URL once your domain is live
(this is just what shows on Stripe's payment page, not required for payments to work).

## Costs to expect

- Vercel: free tier is enough for a store this size
- Stripe: no monthly fee, ~2.9% + 30¢ per transaction (standard rate)
- Domain: ~$10-15/year

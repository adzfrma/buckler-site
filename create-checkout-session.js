// /api/create-checkout-session.js
//
// This runs on the SERVER (Vercel serverless function), never in the browser.
// This is exactly why it's safe: your Stripe secret key lives only here,
// as an environment variable, never in any file the customer's browser sees.
//
// Flow: browser sends cart contents -> this function asks Stripe to create
// a real Checkout Session -> returns the URL -> browser redirects there ->
// customer enters their real card on Stripe's own secure, PCI-compliant page.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS headers (safe to leave open since this only creates a checkout
  // session, it never exposes secret data back to the browser)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { qty, unitPrice, express, email } = req.body;

    // ---- Server-side validation (never trust numbers sent from the browser) ----
    const safeQty = Math.max(1, Math.min(50, parseInt(qty, 10) || 1));
    const safeUnitPrice = Math.max(0, parseFloat(unitPrice) || 0);
    const safeExpress = express === true;

    if (safeUnitPrice <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Buckler™ Tracker',
            description: 'Real-time GPS/Bluetooth tracker — works with Apple Find My',
            images: ['https://YOUR_DOMAIN/buckler-product.png'], // TODO: replace with a real hosted image URL
          },
          unit_amount: Math.round(safeUnitPrice * 100), // Stripe uses cents
        },
        quantity: safeQty,
      },
    ];

    if (safeExpress) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Express Processing' },
          unit_amount: 495,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: email || undefined,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'AU', 'GB'],
      },
      success_url: `${req.headers.origin}/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/order`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe session creation failed:', err.message);
    return res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
};

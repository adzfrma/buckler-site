const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { qty, unitPrice, express, email } = req.body;

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
          },
          unit_amount: Math.round(safeUnitPrice * 100),
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
    return res.status(500).json({ error: 'DEBUG: ' + err.message });
  }
};

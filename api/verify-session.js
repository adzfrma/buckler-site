const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'customer_details'],
    });

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    return res.status(200).json({
      orderNumber: 'BKL-' + session.id.slice(-8).toUpperCase(),
      email: session.customer_details?.email,
      amountTotal: session.amount_total / 100,
      currency: session.currency,
      shippingAddress: session.shipping_details?.address,
      shippingName: session.shipping_details?.name,
      lineItems: session.line_items?.data.map(li => ({
        name: li.description,
        qty: li.quantity,
        amount: li.amount_total / 100,
      })),
    });
  } catch (err) {
    console.error('Session verification failed:', err.message);
    return res.status(500).json({ error: 'Could not verify order' });
  }
};

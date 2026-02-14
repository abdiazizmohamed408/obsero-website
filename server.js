const express = require('express');
const path = require('path');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe with your secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Product configuration - matches your pricing
const PRODUCTS = {
  'harassment': {
    name: 'Sexual Harassment Prevention',
    price: 49900, // $499 in cents
    description: 'Annual license - Unlimited employees'
  },
  'cybersecurity': {
    name: 'Cybersecurity Awareness',
    price: 39900,
    description: 'Annual license - Unlimited employees'
  },
  'privacy': {
    name: 'Data Privacy',
    price: 39900,
    description: 'Annual license - Unlimited employees'
  },
  'ethics': {
    name: 'Code of Conduct & Ethics',
    price: 34900,
    description: 'Annual license - Unlimited employees'
  },
  'safety': {
    name: 'Workplace Safety',
    price: 34900,
    description: 'Annual license - Unlimited employees'
  },
  'bundle': {
    name: 'Complete Suite - All 5 Courses',
    price: 149900, // $1,499
    description: 'Annual license - Unlimited employees - BEST VALUE'
  }
};

// Create Stripe Checkout Session
app.post('/api/checkout', async (req, res) => {
  try {
    const { productId, customerEmail } = req.body;
    
    const product = PRODUCTS[productId];
    if (!product) {
      return res.status(400).json({ error: 'Invalid product' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${process.env.BASE_URL || 'https://obsero.io'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || 'https://obsero.io'}/#pricing`,
      metadata: {
        productId: productId
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook for Stripe events (for fulfillment)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful for:', session.customer_email);
      // TODO: Send course access email, update database, etc.
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Obsero server running on port ${PORT}`);
});

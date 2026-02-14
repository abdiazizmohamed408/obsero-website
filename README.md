# Obsero - Modern Compliance Training

Beautiful, audit-ready compliance training your employees will actually complete.

## Quick Start

```bash
npm install
npm start
```

## Deployment on Railway

### 1. Environment Variables

Set these in Railway Dashboard → Variables:

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key (starts with `sk_live_` or `sk_test_`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (starts with `whsec_`) |
| `BASE_URL` | Your domain (e.g., `https://obsero.io`) |

### 2. Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** → `STRIPE_SECRET_KEY`
3. Copy your **Publishable key** → Update in `public/index.html`

### 3. Update Publishable Key in Code

Edit `public/index.html` and replace:
```javascript
const stripe = Stripe('pk_live_YOUR_PUBLISHABLE_KEY');
```
With your actual publishable key from Stripe.

### 4. Set Up Stripe Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/webhook`
3. Select event: `checkout.session.completed`
4. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

## Formspree (Contact Form)

The contact form is already configured with Formspree. Submissions go to your Formspree dashboard.

To change the form destination:
1. Go to [Formspree](https://formspree.io)
2. Create a new form
3. Update the form ID in `public/index.html`

## Product Pricing

Configured in `server.js`:

| Product ID | Name | Price (CAD) |
|------------|------|-------------|
| `harassment` | Sexual Harassment Prevention | $499 |
| `cybersecurity` | Cybersecurity Awareness | $399 |
| `privacy` | Data Privacy | $399 |
| `ethics` | Code of Conduct & Ethics | $349 |
| `safety` | Workplace Safety | $349 |
| `bundle` | Complete Suite (All 5) | $1,499 |

## Folder Structure

```
obsero-website/
├── server.js          # Express server + Stripe API
├── package.json       # Dependencies
├── public/
│   ├── index.html     # Main landing page
│   └── success.html   # Post-purchase thank you page
└── README.md
```

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
export STRIPE_SECRET_KEY=sk_test_xxx
export BASE_URL=http://localhost:3000

# Run server
npm start
```

Visit http://localhost:3000

## Testing Payments

Use Stripe test mode:
- Test card: `4242 4242 4242 4242`
- Any future expiry, any CVC

## Support

hello@obsero.io

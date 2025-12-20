# Copycat Shield - Early Warning System

A proof-of-concept system that detects suspicious visitors on e-commerce stores using FingerprintJS. This demonstrates how a brand protection company could catch copycats BEFORE they clone a store.

## The Pitch

Copycats visit the original store first to scout and scrape content. This system fingerprints every visitor and flags suspicious behavior:

- **Bots** - Automated scraping tools
- **VPN/Proxy users** - Hiding their identity
- **Tor users** - Maximum anonymization
- **DevTools open** - Inspecting source code
- **Rapid page scanning** - Unnatural browsing patterns
- **Virtual machines** - Automated environments
- **Browser tampering** - Anti-detect browsers

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Client's       │     │  Your Server    │     │  FingerprintJS  │
│  Shopify Store  │     │  (This project) │     │  Server API     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. Script sends      │                       │
         │     visitorId +       │                       │
         │     requestId +       │                       │
         │     page URL          │                       │
         │ ─────────────────────▶│                       │
         │                       │                       │
         │                       │  2. Get full signals  │
         │                       │ ─────────────────────▶│
         │                       │                       │
         │                       │  3. Bot, VPN,         │
         │                       │     DevTools, etc.    │
         │                       │ ◀─────────────────────│
         │                       │                       │
         │                       │  4. Store in DB       │
         │                       │     Analyze patterns  │
         │                       │     Flag suspicious   │
         │                       │                       │
┌────────────────────────────────┴───────────────────────────────────┐
│                    CLIENT PORTAL (Dashboard)                        │
│   View all visitors, suspicious alerts, risk signals                │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Environment

Copy the environment template and add your FingerprintJS keys:

```bash
cp env.example .env
```

Edit `.env` with your keys:

```env
FINGERPRINT_PUBLIC_API_KEY=your_public_key_here
FINGERPRINT_SECRET_API_KEY=your_secret_key_here
FINGERPRINT_REGION=Global
PORT=3001
NODE_ENV=development
```

### 3. Get FingerprintJS API Keys

1. Sign up at [fingerprint.com](https://fingerprint.com)
2. Create a new application
3. Copy your **Public API Key** (for client-side)
4. Copy your **Secret API Key** (for server-side)
5. Update your `.env` file

> **Note:** The system works without API keys but only detects client-side signals (DevTools). For full detection (VPN, Bot, Incognito, etc.), you need valid FingerprintJS keys.

### 4. Run Locally

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:3001
- **Dashboard**: http://localhost:5173
- **Tracking Script**: http://localhost:3001/protect.js

## Testing

### Test with Your Shopify Store

1. Add the tracking script to your Shopify store (see "Adding to Shopify" below)
2. Open the Dashboard: http://localhost:5173
3. Visit your Shopify store
4. Watch yourself appear as a visitor in the dashboard

### Trigger Risk Signals

| Action | Risk Points | Signal |
|--------|-------------|--------|
| Open DevTools (F12) | +20 | Developer Tools Open |
| Use VPN | +20 | VPN Detected |
| Use Proxy | +20 | Proxy Detected |
| Use Tor | +35 | Tor Network |
| Visit >10 pages in 5 min | +25 | Rapid Browsing |
| Use incognito mode | +10 | Incognito Mode |
| Run in VM | +20 | Virtual Machine |
| Use anti-detect browser | +30 | Browser Tampering |
| Detected as bot | +40 | Bot Detected |

### Risk Levels

- **Low** (0-19): Normal visitor
- **Medium** (20-39): Some signals, monitor
- **High** (40-59): Suspicious, investigate
- **Critical** (60+): Likely scraper/copycat

### Alerts

Alerts are automatically created when a visitor's risk score reaches **50 or higher**.

## Adding to Shopify

Add this script to your Shopify theme's `theme.liquid`:

```html
<script 
  src="https://YOUR-SERVER.com/protect.js" 
  data-store-id="YOUR-STORE-ID"
  data-api-key="YOUR_PUBLIC_API_KEY">
</script>
```

Replace:
- `YOUR-SERVER.com` - Your deployed server URL
- `YOUR-STORE-ID` - Unique identifier for the store
- `YOUR_PUBLIC_API_KEY` - Your FingerprintJS public key

## Project Structure

```
copycat-detection-poc/
├── public/
│   └── protect.js              ← Tracking script for stores
├── src/
│   ├── server.js               ← Express server
│   ├── routes/
│   │   ├── collect.js          ← Receives fingerprint data
│   │   └── api.js              ← Dashboard API endpoints
│   ├── services/
│   │   └── fingerprint.js      ← FingerprintJS client
│   ├── db/
│   │   └── database.js         ← JSON file database
│   └── utils/
│       └── riskAnalyzer.js     ← Risk scoring engine
├── dashboard/                   ← React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Visitors.jsx
│   │   │   ├── VisitorDetail.jsx
│   │   │   ├── Alerts.jsx
│   │   │   └── Activity.jsx
│   │   └── components/
│   │       ├── Layout.jsx
│   │       ├── RiskBadge.jsx
│   │       └── SignalsList.jsx
│   └── package.json
├── data/                        ← JSON database files (auto-created)
├── package.json
├── env.example                  ← Copy to .env and add your keys
└── README.md
```

## API Endpoints

### Collection

- `POST /api/collect` - Receive fingerprint data from tracking script

### Dashboard API

- `GET /api/dashboard/:storeId` - Dashboard summary stats
- `GET /api/visitors/:storeId` - List all visitors
- `GET /api/visitor/:storeId/:visitorId` - Visitor details
- `GET /api/alerts/:storeId` - List alerts
- `PATCH /api/alerts/:alertId` - Update alert status
- `GET /api/activity/:storeId` - Recent activity feed

## Deployment

### Railway

1. Push to GitHub
2. Connect Railway to your repo
3. Add environment variables in Railway dashboard
4. Deploy

### Environment Variables for Production

```env
FINGERPRINT_PUBLIC_API_KEY=your_key
FINGERPRINT_SECRET_API_KEY=your_key
FINGERPRINT_REGION=Global
PORT=3001
NODE_ENV=production
```

## Demo Script

When presenting to stakeholders:

1. "Here's a Shopify store with our protection script installed"
2. "Watch the dashboard as I visit pages normally" → Low risk
3. "Now I'll open DevTools and browse quickly" → Risk increases
4. "I'll turn on a VPN" → Alert triggered
5. "The system caught suspicious behavior BEFORE any copying happened"
6. "If this visitor later creates a copycat site, we have their fingerprint as evidence"

## Limitations (POC)

- Uses JSON files for storage (production should use a real database)
- Single-tenant (hardcoded store ID)
- No authentication on dashboard
- Limited to FingerprintJS free tier capabilities

## Next Steps for Production

1. Replace JSON database with PostgreSQL/MongoDB
2. Add multi-tenancy support
3. Add authentication/authorization
4. Implement real-time WebSocket updates
5. Add email/Slack notifications for alerts
6. Build historical analytics and trends
7. Integrate with takedown services

## License

MIT


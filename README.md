# InsightFlow Analytics Dashboard

A modern analytics dashboard prototype for aggregating and analyzing user feedback, featuring **User Journey** and **Conversion Rate** dashboards that can be viewed synoptically to derive meaningful insights.

![Dashboard Preview](https://via.placeholder.com/800x400?text=InsightFlow+Analytics+Dashboard)

## Features

### User Journey Dashboard
- **Total Sessions** tracking
- **Average Session Duration** metrics
- **Churn Rate** monitoring
- **Drop-off Points** identification
- **Time per Activity** analysis
- **Activity Breakdown** visualization

### Conversion Rates Dashboard
- **Bounce Rate** tracking
- **Conversion Rate** metrics
- **Revenue Analytics** (Total Revenue, AOV)
- **Funnel Visualization** with step-by-step analysis
- **Daily Conversion Trends**
- **Funnel Drop-off** identification

### AI-Powered Insights Bot
- Predefined questions for quick insights
- Category-based filtering (Journey, Conversion, General)
- AI-generated recommendations
- Powered by Cloudflare Workers AI

## Tech Stack

- **Backend**: Cloudflare Workers with Hono framework
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: Cloudflare D1 (SQLite)
- **Caching**: Cloudflare KV
- **AI**: Cloudflare Workers AI
- **Charts**: Chart.js + react-chartjs-2

## Prerequisites

- Node.js 18+ installed
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/insightflow-dashboard.git
cd insightflow-dashboard
```

### 2. Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 3. Set Up Cloudflare Resources

#### Create D1 Database
```bash
wrangler d1 create insightflow-db
```

Copy the `database_id` from the output and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "insightflow-db"
database_id = "your-actual-database-id"
```

#### Create KV Namespace
```bash
wrangler kv namespace create CACHE
```

Copy the `id` from the output and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-actual-kv-namespace-id"
```

### 4. Initialize Database

```bash
# Initialize schema locally
npm run db:init

# Seed with sample data locally
npm run db:seed
```

### 5. Run Development Server

```bash
# Start the Worker dev server (backend)
npm run dev

# In another terminal, start the frontend dev server
cd frontend && npm run dev
```

Visit `http://localhost:5173` to see the dashboard.

## Deployment

### Deploy to Cloudflare Workers

1. **Initialize Remote Database**
```bash
npm run db:init:remote
npm run db:seed:remote
```

2. **Build and Deploy**
```bash
npm run deploy
```

Your dashboard will be available at `https://insightflow-dashboard.<your-subdomain>.workers.dev`

## Project Structure

```
insightflow-dashboard/
├── src/                          # Worker source code
│   ├── index.ts                  # Main entry point
│   ├── types.ts                  # TypeScript types
│   └── routes/
│       ├── api.ts                # Data API routes
│       └── ai.ts                 # AI insights routes
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── App.tsx              # Main app component
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── UserJourneyDashboard.tsx
│   │   │   ├── ConversionDashboard.tsx
│   │   │   └── AIBot.tsx
│   │   ├── hooks/
│   │   │   └── useApi.ts        # Data fetching hooks
│   │   └── styles/
│   │       └── index.css        # Global styles
│   ├── package.json
│   └── vite.config.ts
├── schema.sql                    # D1 database schema
├── seed.sql                      # Sample data
├── wrangler.toml                 # Cloudflare configuration
├── package.json
└── README.md
```

## API Endpoints

### Journey Metrics
- `GET /api/journey/metrics` - Get user journey metrics
- `GET /api/journey/sessions` - Get session timeline data
- `GET /api/journey/flow` - Get user flow data

### Conversion Metrics
- `GET /api/conversion/metrics` - Get conversion metrics
- `GET /api/conversion/funnel` - Get funnel data

### AI Insights
- `GET /api/ai/questions` - Get predefined questions
- `POST /api/ai/insight` - Get AI-generated insight for a question

### Utility
- `GET /api/health` - Health check
- `POST /api/cache/clear` - Clear cached metrics

## Cloudflare Bindings

This project uses three Cloudflare bindings:

| Binding | Type | Purpose |
|---------|------|---------|
| `DB` | D1 Database | Store user sessions, activities, and conversions |
| `CACHE` | KV Namespace | Cache computed metrics for performance |
| `AI` | Workers AI | Generate insights from predefined questions |

## Customization

### Adding New Metrics

1. Update the schema in `schema.sql`
2. Add new API routes in `src/routes/api.ts`
3. Update the types in `src/types.ts`
4. Create/update React components in `frontend/src/components/`

### Adding AI Questions

Edit the `PREDEFINED_QUESTIONS` array in `src/routes/ai.ts`:

```typescript
{
  id: 'custom1',
  category: 'general',
  question: 'Your custom question here?',
  context: 'Context for AI to generate relevant insights',
}
```

### Styling

All styles are in `frontend/src/styles/index.css`. The dashboard uses CSS custom properties for easy theming:

```css
:root {
  --primary: #6366f1;
  --bg-primary: #0f172a;
  /* ... */
}
```

## Sample Data

The `seed.sql` file includes realistic sample data:
- 40 user sessions over 30 days
- 67 user activities with various patterns
- 5-step conversion funnel
- 54 conversion events with revenue
- User feedback entries

## Troubleshooting

### Database not initialized
```bash
npm run db:init
npm run db:seed
```

### Frontend not loading data
- Ensure the Worker dev server is running on port 8787
- Check browser console for CORS errors
- Verify the Vite proxy configuration

### AI insights not working
- Ensure AI binding is configured in `wrangler.toml`
- Fallback insights are provided when AI is unavailable

## License

MIT License - feel free to use this for your projects!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with Cloudflare Workers, React, and Chart.js

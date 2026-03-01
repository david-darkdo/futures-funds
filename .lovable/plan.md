

## Plan: Demo Investment Experience

This is a large feature. Here's the approach broken into clear deliverables.

### Architecture Overview

```text
┌─────────────────────────────────────────────┐
│  Database: demo_investments table           │
│  (client-side growth calc, no cron needed)  │
├─────────────────────────────────────────────┤
│  Hook: useDemoInvestment                    │
│  - Fetches demo investment for user         │
│  - Calculates growth based on created_at    │
│  - Returns same shape as useMultiInvestment │
├─────────────────────────────────────────────┤
│  UI Components                              │
│  - DemoSection on homepage (new section)    │
│  - CreateDemoDialog (amount picker)         │
│  - DashboardPortfolio integration           │
│  - Withdraw → redirect to real investment   │
└─────────────────────────────────────────────┘
```

### 1. Database: `demo_investments` table

Create a new table to track demo investments separately from real ones:
- `id`, `user_id`, `bundle_id`, `initial_amount`, `created_at`
- No admin interaction needed; growth is computed client-side from `created_at`
- RLS: users can SELECT/INSERT/DELETE their own rows only
- One demo per user (enforced in app logic)

### 2. Growth Calculation (Client-Side, Deterministic)

The growth cycle repeats every 3 days from `created_at`:
- **Day 1 of cycle**: +25% of current total
- **Day 2 of cycle**: no change (hold)
- **Day 3 of cycle**: -10% of current total

This is computed deterministically from `created_at` using `Math.floor(daysSinceStart)` — no cron job needed. Each day's balance is derived by iterating the cycle from day 0.

### 3. New Hook: `useDemoInvestment`

- Fetches user's demo investment from `demo_investments`
- Joins the "STANDARD PLAN" bundle info
- Computes current value, growth percentage, and chart data points by iterating the cycle day-by-day
- Generates simulated transaction history for the chart
- Returns: `demoInvestment`, `currentValue`, `growthPercentage`, `chartData`, `timelineEvents`, `loading`

### 4. Homepage: Demo Section

Add a new `DemoSection` component between PlansSection and SecuritySection on the homepage:
- Header: "Try Before You Invest" with tooltip explaining the demo
- Description convincing users to try the demo experience
- "Create Demo Investment" CTA button → links to `/signup` for unauthenticated, or opens dialog for authenticated users
- Visually distinct section with its own styling

### 5. Dashboard Integration

**DashboardStart page**: Add a "Try Demo Investment" card/button alongside the existing "Start New Investment" flow. Opens a dialog where user picks any amount and confirms.

**DashboardPortfolio page**: Modify to also display demo investment data:
- If user has a demo investment (and no real one), show demo portfolio with a "DEMO" badge
- If user has both, show demo as a separate card below the real portfolio
- Charts, growth indicators, profit ticker all work with demo data
- "Withdraw" button on demo → opens the real PaymentUploadDialog instead (redirect to real investment)

**useUserState hook**: Update to consider demo investments — if user has a demo but no real investment, route to portfolio view so they can see the demo dashboard.

**DashboardSidebar**: Portfolio link becomes accessible when user has a demo investment.

### 6. Create Demo Dialog

Simple dialog component:
- Shows the Standard Plan bundle info
- Amount input (user picks any amount)
- "Start Demo" button inserts into `demo_investments`
- Toast confirmation

### 7. Withdraw Redirect Logic

When user clicks "Withdraw" on a demo investment:
- Instead of opening WithdrawalRequestDialog, open PaymentUploadDialog
- Show a toast: "Ready to invest for real? Create your first real investment!"
- Demo funds are not affected

### 8. Notifications in Dashboard

The MessagingPanel and activity timeline will show demo-specific messages:
- "Demo Day 1: +25% growth applied"
- "Demo Day 2: Holding steady"
- "Demo Day 3: -10% market adjustment"
- Generated from the deterministic cycle, no DB needed

### Technical Details

- **Bundle used**: "STANDARD PLAN" (id: `dfd788e8-1a28-48c7-83bf-d91338fae6a8`)
- **No edge function or cron needed** — growth is purely deterministic from timestamp
- **No impact on admin panel** — demo_investments is a separate table, invisible to admin flows
- **RLS policies**: users can only see/create/delete their own demo investments

### Files to Create
- `supabase/migrations/xxx_create_demo_investments.sql`
- `src/hooks/useDemoInvestment.ts`
- `src/components/home/DemoSection.tsx`
- `src/components/dashboard/CreateDemoDialog.tsx`

### Files to Modify
- `src/pages/Index.tsx` — add DemoSection
- `src/pages/dashboard/DashboardStart.tsx` — add demo CTA
- `src/pages/dashboard/DashboardPortfolio.tsx` — integrate demo data
- `src/hooks/useUserState.ts` — consider demo investments for routing
- `src/components/dashboard/DashboardSidebar.tsx` — unlock portfolio for demo users
- `src/components/auth/DashboardRoute.tsx` — allow demo state


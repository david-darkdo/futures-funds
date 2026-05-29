# Implementation Plan — Final Connect Pass

Goal: keep the new premium UI, rewire business logic to the new deposit→balance→invest→profit model, preserve all admin/deposit/bundle/transaction logic, complete translations, fix WhatsApp overlap, enable Google sign-in.

---

## 1. Database changes (single migration)

New columns / tables:

- `profiles.main_balance numeric default 0` — approved deposit cash available to invest/withdraw
- `profiles.profit_balance numeric default 0` — accumulated completed profits
- `profiles.investing_frozen boolean default false` — admin manual freeze
- `user_investments`: add `matures_at timestamptz`, `completed_at timestamptz`, allow `state` values `running` and `completed`
- `payments.bundle_id` becomes nullable (deposits no longer require a bundle)
- `payments.amount_usd numeric` — explicit deposit amount entered by user
- New enum value (or text) for `transactions.type`: `deposit_submitted`, `deposit_approved`, `deposit_rejected`, `investment_started`, `investment_completed`, `profit_added`, `withdrawal_requested`, `withdrawal_approved`, `withdrawal_rejected`
- Trigger on `payments` UPDATE: when status → `approved` for a pure deposit (no bundle), credit `profiles.main_balance` and insert a `deposit_approved` transaction. Mirror for `rejected`.
- RPC `invest_from_balance(bundle_id uuid, amount numeric)` — SECURITY DEFINER; validates `amount <= main_balance` and not frozen; deducts main_balance; inserts `user_investments(state='running', initial_amount, current_value=amount, matures_at=now()+24h)`; inserts `investment_started` transaction.
- RPC `complete_matured_investments()` — for each `running` investment with `matures_at <= now()`: compute profit = `initial_amount * bundle.daily_growth_rate/100`; credit `profit_balance`; return principal to `main_balance`; set state `completed`, `completed_at`; insert `investment_completed` + `profit_added` transactions.
- RPC `request_withdrawal(amount, wallet, network, currency)` — validates `amount <= main_balance + profit_balance`; debits profit first then main; inserts withdrawal + `withdrawal_requested` transaction.
- Adjust `validate_withdrawal_amount` trigger to use new balance fields instead of sum of active investments.
- Withdrawal status trigger: on `approved`/`rejected` insert matching transaction; on `rejected` refund balances.

## 2. Frontend wiring

- **PaymentUploadDialog** → rename concept to "Deposit": collect USD amount + crypto info + proof; no bundle picker.
- **New `InvestDialog`** triggered by Invest quick-action and `/plans` "Invest" buttons: pick bundle, enter amount (max = main_balance), validate, call `invest_from_balance` RPC, toast success/insufficient.
- **HeroBalanceCard**: feed from `profiles.main_balance`, sum of running `user_investments.initial_amount`, `profiles.profit_balance`.
- **`useMaturityTicker` hook**: on dashboard mount + every 60s call `complete_matured_investments` then refresh; also countdown badge per running investment.
- **WithdrawalRequestDialog**: max = main_balance + profit_balance; call `request_withdrawal` RPC.
- **RecentTransactions / DashboardTransactions**: render all new transaction types with friendly labels (notification-style copy).
- **Admin UsersTable**: add "Freeze investing" toggle that flips `profiles.investing_frozen`.
- **QuickActions Invest button**: disabled with tooltip when `investing_frozen`.

## 3. WhatsApp widget

Make `WhatsAppSupport` draggable (pointer events, persist position in localStorage), constrain inside viewport, force `bottom > 6rem + safe-area` so it always sits above `BottomNav`, `z-[60]`.

## 4. Auth / Google sign-in

- Run `configure_social_auth` with `providers:["google"]`.
- Add "Continue with Google" button on Login + Signup using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- Ensure Sign Out lives in `DashboardSettings` and sidebar; Login link visible in Navbar when logged out (already there — verify no BottomNav overlap by hiding BottomNav on auth pages, already done).

## 5. Translations sweep

- Audit homepage sections (`HeroSection`, `WhySection`, `HowItWorksSection`, `PlansSection`, `SecuritySection`, `DemoSection`, `CTASection`, `Footer`, `Navbar`) + dialogs (`PaymentUploadDialog`, `WithdrawalRequestDialog`, `InvestDialog`, `CreateDemoDialog`) + `DashboardTransactions`, `DashboardSettings`, `DashboardPending`, `Plans`, `AdminProofs` user-facing strings.
- Extract every hardcoded string into `t()` keys; add to `en/fr/es/de`.
- Persist language: already in localStorage via `i18n` + saved to `profiles.language` on change in settings (already wired).

## 6. Preserve existing

- Admin panel pages, bundle CRUD, payment proof upload bucket + AdminProofs page, existing transaction list rendering, demo investment logic — all untouched except for additive changes.

---

## Technical Notes

- Use Postgres triggers + RPCs for atomic balance moves (avoid race conditions client-side).
- `complete_matured_investments` runs on client poll (no cron needed); idempotent via state check.
- All new GRANTs included for any new function (`EXECUTE TO authenticated`).
- Keep RLS: balances readable only by owner & admins (already covered by existing profiles policies).
- Transaction type enum: extend with `ALTER TYPE ... ADD VALUE` for each new variant.

---

## Order of operations

1. Migration (schema + triggers + RPCs)
2. Hooks: `useBalances`, `useMaturityTicker`, refactor `useDashboardData`, `useMultiInvestment`
3. Dialogs: refactor `PaymentUploadDialog`, create `InvestDialog`, update `WithdrawalRequestDialog`
4. Admin freeze toggle in `UsersTable`
5. WhatsApp draggable
6. Google sign-in buttons + `configure_social_auth`
7. Translation pass across listed files + locale JSON updates
8. Smoke-test flows in preview

Estimated scope: ~1 migration, ~20 file edits, ~3 new files.
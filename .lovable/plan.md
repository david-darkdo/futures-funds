# Investment Lifecycle and User State Management Plan

## Goal
Keep the current FutureFunds screens and visual language, while moving sensitive investment and balance actions behind atomic, server-enforced controls.

## 1. Secure the financial foundation
- Prevent normal users from changing balances or the investing freeze through profile updates.
- Restrict management-only investment edits to protected database functions.
- Ensure management identity is taken from the signed-in account, not submitted by the browser.
- Fix withdrawal approval so it no longer mutates an active investment or creates duplicate ledger effects.
- Tighten the public chat-upload storage rules without disrupting the existing chat flow.

## 2. Centralize investment lifecycle actions
- Add protected actions for management growth/drawdown, percentage changes, pause/resume, and completion.
- Lock the investment row during each action and reject invalid or repeated operations.
- Complete investments with one transaction: calculate final profit, return principal, credit profit, mark completion, and write immutable ledger/audit records.
- Preserve completed investment history; later percentage edits apply only to eligible active investments.
- Use maturity timestamps as the source of truth and ensure matured investments cannot continue accumulating.

## 3. Upgrade the existing management screens
- Keep the current Investment Management page and connect its controls to the protected actions.
- Add completion confirmation with settlement details and an optional management reason.
- Add effective percentage editing with previous percentage, new percentage, administrator, timestamp, and reason.
- Add a User State Management page to the existing management navigation with search, filters, user balances, investment summaries, status/freeze controls, activity, and a detail view.
- Add management audit history and targeted user notifications without introducing broadcast behavior.

## 4. Reconcile user-facing data
- Update investment and balance reads to show principal, current value, realized profit, percentage, maturity, and completed settlement clearly.
- Keep dashboard totals consistent with the ledger and prevent completed investments from appearing active.
- Refresh affected dashboards immediately after management actions.

## 5. Validate
- Run the database security scan again.
- Verify normal users cannot alter financial fields or call management actions.
- Verify signed-in management can apply, audit, pause/resume, and settle an investment exactly once.
- Verify completed history remains unchanged after later active-investment edits.
- Verify the existing dashboard, withdrawals, chat uploads, and routes remain functional.

## Technical details
- Database changes will use one approved Lovable Cloud migration with explicit grants, RLS, security-definer functions, row locks, and validation.
- Existing tables (`profiles`, `user_investments`, `investment_growth_logs`, `transactions`, `admin_logs`) will be reused where possible.
- New persisted structures will be limited to targeted user notifications and audit/history data required by the requested management workflow.
- The frontend will call typed RPCs through the existing client and will not directly write balances or investment financial fields.

## Implementation Status: COMPLETED & VERIFIED
- [x] Phase 1: Secure financial foundation (RLS, protected procedures, strict access controls)
- [x] Phase 2: Centralize investment lifecycle actions (atomic settlement engine, double-completion protection, pause/resume, rate adjustments)
- [x] Phase 3: Upgrade management screens (User State management, detailed inspection drawer, audit logs, targeted notifications)
- [x] Phase 4: Reconcile user-facing data (accurate balance reads, portfolio sync, resilient queries)
- [x] Phase 5: UI & Design overhaul (Luxury Ash Slate palette, high-contrast typography, 1-click ThemeToggle in Dashboard & Navbar)

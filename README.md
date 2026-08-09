# Future Funds Hub

🔷 PROJECT NAME

FutureFunds — Crypto Investment Dashboard Platform


---

🎯 CORE PURPOSE

Build a standard, professional, high-trust crypto investment platform where:

1. Users visit a convincing investment homepage


2. Users sign up & log in


3. Users access a private dashboard


4. Users purchase investment bundles


5. Payments are done via crypto only


6. Users upload payment screenshot as proof


7. Admin verifies payment manually


8. Admin updates user’s purchased bundle


9. User dashboard updates automatically after admin approval




---

🧱 SYSTEM STRUCTURE (IMPORTANT)

✅ ONE Backend

✅ ONE Database

✅ ONE Admin Panel

✅ ONE User Dashboard System

✅ Crypto Manual Payment System (Screenshot Proof)



---

🎨 DESIGN STANDARD & STYLE

Luxury, clean, modern, standard investment look 3D and animation H4

Colors: Dark mode + Gold accents OR Deep Blue + Neon accents

Smooth animations

Professional financial UI

Trust-building sections

Mobile + Desktop fully responsive

Fast loading



---

🏠 HOMEPAGE SECTIONS (MANDATORY)

1. Hero Section

Tagline like:
“Smart Crypto Investment. Transparent Growth. Secure Future.”

Call-to-Action Buttons:

✅ Get Started

✅ View Plans




2. Why FutureFunds

Security

Manual verification

Crypto opportunity focus

Risk management



3. How It Works

Register account

Choose bundle

Pay with crypto

Upload screenshot

Admin verifies

Dashboard activates



4. Investment Bundles Preview

Starter

Pro

Institutional (No fixed profits promise)



5. Security & Transparency

Manual verification

No auto wallets

Admin controlled



6. Footer

Contact

Terms

Privacy Policy

Telegram / WhatsApp link





---

🔐 AUTH SYSTEM

User Signup

User Login

Encrypted passwords

Forgotten password reset

Email verification (optional but recommended)



---

🧑‍💻 USER DASHBOARD FEATURES

Each user must see:

Welcome message with username

Account Status (Active / Pending / Inactive)

Purchased Bundle (None / Starter / Pro etc)

Payment Status:

Pending

Approved

Rejected


Uploaded Payment Proof (image preview)

Investment Summary (Static, controlled by admin)

Logout button



---

💳 PAYMENT SYSTEM (CRYPTO ONLY – MANUAL)

Users should:

1. Click Purchase Bundle


2. Select bundle


3. See admin crypto wallet address


4. Pay externally


5. Upload:

Screenshot image proof

Transaction ID (optional input)



6. Submit for Admin Review


7. Payment goes into:

Database as PENDING





---

🛡️ ADMIN PANEL (VERY IMPORTANT)

Admin must be able to:

Login securely

View all registered users

View each user’s:

Email

Bundle selected

Uploaded screenshot

Payment status


Approve / Reject payments

Assign bundles to users manually

Change user status:

Pending → Active


Upload investment updates to user dashboard

Disable or delete users

Change crypto wallet addresses anytime



---

🗃️ DATABASE STRUCTURE (REQUIRED)

Tables / Collections:

1️⃣ USERS

ID

Name

Email

Password

Status


2️⃣ BUNDLES

Bundle Name

Price

Description


3️⃣ PAYMENTS

User ID

Bundle Selected

Screenshot URL

Payment Status

Timestamp


4️⃣ ADMIN

Admin login credentials



---

⚙️ BACKEND REQUIREMENT

Use ONLY ONE backend to handle:

Authentication

Database

File uploads

Admin controls

User dashboards

Payment verification


✅ Recommended stack:

Firebase OR Supabase (Beginner & Professional)

OR Node.js + MongoDB



---

🔐 SECURITY REQUIREMENTS

Secure password hashing

Admin protected routes

User protected routes

Secure file uploads

No public database access



---

🚀 DEPLOYMENT GOAL

Fully live website

Admin panel protected

User dashboards private

All data stored securely in database



7) Minimum developer tasks checklist (so Lovable knows deliverables)

Build frontend (React/Next preferred) implementing UI above.

Build backend API (Node/Express or Supabase server functions).

Implement authentication and admin roles.

Implement file upload pipeline to storage (private bucket).

Create RLS/security policies.

Implement payment submission flow with screenshot + txid.

Implement admin verification and audit logs.

Implement responsive UI & accessibility basics.

Write basic e2e tests for purchase->upload->approve flow.



“Build FutureFunds Admin Panel & User Dashboard exactly as specified in the attached UI spec and DB schema; use Supabase for auth, Postgres DB, and private storage for screenshots; implement server-side approve/reject using Supabase service_role and ensure RLS policies restrict user access to their own payments.”



Project: FutureFunds — Admin & User Dashboard UI + DB connection instructions

Goal (one sentence)

A professional, high-trust admin panel and responsive user dashboard for FutureFunds where users buy crypto-investment bundles (manual crypto payments with screenshot proof) and admin verifies and activates purchases.


---

1) Visual Style & Brand

Theme: Luxury investment — dark mode primary, deep navy / charcoal background, gold (#C8A34B) or teal accent. Clean, minimal, high-contrast typography (Inter / Poppins).

Tone: trust, clarity, calm confidence.

Layout: 12-col responsive grid. Desktop: left vertical nav (collapsed), content area right. Mobile: top hamburger menu -> slide-over nav.



---

2) Admin Panel UI (Detailed spec)

Admin: Global layout

Left vertical nav (icons + labels): Logo (top) → Dashboard → Payments → Users → Bundles → Activities → Settings → Wallets → Support → Logout.

Top bar: Admin name + avatar (right), quick search (center), notifications bell (payment/verification alerts), date/time (left).

Content area: cards, tables, and right-hand detail drawer.


Screens & components

1. Admin Dashboard (home)

KPI cards (top row, 4): Total Users, Pending Payments, Active Subscriptions, Monthly New Purchases.

Revenue sparkline (card) — shows count of purchases per day.

Recent payments table (small) — shows latest 8 payments, status badges (Pending, Approved, Rejected).

Quick actions: Approve top 3 pending, Send bulk message, Add Bundle.



2. Payments Queue

Filter row: status (Pending/Approved/Rejected), date range, bundle type, search by tx id / user email.

Main table columns: Checkbox | Date | User (clickable) | Bundle | Amount (display fiat+crypto) | TxID | Screenshot thumbnail | Status badge | Actions (View / Approve / Reject / Ask for proof).

Row action opens a detail drawer on the right:

Full-screen screenshot viewer with zoom/download

User mini profile (name/email/created at)

Bundle details & price

Transaction ID (edit field)

Admin comment field

Buttons: Approve (green), Reject (red) with reason template, Mark as Duplicate, Send Message to User




3. Users List

Table: ID | Name | Email | Status (Active/Pending/Banned) | Bundle | Joined | Actions (View / Impersonate / Edit).

Bulk actions: Export CSV, Send email, Change status.

Click View -> User Profile page:

Top: profile card, KYC if present.

Middle: Purchase history timeline, current bundle and start date.

Right: Admin controls: Manually assign bundle, Change status, Reset password, Notes (private).

Files: list of uploaded payment screenshots.




4. Bundles Management

Grid/list of bundles with Edit modal.

Add / Remove / Toggle-Active.

Fields: name, price (display in fiat and suggested crypto rates field), description, minimum holding, recommended period, image/icon, visibility.

Option: set auto-renew (no auto-execution — only for frontend label), growth message text for user dashboard.



5. Wallets (Admin)

Store and edit multiple crypto addresses (BTC, ETH, USDT, BNB...).

Each wallet: network, address, QR code, notes (e.g., “Use only for Starter bundle payments”).



6. Activity Log & Audit

Full immutable log: admin actions, payment approvals, user changes with timestamps and IP.



7. Settings

Admin users (roles), email templates, site settings, crypto address config, file upload limits, retention policies.



8. Notifications

Real-time toasts for new payments.

Bell center: list with quick links to Payment detail.




Micro-interactions & UX

Status badges with color: Pending (amber), Approved (green), Rejected (red).

Confirm modal for Approve/Reject with required reason if rejecting.

Images open in zoom lightbox with metadata (filename, upload date, user).

Accessibility: keyboard shortcuts for Approve (A) / Reject (R) on selected row.



---

3) User Dashboard Layout (Detailed spec)

Global layout

Top nav: Logo (left), Menu (Mobile), Balance / Active bundle summary (right), profile dropdown.

Left or top quick-nav: Overview, My Bundles, Upload Payment, Transactions, Support, Settings, Logout.


Pages & components

1. Overview (Home)

Hero card: Greeting “Welcome back, [Name]” + account status badge.

Active bundle card: bundle name, start date, status (Pending/Active), growth text (non-quantified marketing copy e.g. “This bundle leverages curated crypto intelligence to target growth.”).

CTA buttons: Purchase New Bundle, Upload Payment (if pending).

Mini activity feed: last 5 events (uploaded proof, admin approved).



2. My Bundles

If none: show plan grid with starter/pro/professional, price (crypto/examples), short bullets, purchase button.

If bundle active: large card with bundle details, “Status: Active” or “Pending Verification”, and an “Upload Proof” button if pending.

Show recommended holding period, risk disclosure text.



3. Purchase Flow (UX)

Step 1: Select bundle

Step 2: Show admin wallet address (QR + copy button) and recommended network.

Step 3: After payment externally, user is prompted to upload screenshot and optional TxID in a single form:

Upload image file(s) (1–3), input TxID, notes.

Submit → status set to Pending.


Confirmation page: shows “Pending Verification” with expected admin turnaround (e.g., “Admin manually reviews and will activate within X hours” — optional).



4. Upload Payment (Stand-alone)

Form with recent payments list.

Upload preview + remove.

Submit button disabled until file + bundle selected.



5. Transactions

Table: Date | Bundle | Amount (crypto) | Status | Admin note | View screenshot.

Filter by status.



6. Support

Simple contact form + link to chat/Telegram/WhatsApp.

Ticket system list for user.



7. Settings

Profile, change password, notification preferences.




Microcopy & Legal

Every payment submission has a short legal notice: “Payments are manual and irreversible. FutureFunds will verify and activate upon confirmation. No financial guarantees are given.” (Must be shown before upload submit.)



---

4) Database Schema (Recommended; paste into dev prompt)

Use this schema for Supabase / PostgreSQL or any relational DB.

Tables

users

id (uuid, primary)

name (text)

email (text, unique)

password_hash (text)

role (enum: user, admin)

status (enum: pending, active, banned)

created_at (timestamp)

profile_meta (jsonb)


bundles

id (uuid)

name (text)

slug (text, unique)

price_usd (decimal)

price_reference (jsonb) — recommended crypto options

description (text)

active (boolean)

created_at


payments

id (uuid)

user_id (uuid, fk users.id)

bundle_id (uuid, fk bundles.id)

crypto_amount (decimal, nullable)

crypto_currency (text, nullable)

txid (text, nullable)

screenshot_url (text) — store file location

status (enum: pending, approved, rejected)

admin_id (uuid, nullable)

admin_note (text, nullable)

created_at (timestamp)

updated_at (timestamp)


admin_actions

id (uuid)

admin_id (uuid)

action_type (text)

target_table (text)

target_id (uuid)

note (text)

created_at


wallets

id (uuid)

network (text)

currency (text)

address (text)

label (text)

active (boolean)


activity_log

id (uuid)

user_id (uuid, nullable)

admin_id (uuid, nullable)

event (text)

meta (jsonb)

created_at


files

id, owner_id, url, content_type, size, created_at



---

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://futures-funds.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a42b5e9c-b9b9-43a1-885f-61e24060cc63).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

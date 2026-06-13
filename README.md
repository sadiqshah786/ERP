# AMAL ERP — Switcher Techno

A complete, beautiful ERP front-end built with **React + TypeScript + Vite + Tailwind + shadcn-style UI**, backed by **Firebase** (Auth + Firestore). Follows the AMAL ERP dashboard design.

## ✨ What's included

- **Pixel-faithful Dashboard** — crimson hero banner with live clock, KPI cards, Business Health gauges & ratios, Sales Intelligence funnel, Inventory Intelligence, Cash Flow (Recharts), Decision Support and Operational Metrics.
- **Full navigation** — dark sidebar with hover flyouts and nested sub-menus, matching the original (Dashboard, Settings, Maintain, Purchases, Sales, Store, Receipts, Payments, Journal, Salary, Fixed Assets, Reports).
- **All ~80 routes registered** and navigable.
- **Firebase Auth** — email/password sign in & sign up, protected routes.
- **Firestore CRUD** for master data (Customers, Vendors, Items, Banks, Employees, Chart of Accounts, Regions, Jobs, Units, Locations, Asset Categories/Register, Salary Staff, Users).
- **Transactional document builder** for every Sales / Purchase / Store / Receipt / Payment / Journal screen — header + party + line items + totals + post, with auto document numbering.
- **POS Counter Sale** — touch-friendly product grid + cart + checkout.
- **Reports** — filter + export scaffold for all report screens.
- **Demo mode** — runs with **no Firebase setup**, storing data in `localStorage`. Add real keys to switch to Firestore automatically.

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Sign in with **any email/password** (demo mode) — e.g. `admin@4incity.com` / `password`.

## 🔥 Connect your Firebase project

1. Create a project at <https://console.firebase.google.com>.
2. Enable **Authentication → Email/Password** and **Firestore Database**.
3. Copy `.env.example` to `.env` and fill in your config:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

The app detects the keys and automatically uses real Auth + Firestore (live `onSnapshot` updates).

## 🧱 Architecture

| Path | Purpose |
|------|---------|
| `src/lib/navigation.ts` | Single source of truth for sidebar **and** routes |
| `src/lib/schemas.ts` | Field/column config → drives `CrudPage` |
| `src/lib/docConfigs.ts` | Document config → drives `DocumentPage` |
| `src/lib/store.ts` | Data layer (Firestore *or* localStorage) |
| `src/routes.tsx` | Resolver mapping every path to a component |
| `src/components/ui/*` | shadcn-style primitives |

Adding a new master entity = one entry in `schemas.ts`. A new document type = one entry in `docConfigs.ts`. Routes and the sidebar update automatically.

## 📦 Scripts

- `npm run dev` — dev server
- `npm run build` — type-check + production build
- `npm run preview` — preview the build

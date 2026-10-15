# Crest Supply Tracker — Agent Implementation Plan

## Goal
Internal Arabic (RTL) PWA to track agricultural produce trips: supplier → factory, with field engineers following each trip until the factory accepts it and the lab analysis passes. Light accounting only (admin).

## Stack
Next.js (App Router, TypeScript) · Tailwind (RTL via `dir="rtl"`, logical properties `ms-/me-/ps-/pe-`) · Supabase (Postgres, Auth, Storage) · Vercel · Dexie (IndexedDB) · `browser-image-compression` · Serwist for the service worker · Arabic font (Cairo or IBM Plex Sans Arabic via `next/font`).

Schema: `001_schema.sql` (source of truth; don't redesign without asking).

## Core rules (do not break)
1. **Roles**: one `admin`, many `engineer`. Engineers see only their own trips. Authorization lives in RLS, never only in the UI.
2. **Login**: phone number + password. Internally the email is `<digits>@crest.local`. Normalize the phone (digits only, Egypt format `20…`) before building it.
3. **User management** (admin only) runs server-side with the service-role key (Server Action or Route Handler, never exposed to the client): create user (`email_confirm: true`), reset password, deactivate (`profiles.is_active=false`, no deletion).
4. **Engineer edit window**: an engineer can edit a trip while `status ∈ {loaded, in_transit, arrived}` and can set `factory_accepted`; after that the trip is read-only for them. Admin edits everything. Show a clear "locked, contact the admin" state.
5. **Price**: `trips.price_per_kg` = the factory-accepted price. When status becomes `factory_accepted`, prefill it from `product_current_price` and allow editing. Show the reference price with a badge: "سعر اليوم" if `is_today`, else "آخر تحديث منذ N يوم".
6. **Commission**: default from `settings`, copied onto each trip at creation, editable by admin only. Money amounts come from the generated columns; never recompute in the client.
7. **Weight**: stored in kg; display helper formats ≥ 1000 kg as tons (e.g. `2.5 طن`), otherwise kg. Arabic-Indic or Latin digits: use Latin digits consistently.
8. **Reroute**: changing `factory_id` on the same trip, status back to `in_transit`/`arrived`. Final `rejected` only when no factory takes it.
9. **Dropdowns, not free text** for supplier, factory, product (searchable combobox). Supplier list can be filtered by the chosen product via `supplier_products`; same for factories.
10. **No hard deletes** on master data; use `is_active`.

## Photos
- One photo per trip + plate text field.
- Client side before upload: resize to max 1600px, WebP, quality ~0.7, then generate a ~20px wide blurred placeholder and store it as base64 in `trips.photo_blur`.
- Upload to private bucket `trip-photos` at `<engineer_id>/<trip_id>.webp`.
- Lists show the blurred placeholder (CSS blur + "tap to view" icon). Full image is fetched via a signed URL only on tap (modal viewer).

## Offline
- Client generates `trips.id` as UUID v4.
- Dexie tables: `outbox` (pending create/update ops + image blobs), `cache` (suppliers, factories, products, current prices, junction tables, own trips).
- Reads: show cache first, refresh in background (stale-while-revalidate).
- Writes: apply locally, enqueue, sync when `navigator.onLine` + on app focus; retry with backoff; show per-trip sync badge (مزامنة / تم).
- Idempotent upserts by `id`. On RLS rejection (e.g. trip got locked), mark the op failed and show the reason.
- Upload image first, then upsert the trip row.
- Service worker: precache app shell, runtime-cache fonts/static assets. Don't cache authenticated API responses in the SW (Dexie handles data).

## Screens
**Engineer**: login · my trips (paginated, filters, sync badges) · new/edit trip · suppliers (list/add/edit) · profile/logout.
**Admin**: all trips with filters · trip detail/edit (all fields, status, commission, analysis note) · users CRUD · suppliers · factories (+ their products) · products (+ daily price entry) · settings (default commission) · simple accounting summary (see below).

## Trips list
- Filters: engineer (admin only), factory, product, supplier, status, date from/to, plate search.
- Pagination: 20/page. At this scale `range()` with exact count is fine; keep the query shape ready for keyset on `(trip_date desc, trip_no desc)`.
- Each filter maps to an existing index. Sync filters to the URL query string.
- Status chips in Arabic: تم التحميل · في الطريق · وصلت · قُبلت من المصنع · اجتاز التحليل · رُفض التحليل · مرفوضة.

## Accounting (minimal, admin)
Use `trips_accounting` view. Page with date range + optional factory/product/supplier filters showing totals: total weight, gross, commission (company profit), supplier payable. Only trips with `status = 'analysis_accepted'` count as final; show others as "قيد التنفيذ" separately. Export CSV.

## Phases
1. **Foundation**: Next.js + Supabase setup, run schema, RTL layout, auth (phone login), role-aware middleware, admin seed script.
2. **Master data**: products + daily price, factories, suppliers, junction links, admin user management.
3. **Trips online**: create/edit/list/filter/paginate, status flow, lock rules, price prefill, admin edit flows. Test RLS with an engineer account and an admin account.
4. **Photos**: compression, blur placeholder, signed-URL viewer.
5. **PWA + offline**: manifest, icons, Serwist, Dexie cache + outbox, sync badges, iOS install hint.
6. **Accounting + polish**: summary page, CSV, empty/error states, loading skeletons, real-device test on a low-end Android and iPhone.

## Acceptance checks
- An engineer can never read or write another engineer's trip (verify via direct Supabase queries, not just the UI).
- An engineer can't change `engineer_id`, `commission_pct` or edit after `factory_accepted`.
- Creating a trip offline with a photo, then going online, produces exactly one trip and one photo.
- Lists scroll smoothly with blurred placeholders and no full-size images loaded.
- Weight 2500 kg displays as "2.5 طن" and is stored as 2500.

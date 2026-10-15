-- Crest supply tracking — Supabase schema
-- Weight in kg, money in EGP. Run in order. Review RLS before production.

create extension if not exists pg_trgm;

-- ============ ENUMS ============
create type user_role as enum ('admin', 'engineer');

-- Lifecycle of a trip:
-- loaded -> in_transit -> arrived -> factory_accepted -> analysis_accepted
--                                  \-> analysis_rejected -> (admin changes factory, back to in_transit/arrived)
--                                  \-> rejected (final: no factory took it)
create type trip_status as enum (
  'loaded', 'in_transit', 'arrived',
  'factory_accepted',
  'analysis_accepted', 'analysis_rejected',
  'rejected'
);

create type product_state as enum ('fresh', 'frozen');

-- ============ HELPERS ============
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============ PROFILES (1:1 with auth.users) ============
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text not null unique,           -- digits only, e.g. 201012345678
  role        user_role not null default 'engineer',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- role/active checks used by RLS (security definer avoids recursive RLS)
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and is_active);
$$;

create or replace function is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_active);
$$;

-- ============ SETTINGS (single row) ============
create table settings (
  id                     boolean primary key default true check (id),  -- forces one row
  default_commission_pct numeric(5,2) not null default 0 check (default_commission_pct between 0 and 100),
  updated_at             timestamptz not null default now()
);
insert into settings default values;

-- ============ MASTER DATA ============
create table products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                  -- e.g. فراولة
  state       product_state not null,         -- fresh / frozen
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (name, state)
);

-- Daily reference price per kg (history). Latest row = "current".
create table product_prices (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete restrict,
  price_date  date not null default (timezone('Africa/Cairo', now()))::date,
  price_per_kg numeric(10,2) not null check (price_per_kg >= 0),
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  unique (product_id, price_date)
);

create table suppliers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  address     text,
  notes       text,                           -- quality notes etc.
  is_active   boolean not null default true,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_suppliers_updated before update on suppliers
  for each row execute function set_updated_at();
create index suppliers_name_trgm on suppliers using gin (name gin_trgm_ops);

create table factories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  address     text,
  notes       text,                           -- required quality etc.
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_factories_updated before update on factories
  for each row execute function set_updated_at();
create index factories_name_trgm on factories using gin (name gin_trgm_ops);

-- "Tags" as real links so they can drive dropdown filtering
create table supplier_products (
  supplier_id uuid not null references suppliers(id) on delete cascade,
  product_id  uuid not null references products(id)  on delete restrict,
  primary key (supplier_id, product_id)
);
create table factory_products (
  factory_id  uuid not null references factories(id) on delete cascade,
  product_id  uuid not null references products(id)  on delete restrict,
  primary key (factory_id, product_id)
);

-- ============ TRIPS ============
create table trips (
  id             uuid primary key,            -- generated on the client (offline-safe)
  trip_no        bigint generated always as identity unique,  -- human-friendly number
  trip_date      date not null default (timezone('Africa/Cairo', now()))::date,

  engineer_id    uuid not null references profiles(id) on delete restrict,
  supplier_id    uuid not null references suppliers(id) on delete restrict,
  product_id     uuid not null references products(id)  on delete restrict,
  factory_id     uuid references factories(id) on delete restrict,   -- may be set/changed later

  status         trip_status not null default 'loaded',

  plate_number   text,                        -- Egyptian plate as text
  photo_path     text,                        -- storage path of the single photo
  photo_blur     text,                        -- tiny base64 placeholder for lists

  weight_kg      numeric(12,3) check (weight_kg > 0),   -- preliminary, then factory-accepted weight
  price_per_kg   numeric(10,2) check (price_per_kg >= 0), -- the factory-accepted price
  commission_pct numeric(5,2)  not null check (commission_pct between 0 and 100),

  analysis_note  text,
  notes          text,

  -- derived money (null until weight and price exist)
  gross_amount      numeric(14,2) generated always as (round(weight_kg * price_per_kg, 2)) stored,
  commission_amount numeric(14,2) generated always as (round(weight_kg * price_per_kg * commission_pct / 100, 2)) stored,
  supplier_payable  numeric(14,2) generated always as (round(weight_kg * price_per_kg * (1 - commission_pct / 100), 2)) stored,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_trips_updated before update on trips
  for each row execute function set_updated_at();

-- Fill commission from settings when the client doesn't send one
create or replace function trips_default_commission() returns trigger
language plpgsql as $$
begin
  if new.commission_pct is null then
    select default_commission_pct into new.commission_pct from settings;
  end if;
  return new;
end $$;
-- NOTE: commission_pct is NOT NULL so the BEFORE trigger must run first:
create trigger trg_trips_commission before insert on trips
  for each row execute function trips_default_commission();

-- Engineers can't touch ownership/commission, nor edit after factory acceptance
create or replace function trips_guard_engineer() returns trigger
language plpgsql as $$
begin
  if is_admin() then return new; end if;
  if new.engineer_id <> old.engineer_id
     or new.commission_pct <> old.commission_pct
     or new.trip_no <> old.trip_no then
    raise exception 'not allowed';
  end if;
  return new;
end $$;
create trigger trg_trips_guard before update on trips
  for each row execute function trips_guard_engineer();

-- Indexes for the filters + keyset pagination (trip_date desc, trip_no desc)
create index trips_list_idx       on trips (trip_date desc, trip_no desc);
create index trips_engineer_idx   on trips (engineer_id, trip_date desc, trip_no desc);
create index trips_factory_idx    on trips (factory_id, trip_date desc);
create index trips_product_idx    on trips (product_id, trip_date desc);
create index trips_supplier_idx   on trips (supplier_id, trip_date desc);
create index trips_status_idx     on trips (status, trip_date desc);
create index trips_plate_idx      on trips (plate_number);

-- ============ VIEWS ============
-- Latest reference price per product + freshness flag for the UI
create view product_current_price with (security_invoker = true) as
select distinct on (p.id)
  p.id as product_id, p.name, p.state,
  pp.price_per_kg, pp.price_date,
  (pp.price_date = (timezone('Africa/Cairo', now()))::date) as is_today,
  (timezone('Africa/Cairo', now()))::date - pp.price_date  as days_old
from products p
left join product_prices pp on pp.product_id = p.id
order by p.id, pp.price_date desc;

-- Admin accounting summary (security_invoker: engineers only see their own rows)
create view trips_accounting with (security_invoker = true) as
select
  t.id, t.trip_no, t.trip_date, t.status,
  t.engineer_id, e.full_name as engineer_name,
  t.supplier_id, s.name as supplier_name,
  t.factory_id,  f.name as factory_name,
  t.product_id,  p.name as product_name, p.state as product_state,
  t.weight_kg, t.price_per_kg, t.commission_pct,
  t.gross_amount, t.commission_amount, t.supplier_payable
from trips t
join profiles  e on e.id = t.engineer_id
join suppliers s on s.id = t.supplier_id
join products  p on p.id = t.product_id
left join factories f on f.id = t.factory_id;

-- ============ ROW LEVEL SECURITY ============
alter table profiles          enable row level security;
alter table settings          enable row level security;
alter table products          enable row level security;
alter table product_prices    enable row level security;
alter table suppliers         enable row level security;
alter table factories         enable row level security;
alter table supplier_products enable row level security;
alter table factory_products  enable row level security;
alter table trips             enable row level security;

-- profiles: see own (admin sees all); only admin writes (via service role anyway)
create policy profiles_select on profiles for select
  using (id = auth.uid() or is_admin());
create policy profiles_admin_write on profiles for all
  using (is_admin()) with check (is_admin());

-- settings
create policy settings_select on settings for select using (is_active_user());
create policy settings_admin  on settings for all using (is_admin()) with check (is_admin());

-- products / prices / factories: everyone reads, admin writes
create policy products_select on products for select using (is_active_user());
create policy products_admin  on products for all using (is_admin()) with check (is_admin());
create policy prices_select   on product_prices for select using (is_active_user());
create policy prices_admin    on product_prices for all using (is_admin()) with check (is_admin());
create policy factories_select on factories for select using (is_active_user());
create policy factories_admin  on factories for all using (is_admin()) with check (is_admin());
create policy factory_products_select on factory_products for select using (is_active_user());
create policy factory_products_admin  on factory_products for all using (is_admin()) with check (is_admin());

-- suppliers: engineers enter and edit suppliers; deletion is admin only
create policy suppliers_select on suppliers for select using (is_active_user());
create policy suppliers_insert on suppliers for insert with check (is_active_user());
create policy suppliers_update on suppliers for update using (is_active_user()) with check (is_active_user());
create policy suppliers_delete on suppliers for delete using (is_admin());
create policy supplier_products_select on supplier_products for select using (is_active_user());
create policy supplier_products_write  on supplier_products for all
  using (is_active_user()) with check (is_active_user());

-- trips
create policy trips_select on trips for select
  using (is_admin() or (engineer_id = auth.uid() and is_active_user()));
create policy trips_insert on trips for insert
  with check (is_admin() or (engineer_id = auth.uid() and is_active_user()
                             and status in ('loaded','in_transit','arrived')));
-- Engineer may edit only while the trip is before factory acceptance,
-- and may move it up to factory_accepted (after that the row locks for them).
create policy trips_update_engineer on trips for update
  using (engineer_id = auth.uid() and is_active_user()
         and status in ('loaded','in_transit','arrived'))
  with check (engineer_id = auth.uid()
         and status in ('loaded','in_transit','arrived','factory_accepted'));
create policy trips_admin_all on trips for all
  using (is_admin()) with check (is_admin());

-- ============ STORAGE (photos) ============
-- Create a PRIVATE bucket "trip-photos"; object path: <engineer_id>/<trip_id>.webp
insert into storage.buckets (id, name, public) values ('trip-photos', 'trip-photos', false)
on conflict (id) do nothing;

create policy "photos read own or admin" on storage.objects for select
  using (bucket_id = 'trip-photos'
         and (is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
create policy "photos insert own" on storage.objects for insert
  with check (bucket_id = 'trip-photos' and is_active_user()
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos admin all" on storage.objects for all
  using (bucket_id = 'trip-photos' and is_admin())
  with check (bucket_id = 'trip-photos' and is_admin());

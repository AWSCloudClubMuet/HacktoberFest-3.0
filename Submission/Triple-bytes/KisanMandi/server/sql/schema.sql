-- KisanMandi database schema for Supabase/Postgres.
-- Run this file first in the Supabase SQL editor.

create table if not exists public.users (
  id serial primary key,
  name text not null check (length(trim(name)) > 0),
  phone text unique not null check (phone ~ '^03[0-9]{9}$'),
  district text not null check (length(trim(district)) > 0),
  role text not null check (role in ('Farmer','Buyer')),
  created_at timestamptz not null default now()
);

create table if not exists public.crops (
  id serial primary key,
  name text not null,
  name_ur text not null,
  category text not null
);

create table if not exists public.markets (
  id serial primary key,
  name text not null,
  name_ur text not null,
  district text not null
);

create table if not exists public.prices (
  id serial primary key,
  crop_id int not null references public.crops(id),
  market_id int not null references public.markets(id),
  date date not null,
  price numeric(10,2) not null check (price > 0),
  unique (crop_id, market_id, date)
);

create table if not exists public.listings (
  id serial primary key,
  user_id int not null references public.users(id),
  crop_id int not null references public.crops(id),
  quantity numeric not null check (quantity > 0),
  asking_price numeric not null check (asking_price > 0),
  district text not null check (length(trim(district)) > 0),
  grade text not null check (grade in ('A','B','C')),
  available_from date not null,
  contact_phone text not null check (contact_phone ~ '^03[0-9]{9}$'),
  status text not null default 'Active' check (status in ('Active','Sold')),
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id serial primary key,
  user_id int not null references public.users(id),
  crop_id int not null references public.crops(id),
  market_id int not null references public.markets(id),
  condition text not null check (condition in ('Above','Below')),
  target_price numeric not null check (target_price > 0),
  active_status boolean not null default true
);

create index if not exists prices_crop_market_date_idx
  on public.prices (crop_id, market_id, date desc);
create index if not exists prices_market_date_idx
  on public.prices (market_id, date desc);
create index if not exists listings_status_created_idx
  on public.listings (status, created_at desc);
create index if not exists listings_user_idx on public.listings (user_id);
create index if not exists alerts_user_idx on public.alerts (user_id);

-- The Express API uses the service-role key. Direct browser access is disabled.
alter table public.users enable row level security;
alter table public.crops enable row level security;
alter table public.markets enable row level security;
alter table public.prices enable row level security;
alter table public.listings enable row level security;
alter table public.alerts enable row level security;

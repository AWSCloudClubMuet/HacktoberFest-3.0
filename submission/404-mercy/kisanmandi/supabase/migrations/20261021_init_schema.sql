-- Supabase PostgreSQL Schema for KisanMandi
-- Team 404 MERCY | Hackathon Production Upgrade

-- 1. Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  district TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'buyer')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Crops Table
CREATE TABLE IF NOT EXISTS public.crops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Markets Table
CREATE TABLE IF NOT EXISTS public.markets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Prices Table
CREATE TABLE IF NOT EXISTS public.prices (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price NUMERIC NOT NULL CHECK (price > 0),
  source_type TEXT DEFAULT 'mandi_wholesale',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Produce Listings Table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop_id TEXT NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,
  district TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  asking_price NUMERIC NOT NULL CHECK (asking_price > 0),
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C')),
  available_from DATE NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Price Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop_id TEXT NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,
  market_id TEXT NOT NULL REFERENCES public.markets(id) ON DELETE RESTRICT,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
  target_price NUMERIC NOT NULL CHECK (target_price > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  triggered BOOLEAN NOT NULL DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ── INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_prices_crop_market_date ON public.prices(crop_id, market_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.alerts(user_id);

-- ── ROW LEVEL SECURITY (RLS) ───────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Crops & Markets (Publicly readable)
CREATE POLICY "Crops are viewable by everyone"
  ON public.crops FOR SELECT
  USING (true);

CREATE POLICY "Markets are viewable by everyone"
  ON public.markets FOR SELECT
  USING (true);

-- Prices (Publicly readable)
CREATE POLICY "Prices are viewable by everyone"
  ON public.prices FOR SELECT
  USING (true);

-- Listings Policies
CREATE POLICY "Active listings are viewable by all users"
  ON public.listings FOR SELECT
  USING (status = 'active' OR auth.uid() = seller_id);

CREATE POLICY "Farmers can insert their own listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'farmer'
    )
  );

CREATE POLICY "Sellers can update their own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Alerts Policies
CREATE POLICY "Users can view their own alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── TRIGGER FOR AUTO-CREATING PROFILES ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, district, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'district', 'Hyderabad'),
    COALESCE(new.raw_user_meta_data->>'role', 'farmer')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    district = EXCLUDED.district,
    role = EXCLUDED.role,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── REALTIME REPLICATION ────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;


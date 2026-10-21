-- Deterministic, fictional demo data. Safe to rerun.
-- Generates 8 crops x 3 markets x 14 days = 336 price rows.

begin;

truncate table public.alerts, public.listings, public.prices,
  public.markets, public.crops, public.users restart identity cascade;

insert into public.crops (name, name_ur, category) values
  ('Wheat', 'گندم', 'Grains'),
  ('Rice', 'چاول', 'Grains'),
  ('Tomato', 'ٹماٹر', 'Vegetables'),
  ('Onion', 'پیاز', 'Vegetables'),
  ('Mango', 'آم', 'Fruits'),
  ('Banana', 'کیلا', 'Fruits'),
  ('Cotton', 'کپاس', 'Cash Crops'),
  ('Red Chilli', 'سرخ مرچ', 'Spices');

insert into public.markets (name, name_ur, district) values
  ('Hyderabad Mandi', 'حیدرآباد منڈی', 'Hyderabad'),
  ('Sukkur Mandi', 'سکھر منڈی', 'Sukkur'),
  ('Mirpurkhas Mandi', 'میرپورخاص منڈی', 'Mirpurkhas');

insert into public.users (name, phone, district, role) values
  ('Ali Raza', '03001234567', 'Hyderabad', 'Farmer'),
  ('Fatima Bibi', '03111234567', 'Sukkur', 'Farmer'),
  ('Ghulam Mustafa', '03221234567', 'Mirpurkhas', 'Farmer'),
  ('Sana Ahmed', '03331234567', 'Hyderabad', 'Farmer'),
  ('Bilal Traders', '03441234567', 'Karachi', 'Buyer'),
  ('Mehran Foods', '03551234567', 'Sukkur', 'Buyer');

with crop_base(crop_id, base_price) as (
  values (1, 4100), (2, 5200), (3, 2400), (4, 2800),
         (5, 6000), (6, 3200), (7, 8500), (8, 11000)
), market_adjust(market_id, adjustment) as (
  values (1, 0), (2, 140), (3, -90)
), day_series(day_no, price_date) as (
  select n, current_date - (13 - n)::int from generate_series(0, 13) as n
)
insert into public.prices (crop_id, market_id, date, price)
select cb.crop_id, ma.market_id, ds.price_date,
       cb.base_price + ma.adjustment
       + (((ds.day_no * 7 + cb.crop_id * 3 + ma.market_id * 5) % 9) - 4) * 20
from crop_base cb cross join market_adjust ma cross join day_series ds;

insert into public.listings
  (user_id, crop_id, quantity, asking_price, district, grade, available_from, contact_phone, status, created_at)
values
  (1, 1, 50, 4200, 'Hyderabad', 'A', current_date, '03001234567', 'Active', now() - interval '1 hour'),
  (1, 3, 30, 2350, 'Hyderabad', 'B', current_date + 1, '03001234567', 'Active', now() - interval '8 hours'),
  (1, 7, 20, 8800, 'Hyderabad', 'A', current_date + 2, '03001234567', 'Sold', now() - interval '3 days'),
  (2, 2, 45, 5250, 'Sukkur', 'A', current_date, '03111234567', 'Active', now() - interval '2 hours'),
  (2, 4, 25, 2650, 'Sukkur', 'B', current_date + 1, '03111234567', 'Active', now() - interval '1 day'),
  (2, 6, 35, 3100, 'Sukkur', 'C', current_date + 3, '03111234567', 'Active', now() - interval '4 days'),
  (3, 5, 60, 6150, 'Mirpurkhas', 'A', current_date, '03221234567', 'Active', now() - interval '3 hours'),
  (3, 8, 15, 10800, 'Mirpurkhas', 'A', current_date + 2, '03221234567', 'Active', now() - interval '2 days'),
  (3, 3, 40, 2500, 'Mirpurkhas', 'B', current_date + 1, '03221234567', 'Sold', now() - interval '5 days'),
  (4, 1, 70, 3950, 'Hyderabad', 'B', current_date, '03331234567', 'Active', now() - interval '4 hours'),
  (4, 7, 28, 8400, 'Hyderabad', 'A', current_date + 4, '03331234567', 'Active', now() - interval '3 days'),
  (4, 8, 18, 11500, 'Hyderabad', 'C', current_date + 2, '03331234567', 'Active', now() - interval '6 days');

insert into public.alerts
  (user_id, crop_id, market_id, condition, target_price, active_status)
values
  (1, 1, 1, 'Above', 4000, true),
  (1, 3, 2, 'Below', 2500, true),
  (2, 2, 2, 'Above', 5400, true),
  (3, 5, 3, 'Above', 6200, false),
  (4, 8, 1, 'Below', 11200, true);

commit;

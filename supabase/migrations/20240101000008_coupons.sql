-- Create coupons table
create table public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_type text check (discount_type in ('percentage', 'fixed')) not null,
  discount_value integer not null,
  is_active boolean default true,
  expiry_date timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.coupons enable row level security;

-- Policies
create policy "Coupons are viewable by admins"
  on public.coupons for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Public can check if a coupon is valid (via select)
create policy "Public can check valid coupons"
  on public.coupons for select
  using (is_active = true and (expiry_date is null or expiry_date > now()));

-- Admins can manage coupons
create policy "Admins can manage coupons"
  on public.coupons for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Seed some test coupons
insert into public.coupons (code, discount_type, discount_value)
values 
  ('WELCOME10', 'percentage', 10),
  ('OFF50', 'percentage', 50),
  ('FIXED100', 'fixed', 100);

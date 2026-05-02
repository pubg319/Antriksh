alter table public.courses add column if not exists category text;
alter table public.courses add column if not exists level text;
alter table public.courses add column if not exists instructor_name text;
alter table public.courses add column if not exists rating numeric(3, 1) default 0.0;
alter table public.courses add column if not exists students integer default 0;
alter table public.courses add column if not exists duration text;

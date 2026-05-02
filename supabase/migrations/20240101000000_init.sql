-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text check (role in ('student', 'admin')) default 'student',
  created_at timestamp with time zone default now()
);

-- 2. COURSES
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  price integer not null default 0,
  thumbnail text,
  is_published boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. MODULES
create table public.modules (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  position integer not null default 0,
  course_id uuid references public.courses(id) on delete cascade not null
);

-- 4. LESSONS
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  mux_playback_id text,
  position integer not null default 0,
  is_preview boolean default false,
  module_id uuid references public.modules(id) on delete cascade not null
);

-- 5. ENROLLMENTS
create table public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(user_id, course_id)
);

-- 6. PAYMENTS
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete restrict not null,
  course_id uuid references public.courses(id) on delete restrict not null,
  amount integer not null,
  status text check (status in ('pending', 'success', 'failed')) default 'pending',
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  created_at timestamp with time zone default now()
);

-- 7. PROGRESS
create table public.progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  completed boolean default false,
  updated_at timestamp with time zone default now(),
  unique(user_id, lesson_id)
);

-- ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments enable row level security;
alter table public.progress enable row level security;

-- POLICIES

-- Profiles: Users can read their own profile. Admins can read all.
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can read all profiles" on public.profiles for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Courses: Public can view published. Admins can manage all.
create policy "Public can view published courses" on public.courses for select using (is_published = true);
create policy "Admins can manage courses" on public.courses for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Modules: Public can view modules of published courses. Admins can manage.
create policy "Public can view modules of published courses" on public.modules for select using (
  exists (select 1 from public.courses where id = public.modules.course_id and is_published = true)
);
create policy "Admins can manage modules" on public.modules for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Lessons: Enrolled users and previews can view. Admins can manage.
create policy "Users can view preview lessons" on public.lessons for select using (is_preview = true);
create policy "Enrolled users can view lessons" on public.lessons for select using (
  exists (
    select 1 from public.enrollments e
    join public.modules m on m.course_id = e.course_id
    where e.user_id = auth.uid() and m.id = public.lessons.module_id
  )
);
create policy "Admins can manage lessons" on public.lessons for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Enrollments: Users can read own.
create policy "Users can view own enrollments" on public.enrollments for select using (auth.uid() = user_id);
create policy "Admins can view all enrollments" on public.enrollments for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Payments: Users can read own.
create policy "Users can view own payments" on public.payments for select using (auth.uid() = user_id);
create policy "Admins can view all payments" on public.payments for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Progress: Users can read/update own.
create policy "Users can view own progress" on public.progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on public.progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on public.progress for update using (auth.uid() = user_id);
create policy "Admins can view all progress" on public.progress for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- TRIGGERS & FUNCTIONS

-- Trigger for profile creation on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'student');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger for progress updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_progress_updated
  before update on public.progress
  for each row execute procedure public.handle_updated_at();

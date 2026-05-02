-- Create reviews table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(course_id, user_id)
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies
create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "Enrolled students can create reviews"
  on public.reviews for insert
  with check (
    exists (
      select 1 from public.enrollments
      where course_id = reviews.course_id
      and user_id = auth.uid()
    )
    and auth.uid() = user_id
  );

create policy "Users can update their own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- Add average rating calculation helper (optional, can be done in client)
-- But let's add a trigger or view if needed. For now, we'll do client-side aggregation.

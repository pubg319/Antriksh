-- Create messages table for doubts
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies
create policy "Users can view messages in courses they are enrolled in"
  on public.messages for select
  using (
    exists (
      select 1 from public.enrollments
      where course_id = messages.course_id
      and user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Users can send messages in courses they are enrolled in"
  on public.messages for insert
  with check (
    (
      exists (
        select 1 from public.enrollments
        where course_id = messages.course_id
        and user_id = auth.uid()
      )
      or
      exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role = 'admin'
      )
    )
    and auth.uid() = user_id
  );

-- Enable Realtime for the messages table
alter publication supabase_realtime add table public.messages;

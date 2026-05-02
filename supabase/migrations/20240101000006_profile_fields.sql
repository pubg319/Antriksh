-- Add avatar_url to profiles table
alter table public.profiles add column if not exists avatar_url text;

-- Add instructor fields to courses table
alter table public.courses add column if not exists instructor_name text;
alter table public.courses add column if not exists instructor_avatar text;
alter table public.courses add column if not exists instructor_bio text;

-- Create the storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Enable RLS for the bucket
create policy "Public Access to Avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

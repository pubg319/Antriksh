-- Create the storage bucket for course thumbnails
insert into storage.buckets (id, name, public)
values ('course_thumbnails', 'course_thumbnails', true)
on conflict (id) do nothing;

-- Enable RLS for the bucket
-- Note: storage.objects RLS policies
create policy "Public Access to Course Thumbnails"
  on storage.objects for select
  using ( bucket_id = 'course_thumbnails' );

create policy "Admins can upload Course Thumbnails"
  on storage.objects for insert
  with check (
    bucket_id = 'course_thumbnails' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update Course Thumbnails"
  on storage.objects for update
  using (
    bucket_id = 'course_thumbnails' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete Course Thumbnails"
  on storage.objects for delete
  using (
    bucket_id = 'course_thumbnails' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

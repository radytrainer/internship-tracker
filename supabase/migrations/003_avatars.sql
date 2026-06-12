-- Add photo fields
alter table public.students add column if not exists avatar_url text;
alter table public.companies add column if not exists logo_url text;

-- Public bucket for profile photos
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Public can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Authenticated can update avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Authenticated can delete avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

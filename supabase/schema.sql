create extension if not exists pgcrypto;

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  common_name text not null,
  scientific_name text,
  note text not null default '',
  category text,
  deck_slugs text[] not null default '{}',
  lifespan text,
  edible text not null default 'unknown' check (edible in ('edible', 'not-edible', 'unknown')),
  edible_note text,
  uses jsonb not null default '[]'::jsonb,
  culinary_ideas jsonb not null default '[]'::jsonb,
  good_for jsonb not null default '[]'::jsonb,
  fun_facts jsonb not null default '[]'::jsonb,
  care_water text,
  care_light text,
  care_season text,
  location_place text not null default '',
  latitude double precision,
  longitude double precision,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id bigint generated always as identity primary key,
  slug text unique not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.entry_tags (
  entry_id uuid not null references public.entries (id) on delete cascade,
  tag_id bigint not null references public.tags (id) on delete cascade,
  primary key (entry_id, tag_id)
);

create table if not exists public.entry_images (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.entries (id) on delete cascade,
  source_filename text,
  source_mime text,
  model text not null,
  confidence double precision,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at
before update on public.entries
for each row
execute function public.set_updated_at();

alter table public.entries enable row level security;
alter table public.tags enable row level security;
alter table public.entry_tags enable row level security;
alter table public.entry_images enable row level security;
alter table public.ai_runs enable row level security;

drop policy if exists "Public can read public entries" on public.entries;
create policy "Public can read public entries"
on public.entries for select
using (visibility = 'public');

drop policy if exists "Owner can manage entries" on public.entries;
create policy "Owner can manage entries"
on public.entries for all
using (auth.email() = 'evolucidstudios@gmail.com')
with check (auth.email() = 'evolucidstudios@gmail.com');

drop policy if exists "Public can read tags" on public.tags;
create policy "Public can read tags"
on public.tags for select
using (true);

drop policy if exists "Owner can manage tags" on public.tags;
create policy "Owner can manage tags"
on public.tags for all
using (auth.email() = 'evolucidstudios@gmail.com')
with check (auth.email() = 'evolucidstudios@gmail.com');

drop policy if exists "Public can read entry tags" on public.entry_tags;
create policy "Public can read entry tags"
on public.entry_tags for select
using (
  exists (
    select 1 from public.entries
    where public.entries.id = entry_tags.entry_id
      and public.entries.visibility = 'public'
  )
);

drop policy if exists "Owner can manage entry tags" on public.entry_tags;
create policy "Owner can manage entry tags"
on public.entry_tags for all
using (auth.email() = 'evolucidstudios@gmail.com')
with check (auth.email() = 'evolucidstudios@gmail.com');

drop policy if exists "Public can read entry images" on public.entry_images;
create policy "Public can read entry images"
on public.entry_images for select
using (
  exists (
    select 1 from public.entries
    where public.entries.id = entry_images.entry_id
      and public.entries.visibility = 'public'
  )
);

drop policy if exists "Owner can manage entry images" on public.entry_images;
create policy "Owner can manage entry images"
on public.entry_images for all
using (auth.email() = 'evolucidstudios@gmail.com')
with check (auth.email() = 'evolucidstudios@gmail.com');

drop policy if exists "Owner can manage ai runs" on public.ai_runs;
create policy "Owner can manage ai runs"
on public.ai_runs for all
using (auth.email() = 'evolucidstudios@gmail.com')
with check (auth.email() = 'evolucidstudios@gmail.com');

insert into storage.buckets (id, name, public)
values ('nature-images', 'nature-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read nature images" on storage.objects;
create policy "Public can read nature images"
on storage.objects for select
using (bucket_id = 'nature-images');

drop policy if exists "Owner can upload nature images" on storage.objects;
create policy "Owner can upload nature images"
on storage.objects for insert
with check (
  bucket_id = 'nature-images'
  and auth.email() = 'evolucidstudios@gmail.com'
);

drop policy if exists "Owner can update nature images" on storage.objects;
create policy "Owner can update nature images"
on storage.objects for update
using (
  bucket_id = 'nature-images'
  and auth.email() = 'evolucidstudios@gmail.com'
)
with check (
  bucket_id = 'nature-images'
  and auth.email() = 'evolucidstudios@gmail.com'
);

drop policy if exists "Owner can delete nature images" on storage.objects;
create policy "Owner can delete nature images"
on storage.objects for delete
using (
  bucket_id = 'nature-images'
  and auth.email() = 'evolucidstudios@gmail.com'
);

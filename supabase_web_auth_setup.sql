-- Run this file in the Supabase SQL Editor.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null default 'customer' check (role in ('customer', 'trainer')),
  full_name text not null,
  trainer_id uuid references public.profiles(id) on delete set null,
  goal_type text check (goal_type in ('diet', 'health', 'both')) default 'both',
  dream_vision text,
  start_weight numeric(5,1),
  daily_calorie_goal integer default 1600,
  daily_protein_goal integer default 60,
  daily_fat_goal integer default 50,
  daily_carbs_goal integer default 200,
  target_weight numeric(5,1),
  target_body_fat numeric(4,1),
  onboarding_done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_trainer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'trainer'
  );
$$;

revoke all on function public.is_trainer() from public;
grant execute on function public.is_trainer() to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    auth.uid() = user_id
    or public.is_trainer()
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, role, full_name)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' = 'trainer' then 'trainer'
      else 'customer'
    end,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create profiles for users who signed up before this setup was installed.
insert into public.profiles (user_id, role, full_name)
select
  u.id,
  case
    when u.raw_user_meta_data ->> 'role' = 'trainer' then 'trainer'
    else 'customer'
  end,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    split_part(u.email, '@', 1)
  )
from auth.users u
on conflict (user_id) do nothing;

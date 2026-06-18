-- ============================================================
-- Game Tracker — Supabase Schema
-- Run this entire file in Supabase → SQL Editor → New query
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  username      text unique not null,
  display_name  text,
  created_at    timestamptz default now()
);

-- ── Game statuses ────────────────────────────────────────────
create table if not exists public.game_statuses (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  console       text not null,
  game_id       integer not null,
  joguei        boolean default false,
  zerado        boolean default false,
  cem_porcento  boolean default false,
  quero         boolean default false,
  rating        numeric(2,1) check (rating >= 0.5 and rating <= 5.0),
  primary key (user_id, console, game_id)
);

-- ── Activities ───────────────────────────────────────────────
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  console     text not null,
  game_id     integer not null,
  action      text not null,
  old_value   text,
  new_value   text,
  created_at  timestamptz default now()
);

-- ── Friendships ──────────────────────────────────────────────
create table if not exists public.friendships (
  requester_id  uuid references public.profiles(id) on delete cascade,
  addressee_id  uuid references public.profiles(id) on delete cascade,
  status        text default 'accepted' check (status in ('pending','accepted')),
  created_at    timestamptz default now(),
  primary key (requester_id, addressee_id)
);

-- ── Invites ──────────────────────────────────────────────────
create table if not exists public.invites (
  code        text primary key,
  created_by  uuid references public.profiles(id) on delete cascade,
  max_uses    integer default 20,
  use_count   integer default 0,
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.game_statuses enable row level security;
alter table public.activities    enable row level security;
alter table public.friendships   enable row level security;
alter table public.invites       enable row level security;

-- profiles: authenticated users can read all, write only their own
create policy "profiles_read"  on public.profiles for select to authenticated using (true);
create policy "profiles_write" on public.profiles for insert to authenticated with check (id = auth.uid());

-- game_statuses: users read/write their own; friends can read each other's
create policy "statuses_own_read"   on public.game_statuses for select to authenticated using (user_id = auth.uid());
create policy "statuses_own_write"  on public.game_statuses for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "statuses_friend_read" on public.game_statuses for select to authenticated using (
  exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
    and (
      (f.requester_id = auth.uid() and f.addressee_id = user_id) or
      (f.addressee_id = auth.uid() and f.requester_id = user_id)
    )
  )
);

-- activities: own read/write; friends can read
create policy "activities_own"        on public.activities for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "activities_friend_read" on public.activities for select to authenticated using (
  exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
    and (
      (f.requester_id = auth.uid() and f.addressee_id = user_id) or
      (f.addressee_id = auth.uid() and f.requester_id = user_id)
    )
  )
);

-- friendships: users manage their own connections
create policy "friendships_read"  on public.friendships for select to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "friendships_write" on public.friendships for insert to authenticated with check (requester_id = auth.uid());
create policy "friendships_delete" on public.friendships for delete to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());

-- invites: authenticated users can create; anyone can read to validate
create policy "invites_read"  on public.invites for select using (true);
create policy "invites_write" on public.invites for insert to authenticated with check (created_by = auth.uid());
create policy "invites_update" on public.invites for update to authenticated using (true) with check (true);

-- ============================================================
-- Helper function: increment invite use count
-- ============================================================
create or replace function public.increment_invite_use(invite_code text)
returns void language sql security definer as $$
  update public.invites set use_count = use_count + 1 where code = invite_code;
$$;

-- ============================================================
-- Auto-create profile when user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

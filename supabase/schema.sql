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
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'display_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Social layer
-- ============================================================

-- ── game_statuses.updated_at (needed for year recap / achievements) ──
alter table public.game_statuses add column if not exists updated_at timestamptz default now();

create or replace function public.touch_game_statuses_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists game_statuses_touch_updated_at on public.game_statuses;
create trigger game_statuses_touch_updated_at
  before update on public.game_statuses
  for each row execute function public.touch_game_statuses_updated_at();

-- ── Feed posts (opt-in only, never auto-backfilled) ──────────
create table if not exists public.feed_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  console     text not null,
  game_id     integer not null,
  action      text not null check (action in ('joguei','zerado','cem_porcento')),
  rating      numeric(2,1),
  created_at  timestamptz default now()
);

alter table public.feed_posts enable row level security;

create policy "feed_posts_own" on public.feed_posts for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "feed_posts_friend_read" on public.feed_posts for select
  to authenticated using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
      and (
        (f.requester_id = auth.uid() and f.addressee_id = user_id) or
        (f.addressee_id = auth.uid() and f.requester_id = user_id)
      )
    )
  );

-- ── Comments on feed posts ───────────────────────────────────
create table if not exists public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.feed_posts(id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) <= 1000),
  created_at  timestamptz default now()
);

alter table public.post_comments enable row level security;

create policy "post_comments_read" on public.post_comments for select
  to authenticated using (
    exists (
      select 1 from public.feed_posts p
      where p.id = post_id
      and (
        p.user_id = auth.uid() or
        exists (
          select 1 from public.friendships f
          where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = p.user_id) or
            (f.addressee_id = auth.uid() and f.requester_id = p.user_id)
          )
        )
      )
    )
  );

create policy "post_comments_insert" on public.post_comments for insert
  to authenticated with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.feed_posts p
      where p.id = post_id
      and (
        p.user_id = auth.uid() or
        exists (
          select 1 from public.friendships f
          where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = p.user_id) or
            (f.addressee_id = auth.uid() and f.requester_id = p.user_id)
          )
        )
      )
    )
  );

create policy "post_comments_delete" on public.post_comments for delete
  to authenticated using (
    user_id = auth.uid() or
    exists (select 1 from public.feed_posts p where p.id = post_id and p.user_id = auth.uid())
  );

-- ── Reactions on feed posts (fixed glyph set, one per user per post) ──
create table if not exists public.post_reactions (
  post_id     uuid not null references public.feed_posts(id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  reaction    text not null check (reaction in
                ('fire','laugh','mind_blown','skull','clap','100','goat','same')),
  created_at  timestamptz default now(),
  primary key (post_id, user_id)
);

alter table public.post_reactions enable row level security;

create policy "post_reactions_read" on public.post_reactions for select
  to authenticated using (
    exists (
      select 1 from public.feed_posts p
      where p.id = post_id
      and (
        p.user_id = auth.uid() or
        exists (
          select 1 from public.friendships f
          where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = p.user_id) or
            (f.addressee_id = auth.uid() and f.requester_id = p.user_id)
          )
        )
      )
    )
  );

create policy "post_reactions_write" on public.post_reactions for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Personal Top 10 (cross-console, also feeds community ranking) ──
create table if not exists public.top10_entries (
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  position    integer not null check (position between 1 and 10),
  console     text not null,
  game_id     integer not null,
  created_at  timestamptz default now(),
  primary key (user_id, position)
);

alter table public.top10_entries enable row level security;

create policy "top10_read_all" on public.top10_entries for select
  to authenticated using (true);

create policy "top10_write_own" on public.top10_entries for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Achievement unlocks (definitions live in JS, not here) ──
create table if not exists public.user_achievements (
  user_id         uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  achievement_id  text not null,
  unlocked_at     timestamptz default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "user_achievements_read_all" on public.user_achievements for select
  to authenticated using (true);

create policy "user_achievements_write_own" on public.user_achievements for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Notifications ─────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  actor_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  type        text not null check (type in ('comment','reaction','achievement')),
  post_id     uuid references public.feed_posts(id) on delete cascade,
  read        boolean default false,
  created_at  timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "notifications_read_own" on public.notifications for select
  to authenticated using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "notifications_insert" on public.notifications for insert
  to authenticated with check (actor_id = auth.uid());

-- ── Duel votes (head-to-head game comparisons) ────────────────
create table if not exists public.duel_votes (
  id            uuid primary key default gen_random_uuid(),
  voter_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  console       text not null,
  game_a_id     integer not null,
  game_b_id     integer not null,
  winner_game_id integer not null check (winner_game_id in (game_a_id, game_b_id)),
  created_at    timestamptz default now()
);

-- One vote per voter per matchup — app code always normalizes game_a_id < game_b_id
-- before inserting, so this also blocks an (a,b) row alongside a (b,a) duplicate.
create unique index if not exists duel_votes_unique_vote
  on public.duel_votes (voter_id, console, game_a_id, game_b_id);

alter table public.duel_votes enable row level security;

create policy "duel_votes_own" on public.duel_votes for all
  to authenticated using (voter_id = auth.uid()) with check (voter_id = auth.uid());

create policy "duel_votes_friend_read" on public.duel_votes for select
  to authenticated using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
      and (
        (f.requester_id = auth.uid() and f.addressee_id = voter_id) or
        (f.addressee_id = auth.uid() and f.requester_id = voter_id)
      )
    )
  );

-- ── Polls ("qual jogo jogar agora") ───────────────────────────
create table if not exists public.polls (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  console     text not null,
  game_ids    jsonb not null,
  created_at  timestamptz default now(),
  closes_at   timestamptz
);

create table if not exists public.poll_votes (
  poll_id     uuid not null references public.polls(id) on delete cascade,
  voter_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  game_id     integer not null,
  created_at  timestamptz default now(),
  primary key (poll_id, voter_id)
);

alter table public.polls      enable row level security;
alter table public.poll_votes enable row level security;

create policy "polls_own_write" on public.polls for insert
  to authenticated with check (creator_id = auth.uid());

create policy "polls_own_delete" on public.polls for delete
  to authenticated using (creator_id = auth.uid());

create policy "polls_read" on public.polls for select
  to authenticated using (
    creator_id = auth.uid() or
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
      and (
        (f.requester_id = auth.uid() and f.addressee_id = creator_id) or
        (f.addressee_id = auth.uid() and f.requester_id = creator_id)
      )
    )
  );

create policy "poll_votes_read" on public.poll_votes for select
  to authenticated using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id
      and (
        p.creator_id = auth.uid() or
        exists (
          select 1 from public.friendships f
          where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = p.creator_id) or
            (f.addressee_id = auth.uid() and f.requester_id = p.creator_id)
          )
        )
      )
    )
  );

create policy "poll_votes_write" on public.poll_votes for all
  to authenticated using (voter_id = auth.uid()) with check (voter_id = auth.uid());

-- Rejects a vote for a game_id that isn't actually one of the poll's options — a check
-- constraint can't reference another table, so this needs to be a trigger.
create or replace function public.poll_votes_check_game_id()
returns trigger as $$
begin
  if not exists (
    select 1 from public.polls p
    where p.id = new.poll_id
    and p.game_ids @> to_jsonb(new.game_id)
  ) then
    raise exception 'game_id % is not one of poll %''s options', new.game_id, new.poll_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger poll_votes_check_game_id_trigger
  before insert or update on public.poll_votes
  for each row execute function public.poll_votes_check_game_id();

-- Pin search_path (avoids the mutable-search-path lint) and stop anon/authenticated from
-- calling this directly via PostgREST RPC — it's a trigger-only helper, not a public API.
alter function public.poll_votes_check_game_id() set search_path = public;
revoke execute on function public.poll_votes_check_game_id() from public, anon, authenticated;

-- ── Avatar storage (profile pictures) ────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_own_write" on storage.objects for insert
  to authenticated with check (bucket_id = 'avatars' and owner = auth.uid());

create policy "avatars_own_update" on storage.objects for update
  to authenticated using (bucket_id = 'avatars' and owner = auth.uid());

alter table public.profiles add column if not exists avatar_url text;

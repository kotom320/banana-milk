-- banana-milk 스키마
-- Supabase SQL Editor에서 실행하세요

create table players (
  id uuid primary key default gen_random_uuid(),
  pubg_nickname text not null unique,
  tier smallint not null check (tier between 1 and 4),
  playstyle text not null,
  avg_damage numeric(6,1) not null default 0,
  avg_kills numeric(4,1) not null default 0,
  avg_survival_time integer not null default 0,
  matches_analyzed integer not null default 0,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  team_count smallint not null check (team_count in (2, 3)),
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

create table room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  team_number smallint not null check (team_number between 1 and 3),
  unique (room_id, player_id)
);

create table round_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  round_number smallint not null check (round_number between 1 and 10),
  team1_placement smallint not null,
  team1_kills smallint not null default 0,
  team2_placement smallint not null,
  team2_kills smallint not null default 0,
  team3_placement smallint,
  team3_kills smallint,
  created_at timestamptz not null default now(),
  unique (room_id, round_number)
);

-- 인덱스
create index on room_players (room_id);
create index on round_results (room_id);

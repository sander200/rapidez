alter table profiles add column if not exists bank_name text not null default '';
alter table trips add column if not exists started_at timestamptz;
alter table trips add column if not exists ridden_m integer not null default 0;

create table if not exists messages (
  id text primary key,
  trip_id text not null,
  from_user text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_trip_idx on messages (trip_id, created_at);

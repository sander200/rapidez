create table if not exists road_reports (
  id text primary key,
  user_id text not null,
  author_name text not null,
  kind text not null,
  label text not null,
  sector text not null,
  lat double precision not null,
  lng double precision not null,
  upvotes integer not null default 1,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '4 hours')
);

create index if not exists road_reports_expires_idx on road_reports (expires_at desc);

create table if not exists city_weather (
  id integer primary key default 1,
  rain_mode boolean not null default false,
  advisory text not null default '',
  delay_min integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into city_weather (id, rain_mode, advisory, delay_min)
values (1, false, '', 0)
on conflict (id) do nothing;

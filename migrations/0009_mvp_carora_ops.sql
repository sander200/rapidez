alter table profiles add column if not exists license_grade text not null default '2da Grado (Moto)';
alter table profiles add column if not exists medical_cert boolean not null default true;
alter table profiles add column if not exists criminal_record_ok boolean not null default true;
alter table profiles add column if not exists in_person_verified boolean not null default false;
alter table profiles add column if not exists hotspot_id text;

alter table trips add column if not exists cash_tendered double precision;
alter table trips add column if not exists payment_proof text;
alter table trips add column if not exists admin_pay_verified boolean not null default false;

alter table messages add column if not exists attachment_photo text;

create table if not exists mvp_feedback (
  id text primary key,
  user_id text not null,
  author_name text not null,
  role text not null,
  category text not null,
  body text not null,
  created_at timestamptz not null default now()
);

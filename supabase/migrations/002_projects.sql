create table public.report_projects (
 id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 n_futuros integer default 1,
 n_passados integer default 0,
 usa_pacotes boolean default false,
 projeto jsonb default '{}',
 raias jsonb default '[]',
 pacotes jsonb default '[]',
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

create index idx_projects_user on report_projects(user_id);

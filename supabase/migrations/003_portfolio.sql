create table public.user_portfolio (
 id uuid default gen_random_uuid() primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 rows jsonb default '[]',
 imported_at text,
 created_at timestamptz default now(),
 updated_at timestamptz default now(),
 unique(user_id)
);

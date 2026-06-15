create extension if not exists "pgcrypto";

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null,
 email text not null unique,
 is_admin boolean default false,
 is_active boolean default true,
 must_change_password boolean default false,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

create or replace function public.create_profile()
returns trigger
language plpgsql
security definer
as $$
begin
 insert into public.profiles(id,email,name)
 values(new.id,new.email,coalesce(new.raw_user_meta_data->>'name',new.email));
 return new;
end;
$$;

create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public.create_profile();

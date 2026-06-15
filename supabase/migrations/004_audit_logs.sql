create table public.audit_logs (
 id uuid default gen_random_uuid() primary key,
 user_id uuid,
 table_name text,
 record_id text,
 action text,
 old_data jsonb,
 new_data jsonb,
 created_at timestamptz default now()
);

create or replace function public.audit_trigger()
returns trigger
language plpgsql
as $$
begin
 insert into audit_logs(user_id,table_name,record_id,action,old_data,new_data)
 values(auth.uid(),TG_TABLE_NAME,coalesce(new.id::text,old.id::text),TG_OP,to_jsonb(old),to_jsonb(new));
 return new;
end;
$$;

create trigger audit_projects
after insert or update or delete
on report_projects
for each row execute function audit_trigger();

alter table profiles enable row level security;
alter table report_projects enable row level security;
alter table user_portfolio enable row level security;
alter table audit_logs enable row level security;

create policy "profile_owner" on profiles
for select using (
 id = auth.uid()
 or exists(select 1 from profiles p where p.id=auth.uid() and p.is_admin=true)
);

create policy "projects_owner" on report_projects
for all using (user_id = auth.uid());

create policy "portfolio_owner" on user_portfolio
for all using (user_id = auth.uid());

create policy "audit_admin" on audit_logs
for select using (
 exists(select 1 from profiles where id=auth.uid() and is_admin=true)
);

-- 019_create_map_snapshots.sql
-- specific table for saving/restoring map configurations (markers + assignments)

create table if not exists map_snapshots (
  id uuid default gen_random_uuid() primary key,
  event_year integer not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  data jsonb not null -- stores { markers: [], assignments: [] }
);

-- RLS Policies
alter table map_snapshots enable row level security;

-- Everyone can read snapshots (if they have access to the app)
create policy "Authenticated users can view snapshots"
  on map_snapshots for select
  to authenticated
  using (true);

-- Only admins/managers can create/delete snapshots
create policy "Admins and managers can insert snapshots"
  on map_snapshots for insert
  to authenticated
  with check (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role in ('super_admin', 'system_manager', 'event_manager')
    )
  );

create policy "Admins and managers can delete snapshots"
  on map_snapshots for delete
  to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role in ('super_admin', 'system_manager', 'event_manager')
    )
  );

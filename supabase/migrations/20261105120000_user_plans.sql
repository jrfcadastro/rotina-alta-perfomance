-- One editable plan (rotina, adaptações, checklist) per user, protected by row level security.
create table if not exists public.user_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_plans enable row level security;

drop policy if exists "user_plans_select_own" on public.user_plans;
create policy "user_plans_select_own" on public.user_plans
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "user_plans_insert_own" on public.user_plans;
create policy "user_plans_insert_own" on public.user_plans
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_plans_update_own" on public.user_plans;
create policy "user_plans_update_own" on public.user_plans
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

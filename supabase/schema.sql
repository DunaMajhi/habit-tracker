-- Personal Valuation Tracker schema
-- Run this script in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  category text not null check (category in ('Health', 'Learning', 'Infrastructure', 'Habits', 'Impulse', 'Entertainment')),
  description text not null check (char_length(trim(description)) > 0),
  timestamp timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.transactions
  drop constraint if exists transactions_category_check;

-- Convert any legacy categories so the new constraint can be applied safely.
update public.transactions
set category = case category
  when 'Invested' then 'Health'
  when 'Wasted' then 'Habits'
  when 'OpEx' then 'Infrastructure'
  else category
end
where category in ('Invested', 'Wasted', 'OpEx');

alter table if exists public.transactions
  add constraint transactions_category_check
  check (category in ('Health', 'Learning', 'Infrastructure', 'Habits', 'Impulse', 'Entertainment'));

create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_user_timestamp on public.transactions (user_id, timestamp desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

alter table public.transactions enable row level security;

-- Users can only read their own transactions.
drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

-- Users can only insert transactions for themselves.
drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions"
on public.transactions
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can only update their own transactions.
drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions"
on public.transactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Users can only delete their own transactions.
drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions"
on public.transactions
for delete
to authenticated
using (auth.uid() = user_id);

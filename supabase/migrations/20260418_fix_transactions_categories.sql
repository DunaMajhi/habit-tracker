-- Migration: update transaction categories for Personal Company Simulator
-- Apply this in Supabase to migrate existing rows and replace the stale constraint.

alter table if exists public.transactions
  drop constraint if exists transactions_category_check;

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

-- FACTORYON Q&A: Supabase SQL Editor에서 한 번 실행합니다.
create extension if not exists pgcrypto;

create table if not exists public.qna_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.qna_questions (
  id uuid primary key default gen_random_uuid(),
  author text not null check (char_length(btrim(author)) between 1 and 20),
  title text not null check (char_length(btrim(title)) between 2 and 60),
  content text not null check (char_length(btrim(content)) between 5 and 500),
  is_private boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists qna_questions_status_created_idx
  on public.qna_questions (status, created_at desc);

alter table public.qna_admins enable row level security;
alter table public.qna_questions enable row level security;

create or replace function public.is_qna_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.qna_admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_qna_admin() from public, anon;
grant execute on function public.is_qna_admin() to authenticated;

revoke all on table public.qna_admins from anon, authenticated;
grant select on table public.qna_admins to authenticated;

revoke all on table public.qna_questions from anon, authenticated;
grant select, insert on table public.qna_questions to anon;
grant select, update, delete on table public.qna_questions to authenticated;

drop policy if exists "Admins can view their membership" on public.qna_admins;
create policy "Admins can view their membership"
on public.qna_admins for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Visitors can submit pending questions" on public.qna_questions;
create policy "Visitors can submit pending questions"
on public.qna_questions for insert to anon
with check (status = 'pending' and approved_at is null);

drop policy if exists "Visitors can view approved public questions" on public.qna_questions;
create policy "Visitors can view approved public questions"
on public.qna_questions for select to anon
using (status = 'approved' and is_private = false);

drop policy if exists "Admins can view every question" on public.qna_questions;
create policy "Admins can view every question"
on public.qna_questions for select to authenticated
using ((select public.is_qna_admin()));

drop policy if exists "Admins can update every question" on public.qna_questions;
create policy "Admins can update every question"
on public.qna_questions for update to authenticated
using ((select public.is_qna_admin()))
with check ((select public.is_qna_admin()));

drop policy if exists "Admins can delete every question" on public.qna_questions;
create policy "Admins can delete every question"
on public.qna_questions for delete to authenticated
using ((select public.is_qna_admin()));

-- Supabase Authentication > Users에서 관리자 계정을 만든 뒤 UUID를 넣어 실행하세요.
-- insert into public.qna_admins (user_id) values ('관리자-사용자-UUID');

-- 견적 내역: 발행한 견적서를 저장해 '견적 내역' 탭에서 업체별로 다시 볼 수 있게 한다.
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null unique,
  quote_date date,
  customer text not null default '',
  contact text not null default '',
  contact_info text not null default '',
  deliver text not null default '',
  manager text not null default '',
  valid text not null default '',
  pay text not null default '',
  note text not null default '',
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  order_no text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_customer_idx on public.quotes (customer);
create index if not exists quotes_date_idx on public.quotes (quote_date desc);

-- 로그인한 사용자만 읽고 쓸 수 있게 한다
alter table public.quotes enable row level security;

drop policy if exists "quotes_authenticated_all" on public.quotes;
create policy "quotes_authenticated_all" on public.quotes
  for all to authenticated
  using (true) with check (true);

comment on table public.quotes is '발행한 견적서 (견적 내역 탭)';

-- 거래명세표 문서번호·배송지 직접입력을 order_items에 보관
-- Supabase SQL Editor에서 실행하세요.

alter table public.order_items
  add column if not exists ts_no text,
  add column if not exists ts_orig text,
  add column if not exists deliver_label text,
  add column if not exists deliver_addr text,
  add column if not exists deliver_contact text;

comment on column public.order_items.ts_no is '거래명세표 문서번호 (예: TS-261028-01, …-R1)';
comment on column public.order_items.ts_orig is '거래명세표 원번호 (수정본 -Rn 기준)';
comment on column public.order_items.deliver_label is '배송지 직접입력 라벨';
comment on column public.order_items.deliver_addr is '배송지 직접입력 주소';
comment on column public.order_items.deliver_contact is '배송지 직접입력 담당자';

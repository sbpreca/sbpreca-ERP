-- 매출 납품일: 매입처 → 당사 → 매출처로 나가는 건에서 매출처에 실제로 납품한 날
-- 비어 있으면 납품일(ship)을 그대로 쓴다 (직배송).
-- Supabase SQL Editor에서 실행하세요.

alter table public.order_items
  add column if not exists sell_ship date;

comment on column public.order_items.sell_ship is '매출 납품일 (거래명세표·매출월 기준). 비어 있으면 ship 사용';

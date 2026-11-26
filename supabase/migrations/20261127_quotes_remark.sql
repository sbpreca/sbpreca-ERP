-- 견적서 '특이사항' 칸을 견적 내역에 저장한다 (미리보기 편집 창에서 고친 값).
-- Supabase SQL Editor에서 실행하세요. 실행 전에는 특이사항만 저장되지 않고 나머지는 그대로 저장돼요.

alter table public.quotes
  add column if not exists remark text not null default '';

-- 카테고리별 모바일 한 줄 상품 수 (PC와 별도 설정)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS products_per_row_mobile INT NOT NULL DEFAULT 2
    CHECK (products_per_row_mobile BETWEEN 1 AND 4);

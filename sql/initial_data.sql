-- Initial data for EverWear

-- Badge definitions
INSERT INTO public.badge_definitions 
  (id, name, description, image_url, category, display_order, is_active) 
VALUES
  ('first-item', '初めてのアイテム登録', '最初のアイテムを登録しました', 'https://example.com/badges/first-item.png', 'usage', 1, true),
  ('first-wear', '初めての着用記録', '最初の着用を記録しました', 'https://example.com/badges/first-wear.png', 'usage', 2, true),
  ('first-wash', '初めての洗濯記録', '最初の洗濯を記録しました', 'https://example.com/badges/first-wash.png', 'usage', 3, true),
  ('item-10-wears', '10回着用達成', '1つのアイテムを10回着用しました', 'https://example.com/badges/10-wears.png', 'milestone', 4, true),
  ('item-30-wears', '30回着用達成', '1つのアイテムを30回着用しました', 'https://example.com/badges/30-wears.png', 'milestone', 5, true),
  ('item-50-wears', '50回着用達成', '1つのアイテムを50回着用しました', 'https://example.com/badges/50-wears.png', 'milestone', 6, true),
  ('wash-reduced-10', '洗濯10回削減', '洗濯回数を10回削減しました', 'https://example.com/badges/wash-10.png', 'efficiency', 7, true),
  ('wash-reduced-50', '洗濯50回削減', '洗濯回数を50回削減しました', 'https://example.com/badges/wash-50.png', 'efficiency', 8, true),
  ('wash-reduced-100', '洗濯100回削減', '洗濯回数を100回削減しました', 'https://example.com/badges/wash-100.png', 'efficiency', 9, true),
  ('category-complete', 'カテゴリコンプリート', '全カテゴリでアイテムを登録しました', 'https://example.com/badges/category-complete.png', 'special', 10, true),
  ('eco-warrior', 'エコウォリアー', '環境貢献度が高いユーザーに贈られるバッジ', 'https://example.com/badges/eco-warrior.png', 'special', 11, true),
  ('efficient-washer', '賢い洗濯', '洗濯閾値の90%以上で洗濯を5回実施', 'https://example.com/badges/efficient-washer.png', 'efficiency', 12, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Badge conditions
INSERT INTO public.badge_conditions
  (badge_id, condition_type, condition_value)
VALUES
  ('first-item', 'total_items', '{"min": 1}'),
  ('first-wear', 'total_wears', '{"min": 1}'),
  ('first-wash', 'total_washes', '{"min": 1}'),
  ('item-10-wears', 'max_item_wears', '{"min": 10}'),
  ('item-30-wears', 'max_item_wears', '{"min": 30}'),
  ('item-50-wears', 'max_item_wears', '{"min": 50}'),
  ('wash-reduced-10', 'washes_reduced', '{"min": 10}'),
  ('wash-reduced-50', 'washes_reduced', '{"min": 50}'),
  ('wash-reduced-100', 'washes_reduced', '{"min": 100}'),
  ('category-complete', 'all_categories', '{"categories": ["トップス", "ボトムス", "アウター", "シューズ", "その他", "小物"]}'),
  ('eco-warrior', 'washes_reduced', '{"min": 30}')
ON CONFLICT DO NOTHING;

-- Note: No conditions for efficient-washer as it has special logic in the code

-- ブランドデータはCSV（data/brands.csv）からロードする方式に変更しました。
-- 以下の例を参考に Supabase ダッシュボードの "Insert from CSV" 機能、あるいは psql の \copy コマンドで投入してください。
--
--   -- psql 例（ローカルファイル）
--   \copy public.brands (name, name_hiragana, name_english, search_terms)
--     FROM 'data/brands.csv' DELIMITER ',' CSV HEADER;
--
-- CSV ファイルのカラム順：name,name_hiragana,name_english,search_terms
-- search_terms カラムは text[] 型に合わせて "{term1,term2,...}" 形式で記述します。
--
-- ※以前ここに記載していた INSERT 文は削除しました。

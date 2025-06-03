-- Initial data for ClothesManagerApp

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

-- Brands
INSERT INTO public.brands (name, name_hiragana, name_english, search_terms) VALUES
  -- ハイブランド
  ('Gucci', NULL, 'Gucci', ARRAY['gucci', 'グッチ']),
  ('Prada', NULL, 'Prada', ARRAY['prada', 'プラダ']),
  ('Louis Vuitton', NULL, 'Louis Vuitton', ARRAY['louis vuitton', 'ルイヴィトン', 'ルイビトン']),
  ('Dior', NULL, 'Dior', ARRAY['dior', 'ディオール']),
  ('Chanel', NULL, 'Chanel', ARRAY['chanel', 'シャネル']),
  ('Hermès', NULL, 'Hermes', ARRAY['hermes', 'エルメス']),
  ('Burberry', NULL, 'Burberry', ARRAY['burberry', 'バーバリー']),
  ('Balenciaga', NULL, 'Balenciaga', ARRAY['balenciaga', 'バレンシアガ']),
  ('Saint Laurent', NULL, 'Saint Laurent', ARRAY['saint laurent', 'サンローラン', 'イヴサンローラン']),
  ('Versace', NULL, 'Versace', ARRAY['versace', 'ヴェルサーチ']),
  ('Fendi', NULL, 'Fendi', ARRAY['fendi', 'フェンディ']),
  ('Givenchy', NULL, 'Givenchy', ARRAY['givenchy', 'ジバンシィ', 'ジバンシー']),
  ('Valentino', NULL, 'Valentino', ARRAY['valentino', 'ヴァレンティノ']),
  ('Bottega Veneta', NULL, 'Bottega Veneta', ARRAY['bottega veneta', 'ボッテガヴェネタ']),
  ('Celine', NULL, 'Celine', ARRAY['celine', 'セリーヌ']),
  ('Alexander McQueen', NULL, 'Alexander McQueen', ARRAY['alexander mcqueen', 'アレキサンダーマックイーン']),
  ('Loewe', NULL, 'Loewe', ARRAY['loewe', 'ロエベ']),
  ('Miu Miu', NULL, 'Miu Miu', ARRAY['miu miu', 'ミュウミュウ']),
  ('Tom Ford', NULL, 'Tom Ford', ARRAY['tom ford', 'トムフォード']),
  ('Balmain', NULL, 'Balmain', ARRAY['balmain', 'バルマン']),
  ('Dolce & Gabbana', NULL, 'Dolce & Gabbana', ARRAY['dolce & gabbana', 'dolce and gabbana', 'ドルチェ&ガッバーナ', 'ドルガバ']),
  ('Armani', NULL, 'Armani', ARRAY['armani', 'アルマーニ']),
  ('Salvatore Ferragamo', NULL, 'Salvatore Ferragamo', ARRAY['salvatore ferragamo', 'フェラガモ']),
  ('Cartier', NULL, 'Cartier', ARRAY['cartier', 'カルティエ']),
  ('Rolex', NULL, 'Rolex', ARRAY['rolex', 'ロレックス']),
  ('Tiffany & Co.', NULL, 'Tiffany & Co.', ARRAY['tiffany', 'ティファニー']),
  ('Bulgari', NULL, 'Bulgari', ARRAY['bulgari', 'bvlgari', 'ブルガリ']),
  ('Montblanc', NULL, 'Montblanc', ARRAY['montblanc', 'モンブラン']),
  ('Brunello Cucinelli', NULL, 'Brunello Cucinelli', ARRAY['brunello cucinelli', 'ブルネロクチネリ']),
  ('Max Mara', NULL, 'Max Mara', ARRAY['max mara', 'マックスマーラ']),

  -- 一般ブランド
  ('ユニクロ', 'ゆにくろ', 'UNIQLO', ARRAY['uniqlo', 'ユニクロ', 'ゆにくろ']),
  ('GU', 'じーゆー', 'GU', ARRAY['gu', 'ジーユー']),
  ('無印良品', 'むじるしりょうひん', 'MUJI', ARRAY['muji', '無印', 'むじ']),
  ('H&M', 'えいちあんどえむ', 'H&M', ARRAY['h&m', 'エイチアンドエム']),
  ('ZARA', 'ざら', 'ZARA', ARRAY['zara', 'ザラ']),
  ('GAP', 'ぎゃっぷ', 'GAP', ARRAY['gap', 'ギャップ']),
  ('BEAMS', 'びーむす', 'BEAMS', ARRAY['beams', 'ビームス']),
  ('ナイキ', 'ないき', 'NIKE', ARRAY['nike', 'ナイキ']),
  ('アディダス', 'あでぃだす', 'Adidas', ARRAY['adidas', 'アディダス']),
  ('プーマ', 'ぷーま', 'PUMA', ARRAY['puma', 'プーマ']),
  ('リーバイス', 'りーばいす', 'Levi''s', ARRAY['levis', 'levi''s', 'リーバイス']),
  ('ラコステ', 'らこすて', 'Lacoste', ARRAY['lacoste', 'ラコステ']),
  ('ポロ・ラルフローレン', 'ぽろらるふろーれん', 'Polo Ralph Lauren', ARRAY['polo ralph lauren', 'ポロラルフローレン', 'ラルフローレン'])
ON CONFLICT (name) DO UPDATE SET
  name_hiragana = EXCLUDED.name_hiragana,
  name_english = EXCLUDED.name_english,
  search_terms = EXCLUDED.search_terms;

-- Initial data for EverWear

-- バッジ定義と条件はクライアント側で管理されるため、DBには初期データを投入しません
-- ユーザーのバッジ獲得状況のみDBで管理します

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

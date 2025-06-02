# バッジ永続化の実装

このドキュメントでは、アプリのバッジシステムの永続化実装について説明します。この実装により、バッジの獲得状況がアプリの再起動、再インストール、別端末でのログインでも保持されるようになります。

## 概要

バッジシステムは以下の3つのテーブルを使用して実装されています：

1. `badge_definitions` - バッジの基本情報（名前、説明、画像URL、カテゴリなど）
2. `badge_conditions` - バッジの獲得条件
3. `user_badges` - ユーザーが獲得したバッジの情報

## データベーススキーマ

### badge_definitions テーブル

バッジの基本情報を格納します。

```sql
CREATE TABLE public.badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('usage', 'efficiency', 'milestone', 'special')),
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### badge_conditions テーブル

バッジの獲得条件を格納します。

```sql
CREATE TABLE public.badge_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL,
  condition_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### user_badges テーブル

ユーザーが獲得したバッジの情報を格納します。

```sql
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- ユーザーごとにバッジIDは一意
  UNIQUE(user_id, badge_id)
);
```

## セットアップ手順

1. Supabaseプロジェクトのダッシュボードにログインします。
2. SQLエディタを開きます。
3. `db/schema.sql` ファイルの内容をコピーしてSQLエディタに貼り付けます。
4. SQLを実行してテーブルを作成し、初期データを挿入します。

注: 以前は `sql/badge_tables.sql` にバッジ関連のスキーマが定義されていましたが、現在はすべてのスキーマ定義が `db/schema.sql` に統合されています。

## 実装の詳細

### バッジサービス

`badgeService.ts` ファイルには、バッジ関連の操作を行うヘルパー関数が実装されています：

- `fetchBadgeDefinitions()` - バッジ定義をデータベースから取得
- `fetchBadgeConditions()` - バッジ条件をデータベースから取得
- `fetchUserBadges()` - ユーザーが獲得したバッジをデータベースから取得
- `saveNewlyEarnedBadges()` - 新しく獲得したバッジをデータベースに保存
- `evaluateBadgeCondition()` - バッジ条件を評価
- `calculateBadgeProgress()` - バッジの進捗状況を計算

### バッジの取得と永続化

`supabaseStatisticsService.ts` の `getBadges()` 関数は以下のように動作します：

1. キャッシュからバッジデータを取得（キャッシュがある場合）
2. ユーザーセッションを取得
3. アイテムデータを取得
4. バッジ評価のための統計データを計算
5. バッジ定義、条件、ユーザーのバッジをデータベースから取得
6. バッジ定義がない場合はデフォルトのバッジを使用
7. 各バッジについて：
   - すでに獲得済みかチェック
   - 獲得済みでない場合は条件を評価
   - 条件を満たしている場合は獲得日を設定
8. 新しく獲得したバッジをデータベースに保存
9. バッジデータをキャッシュして返す

### バッジ条件の評価

バッジ条件は `condition_type` と `condition_value` で定義されます。例えば：

- `total_items` - 登録アイテム数
- `total_wears` - 総着用回数
- `total_washes` - 総洗濯回数
- `max_item_wears` - 最も着用回数の多いアイテムの着用回数
- `washes_reduced` - 削減した洗濯回数
- `all_categories` - すべてのカテゴリにアイテムがあるか

特殊なケースとして、`efficient-washer` バッジは複雑な条件を持つため、コード内で特別に処理されています。

## フォールバックメカニズム

データベースからバッジ定義を取得できない場合や、エラーが発生した場合は、ハードコードされたデフォルトのバッジが使用されます。これにより、データベース接続に問題がある場合でもアプリは正常に動作します。

## 注意点

- バッジデータはキャッシュされるため、バッジの獲得状況が変わってもすぐには反映されない場合があります。キャッシュの有効期限は5分です。
- バッジの画像URLは現在プレースホルダーになっています。実際の画像を用意する必要があります。

# EverWear（エバーウェア）

お気に入りの洋服を「着用回数」で管理し、洗いすぎず長く・きれいに使うための衣類管理アプリです。

---

## コンセプト

- **課題**: 洋服を洗いすぎると傷みが早く、コストと環境負荷も増える。一方で「○回着たら1回洗う」といったルールを手元で管理するのは難しい。
- **EverWear の役割**: 各アイテムの着用回数と洗濯閾値を記録し、**残り着用可能回数**を一目で把握。洗濯推奨タイミングを通知し、無駄な洗濯を減らして洋服を長持ちさせる。
- **主な価値**:
  - 洋服のコンディションを最適に保つ
  - 洗濯コスト・水道・電気・洗剤の節約
  - 環境負荷の削減（CO2・水資源など）の可視化

---

## 技術スタック

| 分野 | 技術 |
|------|------|
| フレームワーク | **Expo** (React Native) SDK 53 |
| 言語 | **TypeScript** |
| ルーティング | **Expo Router**（ファイルベース） |
| UI | React Native, React Navigation (Bottom Tabs / Material Top Tabs), Ionicons |
| 状態管理 | React Context（認証・衣類・テーマ・オンボーディング・購入・統計・タブリセット） |
| バックエンド | **Supabase**（Auth, PostgreSQL, Storage） |
| 課金 | **RevenueCat**（サブスクリプション：月額・年額） |
| 多言語 | **i18next** / react-i18next（日本語・英語） |
| 画像 | expo-image-picker, expo-image-manipulator, expo-image |
| その他 | expo-apple-authentication, react-native-purchases, AsyncStorage, expo-localization |

### 開発・ビルド

- **EAS Build**（Expo Application Services）で iOS / Android ネイティブビルド
- **Expo Dev Client** による開発ビルド
- Supabase Edge Functions（例: アカウント削除、RevenueCat Webhook）

---

## 機能一覧

### 認証・アカウント

- メールアドレスでのサインアップ / ログイン / パスワードリセット
- メール認証（確認・リンクアカウント・再認証）
- Apple Sign In / Google Sign In
- アカウント連携（link-account）
- アカウント削除（Supabase Edge Function 連携）

### 衣類アイテム管理

- **登録**: 写真、名前、カテゴリ、ブランド、洗濯閾値（デフォルト 3 回）、メモ、コンディション、購入価格
- **カテゴリ**: トップス / ボトムス / ジャケット / アウター / セットアップ / ワンピース / シューズ / バッグ / 小物 / その他
- **編集・削除**: 既存アイテムの更新・削除
- **一覧**: カテゴリ別タブ、残り着用可能回数・洗濯推奨の表示、ソート・フィルタ

### 着用・洗濯記録

- **着用記録**: 日付指定で着用を記録（同一日重複防止）
- **洗濯記録**: 日付指定で洗濯を記録し、着用回数をリセット
- **一括記録**: 複数アイテムの着用・洗濯をまとめて記録（batch-record）
- 着用回数は「最後の洗濯以降」で自動集計

### 履歴

- **履歴タブ**: 着用・洗濯の履歴一覧
- **カレンダー**: 日付指定でのフィルタ・表示
- **アイテム詳細**: 各アイテムの着用・洗濯履歴とカレンダー表示

### 統計・分析

- **統計タブ**: ランキング・効率・インパクトなどへの入口
- **ランキング**: 着用回数ランキング（期間・カテゴリ指定）
- **効率（efficiency）**: 着用回数と洗濯閾値に基づく成績・最適化の可視化
- **インパクト（impact）**: 洗濯削減による環境・コスト削減効果の可視化
- **アイテム別統計**: 各アイテムの着用・洗濯パターンと詳細分析

### バッジ・ゲーミフィケーション

- **バッジ一覧**: 獲得済み / 未獲得バッジの表示
- **バッジ概要**: 全バッジの条件・説明の一覧
- 初回登録・初回着用・初回洗濯、着用回数ミルストーン、洗濯削減、連続記録、カテゴリコンプリートなど
- バッジ獲得時の通知・祝福表示

### サブスクリプション（プレミアム）

- **RevenueCat** による月額・年額サブスクリプション
- 無料プラン: アイテム数制限（例: 5 件まで）
- プレミアム: アイテム無制限・分析機能の解放など
- 購入・復元・状態確認は PurchaseContext と purchaseService で管理

### 設定・その他

- **設定タブ**: アカウント、テーマ（ライト/ダーク/システム連動）、言語、オンボーディング再表示、サブスクリプション、利用規約・プライバシーポリシー（WebView）
- **オンボーディング**: 初回起動時の機能説明と権限説明
- **ダークモード**: ThemeContext によるテーマ切り替え
- **多言語**: 日本語・英語（CFBundleLocalizations: en, ja）

---

## プロジェクト構成（抜粋）

```
├── app/                    # Expo Router の画面
│   ├── (tabs)/             # ホーム / 履歴 / 統計 / 設定
│   ├── auth/               # ログイン・サインアップ・認証コールバック等
│   ├── item/               # アイテム詳細・編集・統計
│   ├── add.tsx             # 新規アイテム追加
│   ├── batch-record.tsx    # 一括着用・洗濯記録
│   ├── ranking.tsx, efficiency.tsx, impact.tsx
│   ├── badges.tsx, badges-overview.tsx
│   ├── subscription.tsx, account.tsx, webview.tsx
│   └── index.tsx, _layout.tsx
├── components/             # 共通コンポーネント（カテゴリ別一覧、カレンダー、モーダル等）
├── contexts/               # 認証・衣類・テーマ・オンボーディング・購入・統計・タブ
├── lib/                    # Supabase クライアント、認証、ストレージ、i18n、日付ユーティリティ
├── services/               # 衣類・統計・バッジ・購入のサービス層
├── types/                  # 衣類・カテゴリ・DB・統計の型定義
├── db/                     # PostgreSQL スキーマ・RLS・関数（schema.sql 等）
├── supabase/               # Edge Functions・メールテンプレート
├── locales/                # ja.json, en.json
├── data/                   # ブランドマスタ（brands.csv）
└── docs/                   # 利用規約・プライバシーポリシー（md）
```

---

## データベース（Supabase）

- **users**: Supabase Auth と連携するユーザー情報
- **clothing_items**: 衣類アイテム（名前・カテゴリ・brand_id・画像・着用回数・洗濯閾値・最終着用/洗濯日・メモ・コンディション・購入価格等）
- **wear_history**: 着用日（clothing_item_id, wear_date）、同一日重複不可
- **wash_history**: 洗濯日（clothing_item_id, wash_date）、同一日重複不可
- **brands**: ブランドマスタ（name, name_hiragana, name_english, search_terms）
- **user_badges**: ユーザーが獲得したバッジ（badge_id はクライアント定義）
- **user_subscriptions**: RevenueCat 連携のサブスクリプション状態

Row Level Security (RLS) により、各ユーザーは自分のデータのみアクセス可能。着用・洗濯の追加/削除と集計は `add_wear_record_and_return_item` 等の PostgreSQL 関数で一括処理。

---

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

`.env.example` をコピーして `.env` を作成し、値を設定してください。

```bash
cp .env.example .env
```

主な項目:

- `EXPO_PUBLIC_USE_MOCK_DATA` … モックデータ利用時は `true`
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_*` … Google Sign In 用クライアント ID
- `EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS` / `EXPO_PUBLIC_REVENUE_CAT_API_KEY_ANDROID`
- `EXPO_PUBLIC_PREMIUM_MONTHLY_PRODUCT_ID` / `EXPO_PUBLIC_PREMIUM_YEARLY_PRODUCT_ID`
- （Webhook 用）`REVENUE_CAT_WEBHOOK_SECRET`

### 3. Supabase の準備

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. SQL エディタで `db/schema.sql` および必要に応じて `db/delete_account_function.sql` 等を実行
3. ストレージポリシーは `db/storage_policies.sql` を参照して設定

### 4. アプリの起動

```bash
npx expo start
```

- 開発ビルドで起動する場合: `npx expo start --dev-client --clear`
- iOS: `eas build --profile development --platform ios`
- Android: `eas build --profile development --platform android`

---

## ブランドマスタの更新

ブランドは `data/brands.csv` で管理します。カラム順序:

```csv
name,name_hiragana,name_english,search_terms
```

`search_terms` は PostgreSQL の `text[]` に合わせて `"{term1,term2,...}"` 形式で記述してください。

### Supabase ダッシュボードでの投入

1. **Table Editor** → **brands** を選択
2. **Insert from CSV** で `data/brands.csv` をアップロード
3. `id`（UUID）は自動生成のため CSV には含めない

### psql で投入する場合

```bash
psql "$SUPABASE_DB_URL" -c "\copy public.brands (name, name_hiragana, name_english, search_terms) FROM 'data/brands.csv' DELIMITER ',' CSV HEADER;"
```

---

## TestFlight（iOS）配布の流れ

1. **前提**: Apple Developer Program、App Store Connect のアプリ登録、RevenueCat のプロダクト・Offering 設定、1024×1024 のアプリアイコン（`assets/images/icon.png`）を用意
2. **EAS 環境変数**: Project → Environment Variables で `EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS` 等を **production** 用に登録（Secret 推奨）
3. **ビルド**: `eas build --profile production --platform ios`
4. **提出**: `eas submit --profile production --platform ios` で TestFlight に提出
5. App Store Connect で内部/外部テストの設定・審査提出

`eas.json` の production プロファイルでは `autoIncrement: true` と `environment: "production"` を利用しています。

---

## 参考リンク

- [Expo ドキュメント](https://docs.expo.dev/)
- [Supabase ドキュメント](https://supabase.com/docs)
- 要件の詳細は `REQUIREMENTS.md` を参照

---

## ライセンス・利用規約

- 利用規約・プライバシーポリシーは `docs/` 内の `terms-ja.md` / `terms-en.md`、`privacy-ja.md` / `privacy-en.md` を参照してください。

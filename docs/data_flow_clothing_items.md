# アイテム情報データフロー整理（HomeTab ＆ ItemDetail 画面）

最終更新: 2025-06-12

---

## 1. 全体像

```
Supabase (4テーブル) ─┐
  ├─ clothing_items
  ├─ brands
  ├─ wear_history
  └─ wash_history
          │
          ▼
services/supabaseClothingService.ts        (DB I/O, 画像アップロード, BrandCache)
          │
          ▼
services/clothingServiceFactory.ts         (Mock ↔︎ Supabase の切替)
          │
          ▼
contexts/ClothingContext.tsx               (React Context でグローバル状態管理)
          │            ▲
          │            │ refreshData / loadBrands で再取得
          │            │（明示的／初回マウント時）
          ▼            │
components/HomeTabView.tsx          app/item/[id].tsx (ItemDetail)
          │                                │
          │  clothingItems をカテゴリー別 UI へ分配  │ item.id に一致するデータを抽出
          │  wearCount 等は `wearItem` で即時反映    │ 履歴追加後も Context から最新表示
          ▼                                ▼
       UI / Hooks                     UI / Hooks
```

- **サービス層** で Supabase とやり取りし、**Context 層** でアプリ全体へ state を配信。
- CRUD 操作は Context のメソッド経由でサービス層へ委譲し、**成功後にローカル state を即時更新**。
- Brands は `BrandCache` にメモリ＆AsyncStorage 保存され、一定時間で自動失効 or `refreshBrandsCache` で強制更新。

---

## 2. データ取得フロー

| ステップ | 説明 | 関与ファイル |
| --- | --- | --- |
| ① `ClothingProvider` マウント | `loadData()` を `useEffect` で呼び出し | contexts/ClothingContext.tsx |
| ② `loadData()` | `clothingService.getClothingItemsWithHistory()` を呼び出し | contexts/ClothingContext.tsx |
| ③ `getClothingItemsWithHistory()` | `supabaseDataService.getItemsWithHistory()` に委譲（N+1解消済み）| services/supabaseClothingService.ts |
| ④ Supabase | `clothing_items` LEFT JOIN `brands`, `wear_history`, `wash_history` を実行 | services/supabaseDataService.ts |
| ⑤ 結果整形 | `toAppClothingItem()` でアプリ用オブジェクトへ変換 | types/database.ts |
| ⑥ Context へ保存 | `setClothingItems(items)` でグローバル state 化 | contexts/ClothingContext.tsx |

> ブランド一覧も同様に `loadBrands()` → `getAllBrands()` → `BrandCache` → Context へ保存。

---

## 3. キャッシュ階層

| レイヤ | 対象データ | 失効トリガ | 備考 |
| --- | --- | --- | --- |
| BrandCache (AsyncStorage) | brands, extendedBrands | `ttl` 超過 or 明示的リフレッシュ | lib/brandCache.ts |
| React Context | clothingItems, sortConfig ほか | アプリ終了 or Provider 再マウント | メモリのみ |

※ clothingItems は現状 **永続キャッシュ無し**。アプリ再起動で再フェッチ。

---

## 4. 更新フロー（例: 着用記録追加）

1. ItemDetail で `wearItem(itemId, date)` 呼び出し
2. Context 内 `wearItem()` が `clothingService.addWearRecord()` を実行
3. サーバー成功後、同メソッドが `updateItemInState()` を使って
   - `wearCount`++, `lastWorn`, `wearHistory[]` を即時ローカル更新
4. UI は Context から再レンダリング（HomeTab の一覧・カテゴリ別タブ・ItemDetail 共に同期）

> 削除・更新・追加も同様パターン。Context 内で部分更新 or 全体再フェッチ（`refreshData`）。

---

## 5. 画面別の依存

### HomeTabView
- `useClothing()` で `clothingItems` と `sortConfig` を取得。
- `clothingItems` をカテゴリー毎にフィルタし、FlatList へ供給。
- 更新後は Provider state 変更により自動再レンダリング。

### ItemDetail ([id].tsx)
- ルーティングパラメータ `id` で Context から該当アイテムを抽出。
- 履歴の追加・削除ボタンはすべて Context メソッド経由。
- 画像 URL は `storageClient` で signed URL を都度取得（キャッシュ無し）。

---

## 6. ライフサイクル & 課題

| 項目 | 現状 | 懸念点 |
| --- | --- | --- |
| データ同期 | 操作成功直後に Context を楽観的更新 | 他端末との競合・サーバー側変更を検知しない |
| フェッチ回数 | アプリ起動毎に全件取得 | データ増加で初回ロード遅延 |
| 永続キャッシュ | brands のみ | clothingItems にキャッシュ無くオフライン不可 |
| 正規化 | ネスト配列（wearHistory など）を持つまま保持 | ランダムアクセス & 部分更新コスト高 |
| 画像取得 | 画面毎に signed URL 再生成 | 同一セッション内でも冗長呼び出し |

---

## 7. 改善案

1. **クエリキャッシュライブラリ導入**  
   - React Query / TanStack Query でフェッチ・キャッシュ・インバリデーションを統一。
   - 楽観的更新後に `invalidateQueries` でサーバー整合性も確保。

2. **リアルタイム同期**  
   - Supabase Realtime (Postgres CDC) チャンネル購読で wear_history 等の INSERT/DELETE を監視。
   - 複数端末間の即時反映を実現。

3. **ローカル永続キャッシュ**  
   - clothingItems を AsyncStorage + MMKV などへ保存し、起動高速化 & オフライン閲覧対応。
   - ETag or updated_at で差分同期。

4. **データ正規化**  
   - `clothingItems` と `wear_history` / `wash_history` を Context で分離し、Map で参照。
   - 部分更新のパフォーマンス向上と依存更新の明確化。

5. **画像キャッシュ戦略**  
   - Supabase Storage の公開バケット + 期限長めの URL に変更、または expo-image + CacheKey を利用。

6. **サービス層分割**  
   - `supabaseClothingService` を QueryBuilder 層と Domain 変換層に分け、テストを容易に。

---

## 8. 次のステップ

1. TanStack Query を試験導入し、`getClothingItemsWithHistory` を `useQuery` 化。
2. Context は UI コントロール（ソート設定等）のみ保持し、データは Query キャッシュを参照。
3. Realtime チャンネルの POC を ItemDetail 画面で実装し、コンフリクト解消 UX を検証。

---

## 9. 制約条件下でのシンプル最適設計

<details>
<summary>前提条件</summary>

- **オフライン起動** : 不要
- **リアルタイム同期** : 不要
- **高速化優先 & 正規化は二の次**
- **実装のシンプルさ優先**
</details>

### 9.1 設計方針

| 項目 | 方針 | 理由 |
| --- | --- | --- |
| ブランドデータ | **キャッシュしない** | 1 回の `SELECT id,name FROM brands ORDER BY name` は数 KB 程度でレイテンシ影響小。キャッシュ実装コスト削減。 |
| アイテムデータ | 起動時に 1 度だけ取得して Context に保持 | オフライン不要のため永続キャッシュを省略し、処理を最小化。 |
| データ更新 | 楽観的に Context を直接更新し、API 失敗時のみロールバック | 高速な UI 応答を維持しつつ実装を簡素化。 |
| 再取得タイミング | `pullToRefresh` など明示アクション時に `refreshData()` | 不要な通信を抑えつつ、ユーザ制御のリフレッシュを提供。 |
| 画像 URL | 既存の signed URL 方式のまま | 実装変更が最小。 |

### 9.2 データフロー (更新)

```
Supabase ─▶ supabaseClothingService ─▶ ClothingContext ─▶ UI
   ▲                                         │
   └──────  API 操作 (add/update/delete) ◀───┘
```

- **ブランド一覧取得** は `loadBrands()` をアプリ起動時に 1 回呼び出すだけ。
- `BrandCache` 関連コードは将来的に削除可能だが、影響範囲を考慮して「キャッシュを常に MISS させる」実装でも可。

### 9.3 期待される効果

1. キャッシュ実装・保守コストを削減し、コードベースを簡素化。
2. 起動時の通信は 2 クエリ（items + brands）に集約、従来と比較して大差ないレイテンシ。
3. Context のみで状態を保持するため学習コストが低い。

### 9.4 今後の実装メモ

- `BrandCache` クラスで **TTL=0** とするか、呼び出し側でキャッシュをバイパス。
- `getAllBrands()` を直接 Supabase に問い合わせる実装へリファクタ。
- ドメインロジック・UI は現行のまま動作する。

---

以上が、指定された制約下での最小かつ高速な設計案です。

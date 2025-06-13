# 洗濯効率分析画面：アイテム画像表示 追加方針

## 1. 現状整理
| 画面 | ファイル | 画像表示 | 実装概要 |
|------|----------|-----------|-----------|
| 着用回数ランキング | `app/ranking.tsx` | あり | ① `useState<Record<string,string>>` で署名付き URL をキャッシュ<br>② `useEffect` で `getPrivateUrls()` により一括取得<br>③ `<Image>` (expo-image) コンポーネントでサムネイルを表示 |
| 洗濯効率分析 | `app/efficiency.tsx` | なし | アイテムリストは存在するが画像 UI と URL 取得処理が未実装 |

## 2. 追加要件
1. 洗濯効率分析画面のアイテムリストに 60x60 の正方形サムネイルを左端に表示する。
2. ランキング画面のサムネイルも 60x60 に統一する。
3. 画像 URL の取得・キャッシュ方法はランキング画面と同一ロジックを再利用する。
4. 画像取得エラー時は固定のフォールバック画像を表示する。

## 3. 実装ステップ
### 3.1 データ準備
- `efficiencyData` の `Item` 型に `imageUrl` が含まれていることを確認。
- 含まれていない場合は **services 層**で API 応答を拡張し、画像キーを追加する。

### 3.2 画像 URL 取得ロジックの共通化
`hooks/useImageUrls.ts` を作成し、ランキング画面の処理を移動：

```tsx
// hooks/useImageUrls.ts
import { useState, useEffect } from 'react';
import { getPrivateUrls } from '../lib/storageClient';

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * 画像URLを一括で取得するカスタムフック
 * @param items 画像情報を含む配列
 * @param options 画像オプション (width, height, quality, resize)
 * @returns 画像URLのマップ (id -> url)
 */
export const useImageUrls = (
  items: { id: string; imageUrl: string }[],
  options: ImageOptions = {}
) => {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const { width = 160, height = 160, quality = 80, resize = 'cover' } = options;

  useEffect(() => {
    const loadAllImageUrls = async () => {
      if (!items || items.length === 0) return;

      // 画像パスの配列を作成（既にURLがあるものは除外）
      const itemsNeedingUrls = items.filter(
        item => item.imageUrl && 
               !item.imageUrl.startsWith('http') && 
               !imageUrls[item.id]
      );

      if (itemsNeedingUrls.length === 0) return;

      try {
        // 画像パスの配列を抽出
        const imagePaths = itemsNeedingUrls.map(item => item.imageUrl);
        
        // 一括で署名付きURLを取得（指定されたサイズと品質で取得）
        const urls = await getPrivateUrls(imagePaths, width, height, quality, resize);
        
        // 取得したURLをマッピング
        const newImageUrls: Record<string, string> = {};
        itemsNeedingUrls.forEach((item, index) => {
          if (urls[index]) {
            newImageUrls[item.id] = urls[index]!;
          }
        });

        setImageUrls(prev => ({
          ...prev,
          ...newImageUrls
        }));
      } catch (error) {
        console.error('Error loading image URLs:', error);
      }
    };

    loadAllImageUrls();
  }, [items, width, height, quality, resize]);

  return imageUrls;
};
```

### 3.3 各画面での利用方法
#### 洗濯効率分析画面 (`impact.tsx`)
```tsx
// フックをインポート
import { useImageUrls } from '../hooks/useImageUrls';

// コンポーネント内で使用（60x60の画像をリクエスト、品質は標準80%でカバー表示）
const imageUrls = useImageUrls(items, { 
  width: 60, 
  height: 60,
  quality: 80,
  resize: 'cover'
});

// レンダリング部分
<Image
  source={{
    uri: imageUrls[item.id] || item.imageUrl || require('@/assets/images/placeholder.png'),
    cacheKey: item.imageUrl,
    width: 60,
    height: 60
  }}
  style={{
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#f0f0f0'
  }}
  contentFit="cover"
  onError={() => {
    // エラー時は何もしない（デフォルトのフォールバック画像が表示される）
  }}
/>
```

#### ランキング画面 (`ranking.tsx`)
```tsx
// フックをインポート
import { useImageUrls } from '../hooks/useImageUrls';

// 既存の状態管理を削除し、以下に置き換え（80x120の画像をリクエスト、品質は標準80%でカバー表示）
const imageUrls = useImageUrls(items, { 
  width: 80, 
  height: 120,
  quality: 80,
  resize: 'cover'
});

// レンダリング部分
<Image
  source={{
    uri: imageUrls[item.id] || item.imageUrl || require('@/assets/images/placeholder.png'),
    cacheKey: item.imageUrl,
    width: 80,
    height: 120
  }}
  style={{
    width: 80,
    height: 120,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#f0f0f0'
  }}
  contentFit="cover"
  onError={() => {
    // エラー時は何もしない（デフォルトのフォールバック画像が表示される）
  }}
/>
```

## 4. 全画面での共通コンポーネント適用方針

### 4.1 対象画面と修正内容

| 画面 | ファイル | 現在の実装 | 修正内容 |
|------|----------|------------|----------|
| ホーム画面 | `components/HomeTabView.tsx` | 各カテゴリコンポーネントで個別実装 | 共通フックに置き換え |
| アイテム一覧 | `components/ItemList.tsx` | `getPrivateUrls` 直接使用 | 共通フックに置き換え |
| アイテム詳細 | `app/item/[id].tsx` | 直接URL取得 | 共通フックに置き換え |
| お気に入り | `app/favorites.tsx` | 直接URL取得 | 共通フックに置き換え |
| 着用履歴 | `app/history.tsx` | 直接URL取得 | 共通フックに置き換え |

### 4.2 修正手順

1. **共通フックの配置**
   - `hooks/useImageUrls.ts` を作成
   - ドキュメント化と型定義を充実させる

2. **画面ごとの移行**
   - 各画面で個別に実装されている画像取得処理を特定
   - 共通フックを使用するように置き換え
   - 既存のエラーハンドリングやローディング状態の管理を調整

3. **パフォーマンス最適化**
   - メモ化を使用して不要な再レンダリングを防止
   - 画像プリフェッチの最適化

4. **テスト**
   - 各画面での画像表示を確認
   - オフライン時のフォールバック動作を確認

## 5. 影響範囲と互換性

### 5.1 メリット
- コードの重複削減
- 一貫した画像取得ロジック
- メンテナンス性の向上
- 今後の機能追加・変更が容易に

### 5.2 注意点
- 既存の実装と互換性を維持する必要あり
- パフォーマンスへの影響を監視
- エラーハンドリングの統一

## 6. 移行手順

1. **準備フェーズ**
   - 共通フック `useImageUrls` を実装
   - 既存の画像取得処理を調査・整理

2. **段階的移行**
   1. ランキング画面を修正
   2. 洗濯効率分析画面を追加
   3. ホーム画面の各カテゴリコンポーネントを順次移行
   4. その他の画面を移行

3. **テストと検証**
   - 各画面での画像表示を確認
   - パフォーマンス計測
   - エッジケースのテスト

4. **リファクタリング**
   - 不要なコードの削除
   - パフォーマンスチューニング
   - ドキュメント更新

## 6. 参考実装リンク
- `expo-image` ドキュメント: https://docs.expo.dev/versions/latest/sdk/image/

---
担当: <your-name>
更新日: 2025-06-13

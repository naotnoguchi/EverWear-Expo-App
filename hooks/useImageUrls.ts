import { useEffect, useState } from 'react';
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
  const { width = 160, height = 160 } = options;

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
        
        // 一括で署名付きURLを取得（指定されたサイズで取得）
        const urls = await getPrivateUrls(imagePaths, width, height);
        
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
  }, [items, width, height]);

  return imageUrls;
}; 
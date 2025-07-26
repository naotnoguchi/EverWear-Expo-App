import { useEffect, useState } from 'react';
import { getPrivateUrls } from '../lib/storageClient';

/**
 * 画像URLを一括で取得するカスタムフック
 * @param items 画像情報を含む配列
 * @returns 画像URLのマップ (id -> url)
 */
export const useImageUrls = (
  items: { id: string; imageUrl: string }[]
) => {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

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
        
        // 一括で署名付きURLを取得
        const urls = await getPrivateUrls(imagePaths);
        
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
  }, [items]);

  return imageUrls;
}; 
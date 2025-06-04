import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { 
  storage, 
  getAuthenticatedStorage, 
  CLOTHING_BUCKET, 
  getPrivateUrl
} from './storageClient';
import { auth } from './authClient';

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// ファイル拡張子を取得する関数
const getFileExtension = (uri: string): string => {
  // URIからファイル拡張子を抽出
  const extension = uri.split('.').pop()?.toLowerCase();

  // 一般的な画像形式をチェック
  if (['jpg', 'jpeg', 'png', 'heic', 'heif'].includes(extension || '')) {
    return extension || 'jpg';
  }

  // デフォルトはjpg
  return 'jpg';
};

// コンテンツタイプを取得する関数
const getContentType = (extension: string): string => {
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'heic': 'image/heic',
    'heif': 'image/heif'
  };

  return contentTypes[extension] || 'image/jpeg';
};

// アルバムから画像を選択する関数
export const pickImageFromGallery = async (): Promise<string | null> => {
  // 権限の確認
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('権限エラー', '画像を選択するには、写真へのアクセス許可が必要です。');
    return null;
  }

  // 画像ピッカーを起動
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }

  return null;
};

// カメラで画像を撮影する関数
export const takePhotoWithCamera = async (): Promise<string | null> => {
  // カメラ権限の確認
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('権限エラー', '写真を撮影するには、カメラへのアクセス許可が必要です。');
    return null;
  }

  // カメラを起動
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }

  return null;
};

// 画像選択オプションを表示する関数
export const showImagePickerOptions = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      '画像を選択',
      '画像の取得方法を選択してください',
      [
        {
          text: 'カメラで撮影',
          onPress: async () => {
            const uri = await takePhotoWithCamera();
            resolve(uri);
          },
        },
        {
          text: 'アルバムから選択',
          onPress: async () => {
            const uri = await pickImageFromGallery();
            resolve(uri);
          },
        },
        {
          text: 'キャンセル',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
};

// 画像をSupabaseにアップロードする関数
export const uploadImage = async (uri: string, userId: string): Promise<string | null> => {
  try {
    console.log('Uploading image for user:', userId);

    // ファイル拡張子を取得
    const extension = getFileExtension(uri);

    // ファイル名を生成（ユーザーIDとタイムスタンプを含む）
    const fileName = `${userId}_${Date.now()}.${extension}`;
    const filePath = `${userId}/${fileName}`; // ユーザーIDでフォルダ分け

    // ファイルの内容を取得
    const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
    if (!fileInfo.exists) {
      console.error('File does not exist');
      return null;
    }

    // ファイルサイズをチェック
    if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
      console.warn('Warning: File size is large (> 10MB), upload may be slow');
    }

    // コンテンツタイプを取得
    const contentType = getContentType(extension);

    // 認証情報を取得
    const { data: session } = await auth.getSession();
    const accessToken = session?.session?.access_token || supabaseAnonKey;

    // Supabaseのアップロードエンドポイントを構築
    const uploadEndpoint = `${supabaseUrl}/storage/v1/object/${CLOTHING_BUCKET}/${filePath}`;

    // FileSystem.uploadAsyncを使用して直接アップロード
    try {
      const uploadResult = await FileSystem.uploadAsync(uploadEndpoint, uri, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': contentType
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT
      });

      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        // アップロード成功
        console.log('Upload successful');

        // 認証済みURLを取得（プライベートアクセス用）
        try {
          const signedUrl = await getPrivateUrl(filePath);
          if (signedUrl) {
            return signedUrl;
          }
          // 署名付きURLの取得に失敗した場合はエラーとして扱う
          console.error('Failed to get signed URL, returning null');
          return null;
        } catch (urlError) {
          console.error('Error getting private URL:', urlError);
          return null;
        }
      } else {
        // アップロード失敗
        console.error('Upload failed with status:', uploadResult.status);
        return null;
      }
    } catch (uploadError) {
      console.error('Error during upload:', uploadError);
      return null;
    }
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
};

// 画像を削除する関数
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // URLからファイルパスを抽出
    const urlObj = new URL(imageUrl);
    const pathParts = urlObj.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('object') + 1).join('/');

    if (!filePath) return false;

    // 認証済みストレージクライアントを取得
    const authStorage = await getAuthenticatedStorage();

    // 画像を削除
    const { error } = await authStorage
      .from(CLOTHING_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    console.log('Image deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
};

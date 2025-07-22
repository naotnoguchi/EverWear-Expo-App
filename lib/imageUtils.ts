import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { auth } from './authClient';
import {
    CLOTHING_BUCKET,
    getAuthenticatedStorage
} from './storageClient';

// UUIDを生成するヘルパー関数
const generateUUID = (): string => {
  // タイムスタンプ部分（最初の8文字 + 中間の4文字 + 次の4文字）
  const timestamp = Date.now().toString(16).padStart(12, '0');

  // ランダム部分（残りの16文字）
  const randomPart = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  // UUID形式に整形: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return `${timestamp.slice(0, 8)}-${timestamp.slice(8, 12)}-4${randomPart.slice(0, 3)}-${
    (8 + Math.floor(Math.random() * 4)).toString(16)}${randomPart.slice(3, 6)}-${randomPart.slice(6, 18)}`;
};

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
const pickImageFromGallery = async (translate: (key: string) => string): Promise<string | null> => {
  try {
    // 権限をリクエスト
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(translate('common.error'), translate('imagePicker.errors.galleryPermission'));
      return null;
    }

    // 画像を選択
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      // 画像を1024x1024にリサイズ
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024, height: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulatedImage.uri;
    }
    return null;
  } catch (error) {
    console.error('[ImagePicker] Gallery error:', error);
    Alert.alert(translate('common.error'), translate('imagePicker.errors.galleryError'));
    return null;
  }
};

// カメラで写真を撮影する関数
const takePhotoWithCamera = async (translate: (key: string) => string): Promise<string | null> => {
  try {
    // 権限をリクエスト
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(translate('common.error'), translate('imagePicker.errors.cameraPermission'));
      return null;
    }

    // カメラを起動
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1.0,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error('[ImagePicker] Camera capture error:', error);
    Alert.alert(translate('common.error'), translate('imagePicker.errors.cameraError'));
    return null;
  }
};

// 画像選択オプションを表示する関数
export const showImagePickerOptions = async (t?: (key: string) => string): Promise<string | null> => {
  // 翻訳関数が提供されない場合のフォールバック
  const translate = t || ((key: string) => {
    const fallbacks: Record<string, string> = {
      'imagePicker.title': '画像を選択',
      'imagePicker.message': '画像の取得方法を選択してください',
      'imagePicker.camera': 'カメラで撮影',
      'imagePicker.gallery': 'アルバムから選択',
      'imagePicker.cancel': 'キャンセル',
      'imagePicker.errors.cameraError': 'カメラでの撮影中にエラーが発生しました',
      'imagePicker.errors.galleryError': 'アルバムからの画像選択中にエラーが発生しました',
      'imagePicker.errors.galleryPermission': '画像を選択するには、写真へのアクセス許可が必要です。',
      'imagePicker.errors.cameraPermission': '写真を撮影するには、カメラへのアクセス許可が必要です。'
    };
    return fallbacks[key] || key;
  });

  return new Promise((resolve) => {
    Alert.alert(
      translate('imagePicker.title'),
      translate('imagePicker.message'),
      [
        {
          text: translate('imagePicker.camera'),
          onPress: async () => {
            try {
              const uri = await takePhotoWithCamera(translate);
              resolve(uri);
            } catch (error) {
              console.error('[ImagePicker] Camera option error:', error);
              Alert.alert(translate('common.error'), translate('imagePicker.errors.cameraError'));
              resolve(null);
            }
          },
        },
        {
          text: translate('imagePicker.gallery'),
          onPress: async () => {
            try {
              const uri = await pickImageFromGallery(translate);
              resolve(uri);
            } catch (error) {
              console.error('[ImagePicker] Gallery option error:', error);
              Alert.alert(translate('common.error'), translate('imagePicker.errors.galleryError'));
              resolve(null);
            }
          },
        },
        {
          text: translate('imagePicker.cancel'),
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
};

// 画像をリサイズする関数
const resizeImage = async (uri: string): Promise<string> => {
  try {
    console.log('Starting image resize process');
    console.log('Original image URI:', uri);

    // 画像をリサイズ（最大サイズを1024x1024に制限）
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024, height: 1024 } }],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log('Image resized successfully');
    console.log('Resized image URI:', manipResult.uri);

    return manipResult.uri;
  } catch (error) {
    console.error('Error resizing image:', error);
    // リサイズに失敗した場合は元の画像を返す
    return uri;
  }
};

// 画像をSupabaseにアップロードする関数
export const uploadImage = async (uri: string, userId: string): Promise<string | null> => {
  try {
    console.log('Starting image upload process');
    console.log('User ID:', userId);

    // 画像をリサイズ
    console.log('Resizing image before upload');
    const resizedUri = await resizeImage(uri);
    console.log('Image resized successfully');

    // ファイル拡張子を取得
    const extension = getFileExtension(resizedUri);
    console.log('File extension:', extension);

    // ファイル名を生成（ユーザーIDとUUIDを含む）
    const uuid = generateUUID();
    const fileName = `${uuid}.${extension}`;
    const filePath = `${userId}/${fileName}`; // ユーザーIDでフォルダ分け
    console.log('Generated file path:', filePath);

    // ファイルの内容を取得
    const fileInfo = await FileSystem.getInfoAsync(resizedUri, { size: true });
    if (!fileInfo.exists) {
      console.error('File does not exist after resize');
      return null;
    }

    // ファイルサイズをチェック
    if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) { // 5MBに制限
      console.warn('Warning: File size is still large (> 5MB):', fileInfo.size);
    } else {
      console.log('File size is within limits:', fileInfo.size);
    }

    // コンテンツタイプを取得
    const contentType = getContentType(extension);
    console.log('Content type:', contentType);

    // 認証情報を取得
    const { data: session } = await auth.getSession();
    const accessToken = session?.session?.access_token || supabaseAnonKey;

    // Supabaseのアップロードエンドポイントを構築
    const uploadEndpoint = `${supabaseUrl}/storage/v1/object/${CLOTHING_BUCKET}/${filePath}`;
    console.log('Upload endpoint:', uploadEndpoint);

    // FileSystem.uploadAsyncを使用して直接アップロード
    try {
      console.log('Starting file upload to Supabase');
      const uploadResult = await FileSystem.uploadAsync(uploadEndpoint, resizedUri, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': contentType
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT
      });

      // 一時ファイルを削除
      await FileSystem.deleteAsync(resizedUri, { idempotent: true });
      console.log('Temporary file deleted');

      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        // アップロード成功
        console.log('Upload successful');
        return filePath;
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
export const deleteImage = async (imagePath: string): Promise<boolean> => {
  try {
    // 入力がURLの場合はパスを抽出
    let filePath = imagePath;
    if (imagePath.startsWith('http')) {
      try {
        const urlObj = new URL(imagePath);
        const pathParts = urlObj.pathname.split('/');
        filePath = pathParts.slice(pathParts.indexOf('object') + 1).join('/');
      } catch (parseError) {
        console.error('Error parsing URL:', parseError);
        return false;
      }
    }

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

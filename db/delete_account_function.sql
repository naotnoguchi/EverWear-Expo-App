-- アカウント削除関数
-- この関数は以下を実行します：
-- 1. ユーザーの画像ファイルパスを取得
-- 2. 関連するすべてのデータを削除（CASCADE）
-- 3. Supabase Authのユーザーを削除

CREATE OR REPLACE FUNCTION public.delete_user_account(
  user_id_param UUID
)
RETURNS TABLE (
  deleted_image_paths TEXT[],
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  image_paths TEXT[];
  auth_user_exists BOOLEAN;
BEGIN
  -- トランザクション開始
  
  -- 1. Authユーザーが存在するか確認
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE id = user_id_param
  ) INTO auth_user_exists;
  
  IF NOT auth_user_exists THEN
    RETURN QUERY 
    SELECT 
      ARRAY[]::TEXT[] as deleted_image_paths,
      FALSE as success,
      'ユーザーが見つかりません' as message;
    RETURN;
  END IF;
  
  -- 2. 削除する画像パスを収集
  SELECT ARRAY_AGG(image_path) 
  INTO image_paths
  FROM clothing_items 
  WHERE user_id = user_id_param 
    AND image_path IS NOT NULL 
    AND image_path != '';
  
  -- 3. clothing_items関連のデータを削除（wear_history, wash_historyはCASCADEで削除される）
  DELETE FROM clothing_items WHERE user_id = user_id_param;
  
  -- 4. user_badges を削除
  DELETE FROM user_badges WHERE user_id = user_id_param;
  
  -- 5. user_subscriptions を削除
  DELETE FROM user_subscriptions WHERE user_id = user_id_param;
  
  -- 6. users テーブルのレコードを削除
  DELETE FROM users WHERE id = user_id_param;
  
  -- 成功を返す
  RETURN QUERY 
  SELECT 
    COALESCE(image_paths, ARRAY[]::TEXT[]) as deleted_image_paths,
    TRUE as success,
    'アカウントが正常に削除されました' as message;
    
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生した場合はロールバック
    RAISE NOTICE 'Error deleting account: %', SQLERRM;
    RETURN QUERY 
    SELECT 
      ARRAY[]::TEXT[] as deleted_image_paths,
      FALSE as success,
      'アカウント削除中にエラーが発生しました: ' || SQLERRM as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数の実行権限を設定
-- セキュリティのため、PUBLICとanonからの権限を明示的に取り消し
REVOKE EXECUTE ON FUNCTION public.delete_user_account(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user_account(UUID) FROM anon;

-- authenticatedユーザーのみに実行権限を付与
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO authenticated;

-- RLSポリシー：ユーザーは自分のアカウントのみ削除可能
CREATE POLICY "Users can delete their own account" 
  ON auth.users 
  FOR DELETE 
  USING (auth.uid() = id); 
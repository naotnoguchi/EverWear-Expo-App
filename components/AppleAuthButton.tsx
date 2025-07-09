import React from 'react';
import { Platform, ViewStyle } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../contexts/ThemeContext';

interface AppleAuthButtonProps {
  onPress: () => void;
  text?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  buttonType?: AppleAuthentication.AppleAuthenticationButtonType;
}

export default function AppleAuthButton({
  onPress,
  text,
  disabled = false,
  loading = false,
  style,
  buttonType = AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN,
}: AppleAuthButtonProps) {
  const theme = useTheme();

  // iOS以外では何も表示しない
  if (Platform.OS !== 'ios') {
    return null;
  }

  // ダークモード対応のボタンスタイル（テーマに応じて動的に変更）
  const buttonStyle = theme.background === '#000000' 
    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={buttonType}
      buttonStyle={buttonStyle}
      cornerRadius={8}
      style={[
        {
          height: 50,
          width: '100%',
          marginBottom: 15,
        },
        style,
        disabled && { opacity: 0.6 },
      ]}
      onPress={disabled || loading ? undefined : onPress}
    />
  );
}

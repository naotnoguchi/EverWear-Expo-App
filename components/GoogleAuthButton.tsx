import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface GoogleAuthButtonProps {
  onPress: () => void;
  text?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export default function GoogleAuthButton({
  onPress,
  text = 'Googleでログイン',
  disabled = false,
  loading = false,
  style,
}: GoogleAuthButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <>
          <Image
            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
            style={styles.logo}
          />
          <Text style={styles.text}>{text}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#dadce0',
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  logo: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5F6368',
  },
  disabled: {
    opacity: 0.6,
  },
}); 
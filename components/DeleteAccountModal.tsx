import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../lib/authClient';
import GoogleAuthButton from './GoogleAuthButton';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onAccountDeleted: () => void;
}

export default function DeleteAccountModal({
  visible,
  onClose,
  onAccountDeleted,
}: DeleteAccountModalProps) {
  const theme = useTheme();
  const { user, deleteAccount, getAuthProvider, signInWithGoogle, signInWithApple } = useAuth();

  const [step, setStep] = useState<'warning' | 'auth' | 'final'>('warning');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  const authProvider = getAuthProvider();

  const handleClose = () => {
    setStep('warning');
    setPassword('');
    setAuthError('');
    onClose();
  };

  const handleWarningContinue = () => {
    setStep('auth');
    setAuthError('');
  };

  const handlePasswordAuth = async () => {
    if (!password || !user?.email) return;

    setIsAuthenticating(true);
    setAuthError('');

    try {
      // パスワードで再認証
      const { error } = await auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        setAuthError('パスワードが正しくありません');
        return;
      }

      // 認証成功、最終確認へ
      setStep('final');
    } catch (error) {
      setAuthError('認証に失敗しました');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsAuthenticating(true);
    setAuthError('');

    try {
      await signInWithGoogle();
      // Google認証成功後、最終確認へ
      setStep('final');
    } catch (error) {
      setAuthError('Google認証に失敗しました');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAppleAuth = async () => {
    setIsAuthenticating(true);
    setAuthError('');

    try {
      await signInWithApple();
      // Apple認証成功後、最終確認へ
      setStep('final');
    } catch (error: any) {
      // ユーザーキャンセルは無視（複数のパターンをチェック）
      const isUserCanceled = 
        error.code === 'ERR_CANCELED' || 
        error.message?.includes('user canceled') ||
        error.message?.includes('The user canceled');

      if (!isUserCanceled) {
        setAuthError('Apple認証に失敗しました');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);

    try {
      await deleteAccount();

      Alert.alert(
        'アカウント削除完了',
        'アカウントが正常に削除されました。',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onAccountDeleted();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'エラー',
        error.message || 'アカウント削除中にエラーが発生しました。',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderWarningStep = () => (
    <View style={styles.contentContainer}>
      <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
        <Ionicons name="warning-outline" size={48} color={theme.error} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>
        アカウントを削除しますか？
      </Text>

      <Text style={[styles.warningText, { color: theme.textSecondary }]}>
        アカウントを削除すると、以下のデータがすべて完全に削除されます：
      </Text>

      <View style={styles.dataList}>
        <Text style={[styles.dataItem, { color: theme.textSecondary }]}>
          • すべての衣類データ
        </Text>
        <Text style={[styles.dataItem, { color: theme.textSecondary }]}>
          • 着用履歴と洗濯履歴
        </Text>
        <Text style={[styles.dataItem, { color: theme.textSecondary }]}>
          • 獲得したバッジ
        </Text>
        <Text style={[styles.dataItem, { color: theme.textSecondary }]}>
          • アップロードした画像
        </Text>
        <Text style={[styles.dataItem, { color: theme.textSecondary }]}>
          • サブスクリプション情報
        </Text>
      </View>

      <Text style={[styles.warningNote, { color: theme.error }]}>
        ⚠️ この操作は取り消すことができません
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
          onPress={handleClose}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            キャンセル
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton, { backgroundColor: theme.error }]}
          onPress={handleWarningContinue}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            削除を続行
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAuthStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        本人確認
      </Text>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        アカウントを削除するには、再度認証が必要です
      </Text>

      {authProvider === 'email' && (
        <View style={styles.authContainer}>
          <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="パスワードを入力"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isAuthenticating}
            />
          </View>

          {authError ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {authError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.authButton,
              { backgroundColor: theme.primary },
              (!password || isAuthenticating) && styles.disabledButton
            ]}
            onPress={handlePasswordAuth}
            disabled={!password || isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                確認
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {authProvider === 'google' && (
        <View style={styles.authContainer}>
          <GoogleAuthButton
            onPress={handleGoogleAuth}
            disabled={isAuthenticating}
            loading={isAuthenticating}
            text="Googleで再認証"
          />
          {authError ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {authError}
            </Text>
          ) : null}
        </View>
      )}

      {authProvider === 'apple' && (
        <View style={styles.authContainer}>
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton, { backgroundColor: theme.text }]}
            onPress={handleAppleAuth}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={24} color={theme.background} />
                <Text style={[styles.socialButtonText, { color: theme.background }]}>
                  Apple IDで再認証
                </Text>
              </>
            )}
          </TouchableOpacity>

          {authError ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {authError}
            </Text>
          ) : null}
        </View>
      )}

      <TouchableOpacity
        style={[styles.textButton]}
        onPress={handleClose}
      >
        <Text style={[styles.textButtonText, { color: theme.primary }]}>
          キャンセル
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  const renderFinalStep = () => (
    <View style={styles.contentContainer}>
      <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>
        最終確認
      </Text>

      <Text style={[styles.finalWarningText, { color: theme.text }]}>
        本当にアカウントを削除しますか？
      </Text>

      <Text style={[styles.finalWarningSubtext, { color: theme.textSecondary }]}>
        この操作は取り消すことができません。
        すべてのデータが完全に削除されます。
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
          onPress={handleClose}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            キャンセル
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton, { backgroundColor: theme.error }]}
          onPress={handleDeleteAccount}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
              削除する
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {step === 'warning' && renderWarningStep()}
          {step === 'auth' && renderAuthStep()}
          {step === 'final' && renderFinalStep()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  contentContainer: {
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  dataList: {
    marginBottom: 16,
  },
  dataItem: {
    fontSize: 14,
    lineHeight: 24,
    marginLeft: 8,
  },
  warningNote: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  authContainer: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    letterSpacing: 0,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  authButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  appleButton: {
    borderWidth: 0,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  finalWarningText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  finalWarningSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  dangerButton: {
    // backgroundColor set inline
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  textButtonText: {
    fontSize: 14,
    marginBottom: 10,
  },
}); 

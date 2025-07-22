import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getPrivacyUrl, getTermsUrl } from '../../lib/i18n';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const theme = useTheme();
  const { t } = useTranslation();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('signup.alert.emptyFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('signup.alert.passwordMismatch'));
      return;
    }

    try {
      setIsLoading(true);
      await signUp(email, password);
      Alert.alert(
        t('signup.codeSentTitle'),
        t('signup.codeSentMessage'),
        [{ text: t('common.ok'), onPress: () => router.replace({ pathname: '/auth/verify', params: { email, type: 'signup' } }) }]
      );
    } catch (error: any) {
      Alert.alert(t('signup.registerErrorTitle'), error.message || t('signup.registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.replace('/auth/login');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('signup.title')}</Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          placeholder={t('common.placeholder.email')}
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          placeholder={t('common.placeholder.password')}
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          placeholder={t('signup.placeholder.passwordConfirm')}
          placeholderTextColor={theme.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: '#ffffff' }]}>
            {isLoading ? t('common.loading.registering') : t('signup.button.create')}
          </Text>
        </TouchableOpacity>

        {/* 規約同意注釈 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ color: theme.textSecondary }}>{t('signup.agreement.prefix')}</Text>
          <Text
            style={{ color: theme.primary, textDecorationLine: 'underline' }}
            onPress={() => router.push({ pathname: '/webview', params: { url: getTermsUrl(), title: t('signup.agreement.terms') } })}
          >
            {t('signup.agreement.terms')}
          </Text>
          <Text style={{ color: theme.textSecondary }}>{t('common.and')}</Text>
          <Text
            style={{ color: theme.primary, textDecorationLine: 'underline' }}
            onPress={() => router.push({ pathname: '/webview', params: { url: getPrivacyUrl(), title: t('signup.agreement.privacy') } })}
          >
            {t('signup.agreement.privacy')}
          </Text>
          <Text style={{ color: theme.textSecondary }}>{t('signup.agreement.suffix')}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            {t('signup.footer.already')}
          </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>
              {t('signup.footer.login')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    letterSpacing: 0,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    marginRight: 5,
  },
  footerLink: {
    fontWeight: '600',
  },
});

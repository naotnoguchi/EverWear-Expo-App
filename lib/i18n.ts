import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import ja from '../locales/ja.json';

const deviceLocale = Localization.getLocales()[0]?.languageTag || 'en';
const language = deviceLocale.startsWith('ja') ? 'ja' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    lng: language,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// 利用規約とプライバシーポリシーのURLを言語に応じて返すユーティリティ関数
export const getTermsUrl = () => {
  return i18n.language === 'ja' 
    ? 'https://everwearapp.com/terms.html'
    : 'https://everwearapp.com/en/terms.html';
};

export const getPrivacyUrl = () => {
  return i18n.language === 'ja'
    ? 'https://everwearapp.com/privacy.html'
    : 'https://everwearapp.com/en/privacy.html';
};

// お問い合わせURLを言語に応じて返すユーティリティ関数
export const getContactUrl = () => {
  return i18n.language === 'ja'
    ? 'https://forms.gle/wUCJnuHMkazHNF7B7'
    : 'https://forms.gle/BCYd7ZopyrZULPJz5';
};

export default i18n; 
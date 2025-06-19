import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

// Placeholder component for images
const PlaceholderImage = ({ iconName, color }: { iconName: keyof typeof Ionicons.glyphMap, color: string }) => {
  const theme = useTheme();
  return (
    <View style={{
      width: width * 0.8,
      height: height * 0.3,
      backgroundColor: theme.card,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    }}>
      <Ionicons name={iconName} size={80} color={color} />
    </View>
  );
};

// Onboarding steps data
const onboardingSteps = [
  {
    id: '1',
    title: 'お気に入りを、一生ものに',
    description: [
      '適切な洗濯頻度で衣類のの寿命を延ばす',
      'お財布にも環境にもやさしい衣類管理',
      'データで効果を実感できる'
    ],
    iconName: 'shirt' as keyof typeof Ionicons.glyphMap,
    iconColor: '#3498db',
    buttonText: '次へ',
    footer: 'データは安全に管理されます',
    isBulletPoints: true,
  },
  {
    id: '2',
    title: '写真を撮って、簡単登録',
    description: [
      'お気に入りのアイテムをスマホで撮影',
      '「何回着たら洗濯するか」を設定',
      'ブランドや購入価格、メモも残せる'
    ],
    iconName: 'camera' as keyof typeof Ionicons.glyphMap,
    iconColor: '#e74c3c',
    buttonText: '次へ',
    isBulletPoints: true,
  },
  {
    id: '3',
    title: '着用・洗濯をタップで記録',
    description: [
      '着るたびに1タップで記録完了',
      '洗濯するときも1タップ',
      '適切な洗濯タイミングがひと目でわかる'
    ],
    iconName: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
    iconColor: '#2ecc71',
    buttonText: '次へ',
    isBulletPoints: true,
  },
  {
    id: '4',
    title: '履歴でコーディネートを振り返り',
    description: [
      'カレンダー表示で過去の着用履歴を確認',
      'アイテムごとの使用状況もひと目でわかる',
      'コーディネートの振り返りに活用'
    ],
    iconName: 'calendar' as keyof typeof Ionicons.glyphMap,
    iconColor: '#f39c12',
    buttonText: '次へ',
    isBulletPoints: true,
  },
  {
    id: '5',
    title: 'データで可視化、効果を実感',
    description: [
      '洗濯効率や環境への影響、節約効果を可視化',
      'あなたのファッション傾向も分析',
      '衣類の寿命を延ばせるようにサポート'
    ],
    iconName: 'stats-chart' as keyof typeof Ionicons.glyphMap,
    iconColor: '#9b59b6',
    buttonText: '始める',
    footer: '衣類にも地球にも、お財布にもやさしいファッションライフを実現しましょう！',
    finalStep: true,
    isBulletPoints: true,
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { completeOnboarding } = useOnboarding();
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      paddingTop: Platform.OS === 'android' ? 40 : 16, // Add extra padding for Android status bar
    },
    skipButton: {
      padding: Platform.OS === 'android' ? 12 : 8, // Larger touch target for Android
      marginRight: Platform.OS === 'android' ? 8 : 0, // Add margin for Android
    },
    skipText: {
      color: '#3498db', // Keep blue for brand consistency
      fontSize: 16,
      fontWeight: '600',
    },
    slide: {
      width,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      paddingTop: Platform.OS === 'android' ? 30 : 20, // Add extra padding for Android
      paddingBottom: Platform.OS === 'android' ? 30 : 20, // Add extra padding for Android
    },
    imageContainer: {
      flex: 2,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    image: {
      width: width * 0.8,
      height: height * 0.3,
    },
    textContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: theme.text,
    },
    description: {
      fontSize: 16,
      textAlign: 'center',
      color: theme.text + "99", // with transparency
      marginBottom: 8,
      lineHeight: 24,
    },
    descriptionBullet: {
      fontSize: 16,
      textAlign: 'left',
      color: theme.text + "99", // with transparency
      marginBottom: 8,
      alignSelf: 'flex-start',
    },
    footer: {
      fontSize: 14,
      color: theme.text + "99", // less transparency for better readability
      marginTop: 20,
      textAlign: 'center',
      fontWeight: '500', // slightly bolder for emphasis
      lineHeight: 20, // better line spacing for readability
    },
    button: {
      backgroundColor: '#3498db', // Keep blue for brand consistency
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 30,
      marginTop: 30,
      marginBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    buttonText: {
      color: 'white', // Keep white for contrast on blue background
      fontSize: 18,
      fontWeight: '600',
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: Platform.OS === 'android' ? 40 : 30, // Add extra margin for Android
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: 5,
    },
  });

  const renderItem = ({ item, index }: { item: {
    id: string;
    title: string;
    description: string | string[];
    iconName: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    buttonText: string;
    footer?: string;
    finalStep?: boolean;
    isBulletPoints?: boolean;
  }, index: number }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.imageContainer}>
          <PlaceholderImage 
            iconName={item.iconName}
            color={item.iconColor}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>

          {Array.isArray(item.description) ? (
            item.description.map((desc, i) => (
              <Text key={i} style={item.isBulletPoints ? styles.descriptionBullet : styles.description}>
                {item.isBulletPoints ? '• ' : ''}{desc}
              </Text>
            ))
          ) : (
            <Text style={styles.description}>{item.description}</Text>
          )}

          {item.footer && (
            <Text style={styles.footer}>{item.footer}</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => {
            if (index === onboardingSteps.length - 1) {
              // Last step - complete onboarding
              completeOnboarding();
            } else {
              // Go to next step
              const nextIndex = index + 1;
              setCurrentIndex(nextIndex);
              flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            }
          }}
        >
          <Text style={styles.buttonText}>{item.buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentIndex ? '#3498db' : theme.border }
            ]}
          />
        ))}
      </View>
    );
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  // On Android, SafeAreaView might not work as expected for status bar
  // We're already adding extra padding in the styles
  return (
    <SafeAreaView style={[
      styles.container,
      // Add additional padding for Android status bar if needed
      Platform.OS === 'android' ? { paddingTop: 10 } : {}
    ]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleSkip} 
          style={styles.skipButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
        >
          <Text style={styles.skipText}>スキップ</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingSteps}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}
    </SafeAreaView>
  );
}

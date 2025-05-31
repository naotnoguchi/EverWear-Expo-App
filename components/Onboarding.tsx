import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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
    title: '大切な洋服を、もっと長持ち。',
    description: [
      '洗いすぎを防ぎ、生地の傷み・電気代・水のムダを減らしましょう。',
      '服にもお財布にも、そして環境にもやさしい管理をサポートします。'
    ],
    iconName: 'shirt' as keyof typeof Ionicons.glyphMap,
    iconColor: '#3498db',
    buttonText: 'さっそく始める',
    footer: 'データは安全に管理されます',
  },
  {
    id: '2',
    title: '登録は、写真を撮るだけ。',
    description: [
      '大切な洋服をスマホでパシャっと撮影。',
      '「○回着たら1回洗う」という洗濯ルールを簡単に設定。',
      '一覧でいつでも着用回数をチェックできます。'
    ],
    iconName: 'camera' as keyof typeof Ionicons.glyphMap,
    iconColor: '#e74c3c',
    buttonText: 'アイテムを登録する',
  },
  {
    id: '3',
    title: '着用したら、タップするだけ。',
    description: [
      '着るたびに1タップで記録完了。',
      '「あと何回着られるか」が一目でわかります。',
      '誤タップした場合も、あとから簡単に修正できます。'
    ],
    iconName: 'finger-print' as keyof typeof Ionicons.glyphMap,
    iconColor: '#2ecc71',
    buttonText: 'なるほど！',
  },
  {
    id: '4',
    title: '洗濯のタイミング、もう迷わない。',
    description: [
      '着用回数が設定した回数に達したら、自動で通知。',
      '忘れてしまっても、入力リマインダーが優しくお知らせします。',
      '通知はいつでもオン・オフできます。'
    ],
    iconName: 'notifications' as keyof typeof Ionicons.glyphMap,
    iconColor: '#f39c12',
    buttonText: '通知をオンにする',
  },
  {
    id: '5',
    title: 'アプリを開かず、すぐ記録。',
    description: [
      'ホーム画面やロック画面のウィジェットから、いつでも着用・洗濯の記録が可能。',
      'iPhone、Android両方に対応しています。'
    ],
    iconName: 'apps' as keyof typeof Ionicons.glyphMap,
    iconColor: '#9b59b6',
    buttonText: 'ウィジェットの設定方法を見る',
    finalStep: true,
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
      textAlign: 'left',
      color: theme.text + "99", // with transparency
      marginBottom: 8,
      alignSelf: 'flex-start',
    },
    footer: {
      fontSize: 14,
      color: theme.text + "77", // with more transparency
      marginTop: 20,
      textAlign: 'center',
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

  const renderItem = ({ item, index }: { item: typeof onboardingSteps[0], index: number }) => {
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

          {item.description.map((desc, i) => (
            <Text key={i} style={styles.description}>
              • {desc}
            </Text>
          ))}

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

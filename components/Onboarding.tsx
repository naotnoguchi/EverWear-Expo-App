import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const isSmallScreen = height < 700; // iPhone SE等の小さい画面を判定
  const isVerySmallScreen = height < 680; // iPhone SE 3等のより小さい画面を判定

  return (
    <View style={{
      width: width * (isVerySmallScreen ? 0.7 : 0.8), // より小さい画面では幅も縮小
      height: height * (isVerySmallScreen ? 0.2 : isSmallScreen ? 0.25 : 0.3), // 段階的にサイズ調整
      backgroundColor: theme.card,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    }}>
      <Ionicons name={iconName} size={isVerySmallScreen ? 50 : isSmallScreen ? 60 : 80} color={color} />
    </View>
  );
};

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { completeOnboarding } = useOnboarding();
  const theme = useTheme();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);
  const isSmallScreen = height < 700; // iPhone SE等の小さい画面を判定
  const isVerySmallScreen = height < 680; // iPhone SE 3等のより小さい画面を判定

  // Generate onboarding steps from translation data
  const onboardingSteps = [
    {
      id: '1',
      title: isVerySmallScreen 
        ? (t('onboarding.steps.1.titleShort', { defaultValue: t('onboarding.steps.1.title') }))
        : t('onboarding.steps.1.title'),
      description: t('onboarding.steps.1.description', { returnObjects: true }) as string[],
      iconName: 'shirt' as keyof typeof Ionicons.glyphMap,
      iconColor: '#3498db',
      buttonText: t('onboarding.next'),
      footer: t('onboarding.steps.1.footer'),
      isBulletPoints: true,
    },
    {
      id: '2',
      title: t('onboarding.steps.2.title'),
      description: t('onboarding.steps.2.description', { returnObjects: true }) as string[],
      iconName: 'camera' as keyof typeof Ionicons.glyphMap,
      iconColor: '#e74c3c',
      buttonText: t('onboarding.next'),
      isBulletPoints: true,
    },
    {
      id: '3',
      title: t('onboarding.steps.3.title'),
      description: t('onboarding.steps.3.description', { returnObjects: true }) as string[],
      iconName: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      iconColor: '#2ecc71',
      buttonText: t('onboarding.next'),
      isBulletPoints: true,
    },
    {
      id: '4',
      title: t('onboarding.steps.4.title'),
      description: t('onboarding.steps.4.description', { returnObjects: true }) as string[],
      iconName: 'calendar' as keyof typeof Ionicons.glyphMap,
      iconColor: '#f39c12',
      buttonText: t('onboarding.next'),
      isBulletPoints: true,
    },
    {
      id: '5',
      title: t('onboarding.steps.5.title'),
      description: t('onboarding.steps.5.description', { returnObjects: true }) as string[],
      iconName: 'stats-chart' as keyof typeof Ionicons.glyphMap,
      iconColor: '#9b59b6',
      buttonText: t('onboarding.start'),
      footer: t('onboarding.steps.5.footer'),
      finalStep: true,
      isBulletPoints: true,
    },
  ];

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
      justifyContent: 'space-between', // centerからspace-betweenに変更
      padding: isVerySmallScreen ? 15 : 20, // より小さい画面ではパディングを縮小
      paddingTop: Platform.OS === 'android' ? 30 : (isVerySmallScreen ? 15 : 20), // Add extra padding for Android
      paddingBottom: Platform.OS === 'android' ? 30 : (isVerySmallScreen ? 15 : 20), // Add extra padding for Android
    },
    imageContainer: {
      flex: isVerySmallScreen ? 1.2 : isSmallScreen ? 1.5 : 2, // より細かく調整
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      marginBottom: isVerySmallScreen ? 10 : 0, // 小さい画面では下マージンを追加
    },
    image: {
      width: width * 0.8,
      height: height * 0.3,
    },
    textContainer: {
      flex: isVerySmallScreen ? 1.8 : isSmallScreen ? 1.5 : 1, // より細かく調整
      alignItems: 'center',
      justifyContent: 'flex-start', // 上寄せに変更
      width: '100%',
      paddingHorizontal: isVerySmallScreen ? 15 : 20, // より小さい画面では横パディングを縮小
    },
    title: {
      fontSize: isVerySmallScreen ? 18 : isSmallScreen ? 20 : 24, // より細かく調整
      fontWeight: 'bold',
      marginBottom: isVerySmallScreen ? 10 : isSmallScreen ? 15 : 20, // より細かく調整
      textAlign: 'center',
      color: theme.text,
    },
    description: {
      fontSize: isVerySmallScreen ? 13 : isSmallScreen ? 14 : 16, // より細かく調整
      textAlign: 'center',
      color: theme.text + "99", // with transparency
      marginBottom: isVerySmallScreen ? 4 : 6, // より小さい画面では間隔を縮小
      lineHeight: isVerySmallScreen ? 18 : isSmallScreen ? 20 : 24, // より細かく調整
    },
    descriptionBullet: {
      fontSize: isVerySmallScreen ? 13 : isSmallScreen ? 14 : 16, // より細かく調整
      textAlign: 'left',
      color: theme.text + "99", // with transparency
      marginBottom: isVerySmallScreen ? 4 : 6, // より小さい画面では間隔を縮小
      alignSelf: 'flex-start',
      lineHeight: isVerySmallScreen ? 18 : isSmallScreen ? 20 : 24, // 行間も調整
    },
    footer: {
      fontSize: isVerySmallScreen ? 12 : 14, // より小さい画面では文字サイズを縮小
      color: theme.text + "99", // less transparency for better readability
      marginTop: isVerySmallScreen ? 10 : 20, // より小さい画面では上マージンを縮小
      textAlign: 'center',
      fontWeight: '500', // slightly bolder for emphasis
      lineHeight: isVerySmallScreen ? 16 : 20, // より細かく調整
    },
    button: {
      backgroundColor: '#3498db', // Keep blue for brand consistency
      paddingVertical: isVerySmallScreen ? 12 : 15, // より小さい画面では縦パディングを縮小
      paddingHorizontal: isVerySmallScreen ? 30 : 40, // より小さい画面では横パディングを縮小
      borderRadius: 30,
      marginTop: isVerySmallScreen ? 15 : 30, // より小さい画面では上マージンを縮小
      marginBottom: Platform.OS === 'ios' ? (isVerySmallScreen ? 20 : 40) : 20, // より小さい画面では下マージンを縮小
    },
    buttonText: {
      color: 'white', // Keep white for contrast on blue background
      fontSize: isVerySmallScreen ? 16 : 18, // より小さい画面では文字サイズを縮小
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
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
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

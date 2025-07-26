import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    FlatList,
    Platform,
    PixelRatio,
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
const PlaceholderImage = ({ iconName, color, isSmallScreen, isEnglish }: { 
  iconName: keyof typeof Ionicons.glyphMap, 
  color: string,
  isSmallScreen: boolean,
  isEnglish: boolean
}) => {
  const theme = useTheme();

  const getImageSize = () => {
    if (isSmallScreen) {
      return {
        width: width * 0.8, // Japanese: increased from 0.7 to 0.75 (between small and large)
        height: height * 0.25, // Japanese: increased from 0.2 to 0.25 (between small and large)
        iconSize: 60, // Japanese: increased from 50 to 60 (between small and large)
      };
    } else {
      return {
        width: width * 0.8,
        height: height * 0.3,
        iconSize: isEnglish ? 70 : 80,
      };
    }
  };

  const imageSize = getImageSize();

  return (
    <View style={{
      width: imageSize.width,
      height: imageSize.height,
      backgroundColor: theme.card,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    }}>
      <Ionicons name={iconName} size={imageSize.iconSize} color={color} />
    </View>
  );
};

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { completeOnboarding } = useOnboarding();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const flatListRef = useRef<FlatList>(null);
  
  // Simplified screen size detection (2 levels instead of 3)
  const isSmallScreen = height < 750; // iPhone 13 Pro (844px) and smaller
  
  // Language detection
  const isEnglish = i18n.language === 'en';
  
  // Device font scale detection
  const fontScale = PixelRatio.getFontScale();
  const isLargeFontScale = fontScale > 1.2;

  // Helper functions for dynamic layout
  const getFlexRatios = () => {
    if (isSmallScreen) {
      return {
        imageContainer: 1.5,
        textContainer: isEnglish ? 2.0 : 1.5,
      };
    } else {
      return {
        imageContainer: 1.5,
        textContainer: 1.5,
      };
    }
  };

  const getFontSizes = () => {
    if (isSmallScreen) {
      return {
        title: isEnglish ? 18 : 20,
        description: isEnglish ? 13 : 14,
        footer: isEnglish ? 11 : 12,
      };
    } else {
      return {
        title: isEnglish ? 22 : 24,
        description: isEnglish ? 15 : 16,
        footer: isEnglish ? 13 : 14,
      };
    }
  };

  const getSpacing = () => {
    if (isSmallScreen) {
      return {
        titleMarginBottom: isEnglish ? 8 : 5, // Japanese: 2/3 of current spacing (8 * 2/3 ≈ 5)
        descriptionMarginBottom: 8,
        footerMarginTop: isEnglish ? 8 : 10,
        buttonMarginTop: isEnglish ? 10 : 15,
      };
    } else {
      return {
        titleMarginBottom: isEnglish ? 12 : 8, // Japanese: 2/3 of current spacing (12 * 2/3 = 8)
        descriptionMarginBottom: isEnglish ? 5 : 6,
        footerMarginTop: isEnglish ? 15 : 20,
        buttonMarginTop: isEnglish ? 20 : 30,
      };
    }
  };

  const getAdjustedFontSize = (baseSize: number) => {
    let adjustedSize = baseSize;
    // Adjust for large font scale settings
    if (isLargeFontScale) {
      adjustedSize *= 0.9;
    }
    return adjustedSize;
  };

  const flexRatios = getFlexRatios();
  const fontSizes = getFontSizes();
  const spacing = getSpacing();

  // Generate onboarding steps from translation data
  const onboardingSteps = [
    {
      id: '1',
      title: t('onboarding.steps.1.title'),
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
      justifyContent: 'space-between',
      padding: isSmallScreen ? 15 : 20,
      paddingTop: Platform.OS === 'android' ? 30 : (isSmallScreen ? 10 : 20),
      paddingBottom: Platform.OS === 'android' ? 20 : (isSmallScreen ? 10 : 20),
    },
    imageContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      minHeight: isSmallScreen ? 80 : 120, // Ensure minimum height
    },
    image: {
      width: width * 0.8,
      height: height * 0.3,
    },
    textContainer: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '100%',
      paddingHorizontal: isSmallScreen ? 10 : 15,
      maxHeight: isSmallScreen ? height * 0.5 : height * 0.4, // Limit maximum height
    },
    title: {
      fontSize: getAdjustedFontSize(fontSizes.title),
      fontWeight: 'bold',
      textAlign: 'center',
      color: theme.text,
      lineHeight: getAdjustedFontSize(fontSizes.title) * 1.2,
    },
    description: {
      fontSize: getAdjustedFontSize(fontSizes.description),
      textAlign: isEnglish ? 'left' : 'center', // English is left-aligned for better readability
      color: theme.text + "99",
      lineHeight: getAdjustedFontSize(fontSizes.description) * 1.4,
    },
    descriptionBullet: {
      fontSize: getAdjustedFontSize(fontSizes.description),
      textAlign: 'left',
      color: theme.text + "99",
      alignSelf: 'flex-start',
      lineHeight: getAdjustedFontSize(fontSizes.description) * 1.4,
    },
    footer: {
      fontSize: getAdjustedFontSize(fontSizes.footer),
      color: theme.text + "99",
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: getAdjustedFontSize(fontSizes.footer) * 1.3,
    },
    button: {
      backgroundColor: '#3498db',
      paddingVertical: isSmallScreen ? 12 : 15,
      paddingHorizontal: isSmallScreen ? 30 : 40,
      borderRadius: 30,
      marginBottom: 20,
    },
    buttonText: {
      color: 'white',
      fontSize: getAdjustedFontSize(isSmallScreen ? 16 : 18),
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
        <View style={[styles.imageContainer, { flex: flexRatios.imageContainer }]}>
          <PlaceholderImage 
            iconName={item.iconName}
            color={item.iconColor}
            isSmallScreen={isSmallScreen}
            isEnglish={isEnglish}
          />
        </View>

        <View style={[styles.textContainer, { flex: flexRatios.textContainer }]}>
          <Text style={[styles.title, { marginBottom: spacing.titleMarginBottom }]}>
            {item.title}
          </Text>

          {Array.isArray(item.description) ? (
            item.description.map((desc, i) => (
              <Text 
                key={i} 
                style={[
                  item.isBulletPoints ? styles.descriptionBullet : styles.description,
                  { marginBottom: spacing.descriptionMarginBottom }
                ]}
              >
                {item.isBulletPoints ? '• ' : ''}{desc}
              </Text>
            ))
          ) : (
            <Text style={[styles.description, { marginBottom: spacing.descriptionMarginBottom }]}>
              {item.description}
            </Text>
          )}

          {item.footer && (
            <Text style={[styles.footer, { marginTop: spacing.footerMarginTop }]}>
              {item.footer}
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.button, { marginTop: spacing.buttonMarginTop }]}
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

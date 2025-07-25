import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface BadgeNotification {
  id: string;
  nameKey: string;
  descKey: string;
  iconName: string;
  color: string;
}

interface BadgeNotificationProps {
  notification: BadgeNotification;
  onDismiss: (badgeId: string) => void;
}

export function BadgeNotification({ notification, onDismiss }: BadgeNotificationProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // アニメーション開始
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 5秒後に自動で消す
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(notification.id);
    });
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 60,
      left: 16,
      right: 16,
      zIndex: 1000,
    },
    notification: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#f39c12',
    },
    iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#f39c12',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    description: {
      fontSize: 14,
      color: theme.text + '99',
      lineHeight: 18,
    },
    closeButton: {
      padding: 4,
      marginLeft: 8,
    },
    badge: {
      backgroundColor: '#f39c12',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginBottom: 8,
    },
    badgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.notification} onPress={handleDismiss}>
        <View style={styles.iconContainer}>
          <Ionicons name="trophy" size={24} color="white" />
        </View>
        
        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏆 新しいバッジ獲得！</Text>
          </View>
          <Text style={styles.title}>{t(notification.nameKey)}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {t(notification.descKey)}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <Ionicons name="close" size={20} color={theme.text + '66'} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface BadgeNotificationManagerProps {
  notifications: BadgeNotification[];
  onDismiss: (badgeId: string) => void;
}

export function BadgeNotificationManager({ notifications, onDismiss }: BadgeNotificationManagerProps) {
  return (
    <>
      {notifications.map((notification, index) => (
        <BadgeNotification
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </>
  );
}

 
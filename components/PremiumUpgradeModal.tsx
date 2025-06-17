import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  feature: string;
  description: string;
}

export function PremiumUpgradeModal({ 
  visible, 
  onClose, 
  feature, 
  description 
}: PremiumUpgradeModalProps) {
  const router = useRouter();
  const theme = useTheme();

  const handleUpgrade = () => {
    onClose();
    router.push('/subscription');
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      margin: 20,
      alignItems: 'center',
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    icon: {
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      color: theme.text + '99',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    upgradeButton: {
      backgroundColor: '#FFD700',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flex: 1,
    },
    upgradeButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      flex: 1,
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 16,
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.icon}>
            <Ionicons name="star" size={48} color="#FFD700" />
          </View>
          
          <Text style={styles.title}>{feature}</Text>
          <Text style={styles.description}>{description}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeButtonText}>プレミアムを見る</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
} 
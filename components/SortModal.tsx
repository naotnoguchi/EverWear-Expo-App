// components/SortModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClothing } from '../contexts/ClothingContext';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SortModal({ visible, onClose }: SortModalProps) {
  const { sortConfig, updateSortConfig } = useClothing();
  
  const sortOptions = [
    { id: 'name', label: '名前' },
    { id: 'category', label: 'カテゴリ' },
    { id: 'lastWorn', label: '最終着用日' },
    { id: 'wearCount', label: '着用回数' },
    { id: 'remainingWears', label: '残り着用回数' },
  ];
  
  const handleSort = (sortBy: string) => {
    // 同じソート項目を選択した場合は昇順/降順を切り替え
    const newDirection = 
      sortConfig.sortBy === sortBy && sortConfig.sortDirection === 'asc' ? 'desc' : 'asc';
    
    updateSortConfig({
      sortBy,
      sortDirection: newDirection
    });
    
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>並び替え</Text>
              
              {sortOptions.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.sortOption}
                  onPress={() => handleSort(option.id)}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortConfig.sortBy === option.id && styles.activeText
                  ]}>
                    {option.label}
                  </Text>
                  
                  {sortConfig.sortBy === option.id && (
                    <Ionicons
                      name={sortConfig.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                      size={18}
                      color="#3498db"
                    />
                  )}
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const SortOption = ({ option }: { option: { id: string; label: string } }) => {
  const { sortConfig } = useClothing();
  const isActive = sortConfig.sortBy === option.id;

  return (
    <TouchableOpacity
      style={[styles.sortOption, isActive && styles.activeSortOption]}
      onPress={() => handleSort(option.id)}
    >
      <Text style={[
        styles.sortOptionText,
        isActive && styles.activeText
      ]}>
        {option.label}
      </Text>

      {isActive && (
        <Ionicons
          name={sortConfig.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
          size={18}
          color="#3498db"
        />
      )}
    </TouchableOpacity>
  );
};

// スタイルを追加
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortOptionText: {
    fontSize: 16,
  },
  activeText: {
    color: '#3498db',
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // 既存のスタイル...
  activeSortOption: {
    backgroundColor: '#f0f8ff',
  },
});
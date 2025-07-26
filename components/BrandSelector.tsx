import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { useClothing } from "../contexts/ClothingContext";
import { useTheme } from "../contexts/ThemeContext";

interface BrandSelectorProps {
  value: string;
  onValueChange: (brand: string) => void;
}

export default function BrandSelector({ value, onValueChange }: BrandSelectorProps) {
  const { brands, getBrandSuggestions } = useClothing();
  const theme = useTheme();
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const listOpacity = useRef(new Animated.Value(0)).current;

  // 検索テキストが変更されたときに候補を更新
  useEffect(() => {
    if (searchText) {
      const brandSuggestions = getBrandSuggestions(searchText);
      setSuggestions(brandSuggestions);
    } else {
      setSuggestions(brands.slice(0, 10)); // 入力がない場合は人気ブランドを表示
    }
  }, [searchText, brands]);

  // value propが変更されたときに選択されたブランドを更新
  useEffect(() => {
    setSelectedBrand(value);
  }, [value]);

  // サジェストリストの表示/非表示をアニメーション付きで切り替え
  useEffect(() => {
    Animated.timing(listOpacity, {
      toValue: showSuggestions ? 1 : 0,
      duration: 200,
      useNativeDriver: true
    }).start();
  }, [showSuggestions, listOpacity]);

  // ブランド名が有効かどうかをチェック
  const isValidBrand = (brand: string): boolean => {
    return brands.includes(brand);
  };

  // ブランドを選択
  const handleSelectBrand = (brand: string) => {
    setSelectedBrand(brand);
    onValueChange(brand);
    setSearchText("");
    setError(null);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // 検索フィールドをクリア
  const handleClearSearch = () => {
    setSearchText("");
    inputRef.current?.focus();
  };

  // 検索フィールドをフォーカス / トグル
  const handleFocusSearch = () => {
    if (showSuggestions) {
      // 既に表示されている場合は閉じる
      handleCloseSuggestions();
    } else {
      // 表示されていない場合は開く
      setShowSuggestions(true);
      inputRef.current?.focus();
    }
  };

  // 候補リストを閉じる
  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // ブランドをクリア
  const handleClearBrand = () => {
    setSelectedBrand("");
    onValueChange("");
    setError(null);
  };

  // Define styles with theme colors
  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      width: '100%',
    },
    // 選択されたブランドを表示するコンテナ
    selectedBrandContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.card,
      marginBottom: showSuggestions ? 8 : 0,
    },
    selectedBrandText: {
      flex: 1,
      fontSize: 16,
      color: selectedBrand ? theme.text : theme.text + "77",
      paddingVertical: 4,
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    // 検索入力フィールドのコンテナ
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.card,
      marginBottom: 8,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: theme.text,
    },
    clearButton: {
      padding: 4,
      borderRadius: 12,
    },
    // サジェストリストのコンテナ
    suggestionsContainer: {
      backgroundColor: theme.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      maxHeight: 250,
      zIndex: 1000,
      elevation: 5,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      overflow: 'hidden',
    },
    closeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      padding: 4,
      zIndex: 1001,
    },
    // サジェストアイテム
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    selectedSuggestionItem: {
      backgroundColor: theme.border + "33", // 薄い背景色
    },
    suggestionText: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
    },
    selectedCheckmark: {
      marginLeft: 8,
      color: '#3498db',
    },
    // 閉じるオプション
    closeOption: {
      padding: 12,
      alignItems: 'center',
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    closeOptionText: {
      fontSize: 14,
      color: theme.text + "99",
    },
    // エラー表示
    inputError: {
      borderColor: 'red',
    },
    errorText: {
      color: 'red',
      fontSize: 12,
      marginTop: 4,
      marginBottom: 8,
      marginLeft: 4,
    },
    // 検索結果なしの表示
    noResultsContainer: {
      padding: 16,
      alignItems: 'center',
    },
    noResultsText: {
      fontSize: 14,
      color: theme.text + "99",
      textAlign: 'center',
    },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* 選択されたブランドを表示 */}
        <TouchableOpacity 
          style={styles.selectedBrandContainer}
          onPress={handleFocusSearch}
          activeOpacity={0.7}
        >
          <Ionicons name="pricetag-outline" size={20} color={theme.text + "99"} style={styles.searchIcon} />
          <Text style={styles.selectedBrandText}>
            {selectedBrand || t('brandSelector.placeholder')}
          </Text>
          <View style={styles.rightActions}>
            {selectedBrand && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearBrand}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color={theme.text + "99"} />
              </TouchableOpacity>
            )}
            <Ionicons 
              name={showSuggestions ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={theme.text + "99"} 
            />
          </View>
        </TouchableOpacity>

        {/* エラーメッセージ */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* 検索と候補リスト */}
        <Animated.View style={{ opacity: listOpacity, display: showSuggestions ? 'flex' : 'none' }}>
          {/* 検索フィールド */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.text + "99"} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t('brandSelector.searchPlaceholder')}
              placeholderTextColor={theme.text + "77"}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={20} color={theme.text + "99"} />
              </TouchableOpacity>
            )}
          </View>

          {/* 候補リスト */}
          <View style={styles.suggestionsContainer}>
            <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 250 }}>
              {suggestions.length > 0 ? (
                suggestions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.suggestionItem,
                      selectedBrand === item && styles.selectedSuggestionItem
                    ]}
                    onPress={() => handleSelectBrand(item)}
                  >
                    <Text style={styles.suggestionText}>{item}</Text>
                    {selectedBrand === item && (
                      <Ionicons name="checkmark" size={20} style={styles.selectedCheckmark} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    {t('brandSelector.noResults')}
                  </Text>
                </View>
              )}

              {/* 閉じるオプション */}
              <TouchableOpacity
                style={styles.closeOption}
                onPress={handleCloseSuggestions}
              >
                <Text style={styles.closeOptionText}>{t('brandSelector.close')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

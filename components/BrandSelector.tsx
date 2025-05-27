import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useClothing } from "../contexts/ClothingContext";
import { useTheme } from "../contexts/ThemeContext";

interface BrandSelectorProps {
  value: string;
  onValueChange: (brand: string) => void;
}

export default function BrandSelector({ value, onValueChange }: BrandSelectorProps) {
  const { brands, getBrandSuggestions, addBrand } = useClothing();
  const theme = useTheme();
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 入力値が変更されたときに候補を更新
  useEffect(() => {
    if (inputValue) {
      const brandSuggestions = getBrandSuggestions(inputValue);
      setSuggestions(brandSuggestions);
    } else {
      setSuggestions(brands.slice(0, 5)); // 入力がない場合は人気ブランドを表示
    }
  }, [inputValue, brands]);

  // ブランドを選択または追加
  const handleSelectBrand = (brand: string) => {
    setInputValue(brand);
    onValueChange(brand);
    setShowSuggestions(false);
  };

  // 新しいブランドを追加
  const handleAddNewBrand = () => {
    if (inputValue && !brands.includes(inputValue)) {
      addBrand(inputValue);
    }
    onValueChange(inputValue);
    setShowSuggestions(false);
  };

  // Define styles with theme colors
  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      width: '100%',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.card,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: theme.text,
    },
    suggestionsContainer: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      backgroundColor: theme.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      maxHeight: 200,
      zIndex: 1000,
      elevation: 5,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    suggestionText: {
      fontSize: 14,
      color: theme.text,
    },
    addNewBrandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.background,
    },
    addNewBrandText: {
      marginLeft: 8,
      fontSize: 14,
      color: '#3498db',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="pricetag-outline" size={20} color={theme.text + "99"} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text);
            setShowSuggestions(true);
          }}
          placeholder="例: ユニクロ"
          placeholderTextColor={theme.text + "77"}
          onFocus={() => setShowSuggestions(true)}
        />
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.suggestionItem}
                onPress={() => handleSelectBrand(item)}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}

            {inputValue && !brands.includes(inputValue) && (
              <TouchableOpacity
                style={styles.addNewBrandButton}
                onPress={handleAddNewBrand}
              >
                <Ionicons name="add-circle-outline" size={16} color="#3498db" />
                <Text style={styles.addNewBrandText}>「{inputValue}」を新しいブランドとして追加</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}


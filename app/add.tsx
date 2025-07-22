import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import BrandSelector from "../components/BrandSelector";
import { useClothing } from "../contexts/ClothingContext";
import { useTheme } from "../contexts/ThemeContext";
import { showImagePickerOptions } from "../lib/imageUtils";

export default function AddItem() {
  const router = useRouter();
  const { addItem, loadBrands } = useClothing();
  const theme = useTheme();
  const { t } = useTranslation();

  // カテゴリ定義を多言語化対応に
  const getCategories = () => [
    { id: "tops", nameKey: "addItem.categories.tops", icon: "shirt-outline" },
    { id: "bottoms", nameKey: "addItem.categories.bottoms", icon: "file-tray-outline" },
    { id: "jacket", nameKey: "addItem.categories.jacket", icon: "library-outline" },
    { id: "outerwear", nameKey: "addItem.categories.outerwear", icon: "hand-left-outline" },
    { id: "setup", nameKey: "addItem.categories.setup", icon: "layers-outline" },
    { id: "dress", nameKey: "addItem.categories.dress", icon: "woman-outline" },
    { id: "shoes", nameKey: "addItem.categories.shoes", icon: "footsteps-outline" },
    { id: "bag", nameKey: "addItem.categories.bag", icon: "bag-outline" },
    { id: "accessories", nameKey: "addItem.categories.accessories", icon: "glasses-outline" },
    { id: "others", nameKey: "addItem.categories.others", icon: "ellipsis-horizontal-circle-outline" },
  ];

  // ブランド情報を読み込む
  useEffect(() => {
    loadBrands();
  }, [loadBrands]);
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [brand, setBrand] = useState(""); // ブランド状態を追加
  const [washThreshold, setWashThreshold] = useState("3");
  const [imageSelected, setImageSelected] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [condition, setCondition] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // 触覚フィードバック
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 閉じるボタンのハンドラ
  const handleClose = () => {
    // 入力内容があれば確認ダイアログを表示
    if (name || selectedCategory !== "" || washThreshold !== "3" || imageSelected || memo || condition || purchasePrice) {
      Alert.alert(
        t('addItem.alerts.discardTitle'),
        t('addItem.alerts.discardMessage'),
        [
          { text: t('addItem.actions.cancel'), style: "cancel" },
          { 
            text: t('addItem.actions.discard'), 
            style: "destructive",
            onPress: () => {
              triggerHaptic();
              router.back();
            }
          }
        ]
      );
    } else {
      // 入力内容がなければそのまま閉じる
      triggerHaptic();
      router.back();
    }
  };

  const handleAddItem = async () => {
    // 入力検証
    if (!selectedCategory) {
      Alert.alert(t('common.error'), t('addItem.alerts.categoryRequired'));
      return;
    }

    if (!imageSelected) {
      Alert.alert(t('common.error'), t('addItem.alerts.imageRequired'));
      return;
    }

    const threshold = parseInt(washThreshold);
    if (isNaN(threshold) || threshold <= 0) {
      Alert.alert(t('common.error'), t('addItem.alerts.invalidWashThreshold'));
      return;
    }

    setIsLoading(true);
    setIsButtonPressed(true);

    try {
      const newItem = {
        name,
        category: selectedCategory as any, // TypeScript型の回避
        brand,
        image: selectedImageUri || "",
        washThreshold: threshold,
        lastWorn: "",
        lastWashed: "", // linterエラー修正: lastWashedプロパティを追加
        wearCount: 0,
        memo,
        condition,
        purchasePrice: purchasePrice ? parseInt(purchasePrice) : null,
        wearHistory: [],
        washHistory: [],
        createdAt: new Date().toISOString(),
      };

      await addItem(newItem, selectedImageUri ?? undefined);
      
      Alert.alert(
        t('addItem.alerts.addSuccess'),
        undefined,
        [
          {
            text: t('common.ok'),
            onPress: () => {
              triggerHaptic();
              router.back();
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error adding item:', err);
      Alert.alert(t('common.error'), t('addItem.alerts.addError'));
    } finally {
      setIsLoading(false);
      setIsButtonPressed(false);
    }
  };

  const handleSelectImage = async () => {
    try {
      const uri = await showImagePickerOptions(t);
      if (uri) {
        setSelectedImageUri(uri);
        setImageSelected(true);
        triggerHaptic();
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(t('common.error'), t('addItem.form.image.error'));
    }
  };

  const handleCategorySelect = (categoryKey: string) => {
    // 翻訳キーから実際のカテゴリ名を取得
    const categoryId = getCategories().find(cat => cat.nameKey === categoryKey)?.id || '';
    setSelectedCategory(categoryId);
    triggerHaptic();
  };

  const handleConditionSelect = (selectedCondition: string) => {
    setCondition(selectedCondition);
    triggerHaptic();
  };

  // Define styles with theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 16,
    },
    formContainer: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
    },
    imageSelector: {
      alignItems: "center",
      marginBottom: 24,
    },
    imagePlaceholder: {
      width: 200,
      height: 200,
      borderRadius: 16,
      backgroundColor: theme.card,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: "dashed",
    },
    blurContainer: {
      position: "absolute",
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(52, 152, 219, 0.4)",
    },
    imageText: {
      marginTop: 12,
      color: "#3498db",
      fontWeight: "500",
    },
    imageSelectedText: {
      marginTop: 12,
      color: "#fff",
      fontWeight: "600",
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.text,
    },
    requiredText: {
      fontSize: 14,
      fontWeight: "500",
      color: "#e74c3c",
    },
    optionalText: {
      fontSize: 14,
      fontWeight: "400",
      color: theme.text + "66",
    },
    sublabel: {
      fontSize: 14,
      color: theme.text + "99", // with transparency
      marginBottom: 12,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: theme.text,
    },
    categoryContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -4,
    },
    categoryButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      margin: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    categoryIcon: {
      marginRight: 6,
    },
    selectedCategory: {
      backgroundColor: "#3498db",
      borderColor: "#3498db",
    },
    categoryText: {
      color: theme.text + "99", // with transparency
      fontWeight: "500",
    },
    selectedCategoryText: {
      color: "#fff",
      fontWeight: "600",
    },
    thresholdContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    thresholdButton: {
      backgroundColor: theme.card,
      borderRadius: 12,
      width: 48,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    disabledButton: {
      backgroundColor: theme.background,
      borderColor: theme.border,
    },
    thresholdValueContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      minWidth: 120,
    },
    thresholdValue: {
      fontSize: 32,
      fontWeight: "bold",
      color: theme.text,
    },
    thresholdUnit: {
      fontSize: 20,
      fontWeight: "500",
      color: theme.text + "99", // with transparency
      marginLeft: 4,
    },
    addButton: {
      flexDirection: "row",
      backgroundColor: "#3498db",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
      shadowColor: "#3498db",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    addButtonPressed: {
      backgroundColor: "#2980b9", // ボタンが押されたときの色
      transform: [{ scale: 0.98 }], // ボタンが押されたときに少し縮小
    },
    addButtonDisabled: {
      backgroundColor: "#3498db99", // ボタンが無効のときの色
    },
    addButtonIcon: {
      marginRight: 8,
    },
    addButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    loadingIndicator: {
      marginRight: 8,
    },
  });

  return (
    <>
      {/* ヘッダータイトルの設定と閉じるボタンの追加 */}
      <Stack.Screen options={{ 
        headerTitleStyle: {
          fontWeight: "600",
          color: theme.text,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        ),
      }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* 画像選択エリア */}
            <View style={styles.imageSelector}>
              <TouchableOpacity
                style={styles.imagePlaceholder}
                onPress={handleSelectImage}
                activeOpacity={0.7}
              >
                {imageSelected ? (
                  <>
                    {selectedImageUri && (
                      <Image 
                        source={{ uri: selectedImageUri }} 
                        style={{ width: '100%', height: '100%', position: 'absolute' }} 
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.blurContainer}>
                      <Ionicons name="camera" size={40} color="#fff" />
                      <Text style={styles.imageSelectedText}>{t('addItem.form.image.selected')}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Ionicons name="camera" size={40} color="#3498db" />
                    <Text style={styles.imageText}>{t('addItem.form.image.placeholder')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* カテゴリ選択（必須） */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('addItem.form.category.label')} <Text style={styles.requiredText}>{t('addItem.form.required')}</Text></Text>
              <View style={styles.categoryContainer}>
                {getCategories().map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id && styles.selectedCategory,
                    ]}
                    onPress={() => handleCategorySelect(category.nameKey)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={category.icon as any} 
                      size={20} 
                      color={selectedCategory === category.id ? "#fff" : theme.text + "99"} 
                      style={styles.categoryIcon}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category.id && styles.selectedCategoryText,
                      ]}
                    >
                      {t(category.nameKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ブランド選択（任意） */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.label}>{t('addItem.form.brand.label')}</Text>
                <TouchableOpacity 
                  onPress={() => Alert.alert(t('addItem.form.brand.notFound'), t('addItem.form.brand.notFoundMessage'))}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  style={{ marginLeft: 4, marginTop: -6 }}>
                  <Ionicons name="help-circle-outline" size={18} color={theme.text + '99'} />
                </TouchableOpacity>
              </View>
              <BrandSelector
                value={brand}
                onValueChange={setBrand}
              />
            </View>

            {/* アイテム名入力（任意） */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('addItem.form.name.label')} <Text style={styles.optionalText}>{t('addItem.form.optional')}</Text></Text>
              <View style={styles.inputContainer}>
                <Ionicons name="text-outline" size={20} color={theme.text + "99"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('addItem.form.name.placeholder')}
                  placeholderTextColor={theme.text + "77"}
                />
              </View>
            </View>

            {/* 洗濯閾値設定 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('addItem.form.washThreshold.label')}</Text>
              <Text style={styles.sublabel}>{t('addItem.form.washThreshold.description')}</Text>

              <View style={styles.thresholdContainer}>
                <TouchableOpacity
                  style={[styles.thresholdButton, Number(washThreshold) <= 1 && styles.disabledButton]}
                  onPress={() => {
                    const currentValue = Number(washThreshold);
                    if (currentValue > 1) {
                      triggerHaptic();
                      setWashThreshold(String(currentValue - 1));
                    }
                  }}
                  disabled={Number(washThreshold) <= 1}
                >
                  <Ionicons name="remove" size={24} color={Number(washThreshold) <= 1 ? theme.text + "33" : "#3498db"} />
                </TouchableOpacity>

                <View style={styles.thresholdValueContainer}>
                  <Text style={styles.thresholdValue}>{washThreshold}</Text>
                  <Text style={styles.thresholdUnit}>{t('addItem.form.washThreshold.unit')}</Text>
                </View>

                <TouchableOpacity
                  style={styles.thresholdButton}
                  onPress={() => {
                    const currentValue = Number(washThreshold);
                    triggerHaptic();
                    setWashThreshold(String(currentValue + 1));
                  }}
                >
                  <Ionicons name="add" size={24} color="#3498db" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 状態選択 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('addItem.form.condition.label')}</Text>
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    condition === "新品" && styles.selectedCategory,
                  ]}
                  onPress={() => handleConditionSelect("新品")}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="star" 
                    size={20} 
                    color={condition === "新品" ? "#fff" : theme.text + "99"} 
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      condition === "新品" && styles.selectedCategoryText,
                    ]}
                  >
                    {t('addItem.form.condition.new')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    condition === "中古" && styles.selectedCategory,
                  ]}
                  onPress={() => handleConditionSelect("中古")}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="repeat" 
                    size={20} 
                    color={condition === "中古" ? "#fff" : theme.text + "99"} 
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      condition === "中古" && styles.selectedCategoryText,
                    ]}
                  >
                    {t('addItem.form.condition.used')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 購入価格入力 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('addItem.form.purchasePrice.label')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag-outline" size={20} color={theme.text + "99"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  placeholder={t('addItem.form.purchasePrice.placeholder')}
                  placeholderTextColor={theme.text + "77"}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* メモ入力 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('addItem.form.memo.label')}</Text>
              <View style={[styles.inputContainer, { height: 100 }]}>
                <Ionicons name="document-text-outline" size={20} color={theme.text + "99"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={memo}
                  onChangeText={setMemo}
                  placeholder={t('addItem.form.memo.placeholder')}
                  placeholderTextColor={theme.text + "77"}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* 追加ボタン */}
            <TouchableOpacity
              style={[
                styles.addButton,
                isLoading && styles.addButtonDisabled,
                isButtonPressed && styles.addButtonPressed
              ]}
              onPress={handleAddItem}
              activeOpacity={0.8}
              disabled={isLoading}
              pressRetentionOffset={{ top: 10, left: 10, bottom: 10, right: 10 }}
              onPressIn={() => {
                triggerHaptic();
                setIsButtonPressed(true);
              }}
              onPressOut={() => {
                setIsButtonPressed(false);
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" style={styles.loadingIndicator} />
              ) : (
                <Ionicons name="save-outline" size={20} color="#fff" style={styles.addButtonIcon} />
              )}
              <Text style={styles.addButtonText}>
                {isLoading ? t('addItem.actions.adding') : t('addItem.actions.add')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

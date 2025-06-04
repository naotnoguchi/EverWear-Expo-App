import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import BrandSelector from "../components/BrandSelector";
import { useClothing } from "../contexts/ClothingContext";
import { useTheme } from "../contexts/ThemeContext";
import { showImagePickerOptions } from "../lib/imageUtils";

// カテゴリ定義
const categories = [
  { id: "tops", name: "トップス", icon: "shirt-outline" },
  { id: "bottoms", name: "ボトムス", icon: "file-tray-outline" },
  { id: "outerwear", name: "アウター", icon: "hand-left-outline" },
  { id: "shoes", name: "シューズ", icon: "footsteps-outline" },
  { id: "accessories", name: "小物", icon: "glasses-outline" },
  { id: "others", name: "その他", icon: "ellipsis-horizontal-circle-outline" },
];

export default function AddItem() {
  const router = useRouter();
  const { addItem } = useClothing();
  const theme = useTheme();
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
        "編集内容の破棄",
        "入力した内容は保存されません。よろしいですか？",
        [
          { text: "キャンセル", style: "cancel" },
          { 
            text: "破棄", 
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
    if (!name.trim()) {
      Alert.alert("エラー", "アイテム名を入力してください");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("エラー", "カテゴリを選択してください");
      return;
    }

    if (!washThreshold || isNaN(Number(washThreshold)) || Number(washThreshold) <= 0) {
      Alert.alert("エラー", "有効な洗濯閾値を入力してください");
      return;
    }

    if (!imageSelected) {
      Alert.alert("エラー", "画像を選択してください");
      return;
    }

    // ブランド入力は必須ではない

    // 新しいアイテムオブジェクトを作成
    const newItem = {
      name: name,
      category: selectedCategory,
      brand: brand,
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=776&q=80", // ダミー画像URL
      washThreshold: Number(washThreshold),
      lastWorn: "",
      wearCount: 0,
      memo: memo,
      condition: condition,
      purchasePrice: purchasePrice ? Number(purchasePrice) : null,
      wearHistory: [],
      washHistory: []
    };

    try {
      // ローディング状態を開始
      setIsLoading(true);

      // アイテムをデータストアに追加
      await addItem(newItem, selectedImageUri);

      // 成功通知
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // ローディング状態を終了
      setIsLoading(false);

      Alert.alert(
        "成功",
        "新しいアイテムが追加されました",
        [
          {
            text: "OK",
            onPress: () => {
              // 追加後は画面を閉じる
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      // ローディング状態を終了
      setIsLoading(false);

      // エラー通知
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // エラーメッセージを表示
      const errorMessage = error instanceof Error ? error.message : "アイテムの追加に失敗しました";
      Alert.alert(
        "エラー", 
        errorMessage,
        [
          {
            text: "再試行",
            onPress: () => handleAddItem()
          },
          {
            text: "キャンセル",
            style: "cancel"
          }
        ]
      );
    }
  };

  const handleSelectImage = async () => {
    try {
      const uri = await showImagePickerOptions();
      if (uri) {
        setSelectedImageUri(uri);
        setImageSelected(true);
        triggerHaptic();
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert("エラー", "画像の選択中にエラーが発生しました");
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
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
                      <Text style={styles.imageSelectedText}>タップして画像を変更</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Ionicons name="camera" size={40} color="#3498db" />
                    <Text style={styles.imageText}>タップして画像を選択</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* アイテム名入力 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>アイテム名</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="text-outline" size={20} color={theme.text + "99"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="例: お気に入りの白シャツ"
                  placeholderTextColor={theme.text + "77"}
                />
              </View>
            </View>

            {/* カテゴリ選択 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>カテゴリ</Text>
              <View style={styles.categoryContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.name && styles.selectedCategory,
                    ]}
                    onPress={() => handleCategorySelect(category.name)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={category.icon as any} 
                      size={20} 
                      color={selectedCategory === category.name ? "#fff" : theme.text + "99"} 
                      style={styles.categoryIcon}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category.name && styles.selectedCategoryText,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ブランド選択 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ブランド</Text>
              <BrandSelector
                value={brand}
                onValueChange={setBrand}
              />
            </View>

            {/* 洗濯閾値設定 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>洗濯閾値</Text>
              <Text style={styles.sublabel}>何回着用したら洗濯するか設定します</Text>

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
                  <Text style={styles.thresholdUnit}>回</Text>
                </View>

                <TouchableOpacity
                  style={styles.thresholdButton}
                  onPress={() => {
                    triggerHaptic();
                    const currentValue = Number(washThreshold);
                    setWashThreshold(String(currentValue + 1));
                  }}
                >
                  <Ionicons name="add" size={24} color="#3498db" /* Keep blue for brand consistency */ />
                </TouchableOpacity>
              </View>
            </View>

            {/* 状態選択 (新品/中古) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>状態</Text>
              <Text style={styles.sublabel}>新品で購入したか中古で購入したかを選択します</Text>
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
                    新品
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
                    中古
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 購入価格入力 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>購入価格</Text>
              <Text style={styles.sublabel}>任意：アイテムの購入価格を入力します</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag-outline" size={20} color={theme.text + "99"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  placeholder="例: 5000"
                  placeholderTextColor={theme.text + "77"}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* メモ入力 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>メモ</Text>
              <Text style={styles.sublabel}>任意：アイテムに関するメモを入力します</Text>
              <View style={[styles.inputContainer, { height: 100 }]}>
                <Ionicons name="document-text-outline" size={20} color={theme.text + "99"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="例: お気に入りのシャツ。冬はインナーとして着用。"
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
              <Text style={styles.addButtonText}>アイテムを追加</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

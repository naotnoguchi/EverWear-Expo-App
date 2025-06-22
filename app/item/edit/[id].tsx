import BrandSelector from "@/components/BrandSelector";
import { useClothing } from "@/contexts/ClothingContext";
import { useTheme } from "@/contexts/ThemeContext";
import { clearSpecificImageCache } from "@/lib/cacheManager";
import { showImagePickerOptions } from "@/lib/imageUtils";
import { getImageUrl } from "@/lib/storageClient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// カテゴリ定義
const categories = [
  { id: "tops", name: "トップス", icon: "shirt-outline" },
  { id: "bottoms", name: "ボトムス", icon: "file-tray-outline" },
  { id: "jacket", name: "ジャケット", icon: "library-outline" },
  { id: "outerwear", name: "アウター", icon: "hand-left-outline" },
  { id: "setup", name: "セットアップ", icon: "layers-outline" },
  { id: "dress", name: "ワンピース", icon: "woman-outline" },
  { id: "shoes", name: "シューズ", icon: "footsteps-outline" },
  { id: "bag", name: "バッグ", icon: "bag-outline" },
  { id: "accessories", name: "小物", icon: "glasses-outline" },
  { id: "others", name: "その他", icon: "ellipsis-horizontal-circle-outline" },
];


export default function EditItem() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { clothingItems, updateItem, loadBrands } = useClothing();
  const theme = useTheme();
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [brand, setBrand] = useState(""); // ブランド状態を追加
  const [washThreshold, setWashThreshold] = useState("3");
  const [imageUrl, setImageUrl] = useState("");
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [imageSelected, setImageSelected] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [condition, setCondition] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // 初期値を保存するための状態
  const [initialValues, setInitialValues] = useState({
    name: "",
    category: "",
    brand: "",
    washThreshold: "",
    imageUrl: "",
    imageSelected: false,
    memo: "",
    condition: "",
    purchasePrice: ""
  });

  // ブランド情報を読み込む
  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // 初期データの読み込み
  useEffect(() => {
    // ClothingContextから実際のアイテムを取得
    const item = clothingItems.find(item => item.id === id);

    if (item) {
      // フォーム状態を設定
      setName(item.name);
      setSelectedCategory(item.category);
      setBrand(item.brand || ""); // ブランド情報を設定
      setWashThreshold(String(item.washThreshold));
      setImageUrl(item.image);
      setImageSelected(true);
      setMemo(item.memo || "");
      setCondition(item.condition || "");
      setPurchasePrice(item.purchasePrice ? String(item.purchasePrice) : "");

      // 初期値を保存
      setInitialValues({
        name: item.name,
        category: item.category,
        brand: item.brand || "",
        washThreshold: String(item.washThreshold),
        imageUrl: item.image,
        imageSelected: true,
        memo: item.memo || "",
        condition: item.condition || "",
        purchasePrice: item.purchasePrice ? String(item.purchasePrice) : ""
      });
    }
  }, [id, clothingItems]);

  // 画像URLを生成するためのuseEffect
  useEffect(() => {
    const loadSignedImageUrl = async () => {
      if (!imageUrl) return;

      // ローカルファイルの場合はスキップ
      if (imageUrl.startsWith('file://')) {
        return; // signedImageUrlは既にhandleSelectImageで設定済み
      }

      try {
        const url = await getImageUrl(imageUrl);
        setSignedImageUrl(url);
      } catch (error) {
        console.error(`Error generating signed URL:`, error);
        setSignedImageUrl(imageUrl); // Fallback to the original path/URL
      }
    };

    loadSignedImageUrl();
  }, [imageUrl]);

  // 触覚フィードバック
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 変更があるかどうかをチェック
  const hasChanges = () => {
    return (
      name !== initialValues.name ||
      selectedCategory !== initialValues.category ||
      brand !== initialValues.brand ||
      washThreshold !== initialValues.washThreshold ||
      imageUrl !== initialValues.imageUrl ||
      imageSelected !== initialValues.imageSelected ||
      memo !== initialValues.memo ||
      condition !== initialValues.condition ||
      purchasePrice !== initialValues.purchasePrice
    );
  };

  // 閉じるボタンのハンドラ
  const handleClose = () => {
    // 変更がある場合のみ確認ダイアログを表示
    if (hasChanges()) {
      Alert.alert(
        "編集内容の破棄",
        "変更した内容は保存されません。よろしいですか？",
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
      // 変更がない場合は直接戻る
      router.back();
    }
  };

  const handleUpdateItem = async () => {
    // 入力検証
    if (!selectedCategory) {
      Alert.alert("エラー", "カテゴリを選択してください");
      return;
    }

    if (!imageSelected) {
      Alert.alert("エラー", "画像を選択してください");
      return;
    }

    if (!washThreshold || isNaN(Number(washThreshold)) || Number(washThreshold) <= 0) {
      Alert.alert("エラー", "有効な洗濯閾値を入力してください");
      return;
    }

    // アイテム名とブランド入力は必須ではない

    // 現在のアイテムを取得
    const currentItem = clothingItems.find(item => item.id === id);

    if (!currentItem) {
      Alert.alert("エラー", "アイテムが見つかりません");
      return;
    }

    // 更新するアイテムデータを作成
    const updatedItem = {
      ...currentItem,
      name,
      category: selectedCategory,
      brand,
      washThreshold: Number(washThreshold),
      image: imageUrl,
      memo,
      condition,
      purchasePrice: purchasePrice ? Number(purchasePrice) : null
    };

    try {
      // ローディング状態を開始
      setIsLoading(true);

      // ClothingContextのupdateItem関数を呼び出してアイテムを更新
      await updateItem(updatedItem, selectedImageUri);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // ローディング状態を終了
      setIsLoading(false);

      Alert.alert(
        "成功",
        "アイテムが更新されました",
        [
          {
            text: "OK",
            onPress: () => {
              // 更新後は画面を閉じる
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
      const errorMessage = error instanceof Error ? error.message : "アイテムの更新に失敗しました";
      Alert.alert(
        "エラー", 
        errorMessage,
        [
          {
            text: "再試行",
            onPress: () => handleUpdateItem()
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
        // 古い画像のキャッシュをクリア
        if (imageUrl) {
          await clearSpecificImageCache(imageUrl);
        }
        
        setSelectedImageUri(uri);
        setImageUrl(uri); // 新しい画像のURIをimageUrlに設定
        setSignedImageUrl(uri); // プレビュー用にsignedImageUrlも設定
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
    selectedImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
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
      color: theme.text + "99", // with transparency
      fontSize: 14,
    },
    imageSelectedText: {
      marginTop: 12,
      color: "#fff",
      fontSize: 14,
      fontWeight: "500",
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
      paddingVertical: 12,
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
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginHorizontal: 4,
      marginBottom: 8,
    },
    selectedCategory: {
      backgroundColor: "#3498db",
      borderColor: "#3498db",
    },
    categoryIcon: {
      marginRight: 6,
    },
    categoryText: {
      fontSize: 14,
      color: theme.text + "99", // with transparency
    },
    selectedCategoryText: {
      color: "#fff",
      fontWeight: "500",
    },
    thresholdContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    thresholdButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.card,
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
      alignItems: "baseline",
      marginHorizontal: 20,
    },
    thresholdValue: {
      fontSize: 32,
      fontWeight: "600",
      color: theme.text,
    },
    thresholdUnit: {
      fontSize: 18,
      color: theme.text + "99", // with transparency
      marginLeft: 4,
    },
    addButton: {
      backgroundColor: "#3498db",
      borderRadius: 8,
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
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
      fontWeight: "600",
    },
    loadingIndicator: {
      marginRight: 8,
    },
  });

  return (
    <>
      {/* ヘッダータイトルの設定と閉じるボタンの追加 */}
      <Stack.Screen options={{ 
        title: "アイテム編集",
        headerTitleStyle: {
          fontWeight: "600",
          color: theme.text,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        // 戻るボタンを非表示にする
        headerBackVisible: false,
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
                    <Image 
                      source={{ 
                        uri: selectedImageUri || signedImageUrl || imageUrl,
                        cacheKey: selectedImageUri || imageUrl
                      }} 
                      style={styles.selectedImage} 
                      contentFit="cover"
        cachePolicy="disk"
                      transition={200}
                    />
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

            {/* カテゴリ選択（必須） */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>カテゴリ <Text style={styles.requiredText}>*必須</Text></Text>
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

            {/* ブランド選択（任意） */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ブランド <Text style={styles.optionalText}>（任意）</Text></Text>
              <BrandSelector
                value={brand}
                onValueChange={setBrand}
              />
            </View>

            {/* アイテム名入力（任意） */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>アイテム名 <Text style={styles.optionalText}>（任意）</Text></Text>
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

            {/* 更新ボタン */}
            <TouchableOpacity
              style={[
                styles.addButton,
                isLoading && styles.addButtonDisabled,
                isButtonPressed && styles.addButtonPressed
              ]}
              onPress={handleUpdateItem}
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
              <Text style={styles.addButtonText}>変更を保存</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

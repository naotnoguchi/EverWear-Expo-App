import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import BrandSelector from "@/components/BrandSelector";
import { useClothing } from "@/contexts/ClothingContext";

// カテゴリ定義
const categories = [
  { id: "tops", name: "トップス", icon: "shirt-outline" },
  { id: "bottoms", name: "ボトムス", icon: "file-tray-outline" },
  { id: "outerwear", name: "アウター", icon: "hand-left-outline" },
  { id: "shoes", name: "シューズ", icon: "footsteps-outline" },
  { id: "accessories", name: "小物", icon: "glasses-outline" },
  { id: "others", name: "その他", icon: "ellipsis-horizontal-circle-outline" },
];

// Dummy data for clothing items (same as in [id].tsx)
const dummyClothingItems = [
  {
    id: "1",
    name: "お気に入りの白シャツ",
    category: "トップス",
    brand: "ユニクロ",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=776&q=80",
    wearCount: 2,
    washThreshold: 3,
    lastWorn: "2023-10-15",
    wearHistory: ["2023-10-10", "2023-10-15"],
    washHistory: ["2023-10-05"],
  },
  {
    id: "2",
    name: "黒パンツ",
    category: "ボトムス",
    brand: "GU",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=387&q=80",
    wearCount: 3,
    washThreshold: 3,
    lastWorn: "2023-10-14",
    wearHistory: ["2023-10-08", "2023-10-12", "2023-10-14"],
    washHistory: ["2023-10-09"],
  },
  // ... other items
];

export default function EditItem() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addBrand } = useClothing();
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [brand, setBrand] = useState(""); // ブランド状態を追加
  const [washThreshold, setWashThreshold] = useState("3");
  const [imageUrl, setImageUrl] = useState("");
  const [imageSelected, setImageSelected] = useState(false);

  // 初期データの読み込み
  useEffect(() => {
    // 実際のアプリではAPIやデータベースから取得
    const item = dummyClothingItems.find(item => item.id === id);

    if (item) {
      setName(item.name);
      setSelectedCategory(item.category);
      setBrand(item.brand || ""); // ブランド情報を設定
      setWashThreshold(String(item.washThreshold));
      setImageUrl(item.image);
      setImageSelected(true);
    }
  }, [id]);

  // 触覚フィードバック
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 閉じるボタンのハンドラ
  const handleClose = () => {
    // 入力内容があれば確認ダイアログを表示
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
  };

  const handleUpdateItem = () => {
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

    // ブランド入力は必須ではないが、入力された場合はシステムに追加
    if (brand) {
      addBrand(brand); // 新しいブランドをシステムに追加
    }

    // 実際のアプリではここでストレージにアイテムを更新
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
  };

  const handleSelectImage = () => {
    // 実際のアプリでは画像ピッカーを開く
    setImageSelected(true);
    triggerHaptic();
    Alert.alert("画像選択", "画像が選択されました");
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    triggerHaptic();
  };

  return (
    <>
      {/* ヘッダータイトルの設定と閉じるボタンの追加 */}
      <Stack.Screen options={{ 
        title: "アイテム編集",
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#2c3e50" />
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
                      source={{ uri: imageUrl }} 
                      style={styles.selectedImage} 
                      resizeMode="cover"
                    />
                    <BlurView intensity={20} style={styles.blurContainer}>
                      <Ionicons name="camera" size={40} color="#fff" />
                      <Text style={styles.imageSelectedText}>タップして画像を変更</Text>
                    </BlurView>
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
                <Ionicons name="text-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="例: お気に入りの白シャツ"
                  placeholderTextColor="#95a5a6"
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
                      color={selectedCategory === category.name ? "#fff" : "#7f8c8d"} 
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
                  <Ionicons name="remove" size={24} color={Number(washThreshold) <= 1 ? "#bdc3c7" : "#3498db"} />
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
                  <Ionicons name="add" size={24} color="#3498db" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 更新ボタン */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleUpdateItem}
              activeOpacity={0.8}
            >
              <Ionicons name="save-outline" size={20} color="#fff" style={styles.addButtonIcon} />
              <Text style={styles.addButtonText}>変更を保存</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
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
    backgroundColor: "#f0f5f9",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e1e8ed",
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
  },
  imageText: {
    marginTop: 12,
    color: "#7f8c8d",
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
    color: "#2c3e50",
  },
  sublabel: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8f9fa",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2c3e50",
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e1e8ed",
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
    color: "#7f8c8d",
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
    backgroundColor: "#f0f5f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  disabledButton: {
    backgroundColor: "#f8f9fa",
    borderColor: "#f0f5f9",
  },
  thresholdValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginHorizontal: 20,
  },
  thresholdValue: {
    fontSize: 32,
    fontWeight: "600",
    color: "#2c3e50",
  },
  thresholdUnit: {
    fontSize: 18,
    color: "#7f8c8d",
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
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

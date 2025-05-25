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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

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
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [washThreshold, setWashThreshold] = useState("3");
  const [imageSelected, setImageSelected] = useState(false);
  
  // 触覚フィードバック
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 閉じるボタンのハンドラ
  const handleClose = () => {
    // 入力内容があれば確認ダイアログを表示
    if (name || selectedCategory !== "" || washThreshold !== "3" || imageSelected) {
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

  const handleAddItem = () => {
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

    // 実際のアプリではここでストレージにアイテムを保存
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
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
                  <BlurView intensity={20} style={styles.blurContainer}>
                    <Ionicons name="checkmark-circle" size={60} color="#fff" />
                    <Text style={styles.imageSelectedText}>画像選択済み</Text>
                  </BlurView>
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

            {/* 追加ボタン */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddItem}
              activeOpacity={0.8}
            >
              <Ionicons name="save-outline" size={20} color="#fff" style={styles.addButtonIcon} />
              <Text style={styles.addButtonText}>アイテムを追加</Text>
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
  blurContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(52, 152, 219, 0.6)",
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
    backgroundColor: "#f0f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
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
    backgroundColor: "#f0f5f9",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  categoryIcon: {
    marginRight: 6,
  },
  selectedCategory: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  categoryText: {
    color: "#7f8c8d",
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
    backgroundColor: "#f0f5f9",
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  disabledButton: {
    backgroundColor: "#f8f9fa",
    borderColor: "#ecf0f1",
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
    color: "#2c3e50",
  },
  thresholdUnit: {
    fontSize: 20,
    fontWeight: "500",
    color: "#7f8c8d",
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
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
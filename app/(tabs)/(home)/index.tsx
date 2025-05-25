// app/(tabs)/(home)/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import HomeTabView from "../../../components/HomeTabView";

export default function HomeScreen() {
  return (
      <GestureHandlerRootView style={styles.container}>
        <HomeTabView />
      </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
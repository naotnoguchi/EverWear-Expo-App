// app/(tabs)/(home)/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import HomeTabView from "../../../components/HomeTabView";
import {useTheme} from "@/contexts/ThemeContext";

export default function HomeScreen() {
    const theme = useTheme();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
    });

    return (
      <GestureHandlerRootView style={styles.container}>
        <HomeTabView />
      </GestureHandlerRootView>
  );
}
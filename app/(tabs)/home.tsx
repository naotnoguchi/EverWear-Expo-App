import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import HomeTabView, { HomeTabViewRefType } from "../../components/HomeTabView";
import { useTabReset } from "../../contexts/TabResetContext";

export default function HomeScreen() {
    const theme = useTheme();
    const homeTabViewRef = useRef<HomeTabViewRefType>(null);
    const { registerResetFunction } = useTabReset();

    // Register the reset function with the TabResetContext
    useEffect(() => {
        registerResetFunction("home", () => {
            if (homeTabViewRef.current) {
                homeTabViewRef.current.resetTab();
            }
        });
    }, [registerResetFunction]);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
    });

    return (
      <GestureHandlerRootView style={styles.container}>
        <HomeTabView ref={homeTabViewRef} />
      </GestureHandlerRootView>
  );
} 
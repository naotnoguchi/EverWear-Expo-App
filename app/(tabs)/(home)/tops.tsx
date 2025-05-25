// app/(tabs)/(home)/tops.tsx, bottoms.tsx, etc.
import React from "react";
import { Redirect } from "expo-router";

export default function CategoryRedirect() {
  // すべてのカテゴリページをメインのindex.tsxにリダイレクト
  return <Redirect href="/(tabs)/(home)" />;
}
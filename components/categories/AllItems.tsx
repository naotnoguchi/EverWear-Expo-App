import React from "react";
import { View, Text } from "react-native";
import ItemList from "../ItemList"; // 既存のアイテムリストコンポーネント

export default function AllItems() {
    return <ItemList category={null} />;
}

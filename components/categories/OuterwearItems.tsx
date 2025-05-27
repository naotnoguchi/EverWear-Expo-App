import React from "react";
import ItemList from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

export default function OuterwearItems() {
    return <ItemList category={getCategoryValueById(CategoryId.OUTERWEAR)} />;
}

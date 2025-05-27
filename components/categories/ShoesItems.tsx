import React from "react";
import ItemList from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

export default function ShoesItems() {
    return <ItemList category={getCategoryValueById(CategoryId.SHOES)} />;
}

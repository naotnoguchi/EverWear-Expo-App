import React from "react";
import ItemList from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

export default function AccessoriesItems() {
    return <ItemList category={getCategoryValueById(CategoryId.ACCESSORIES)} />;
}

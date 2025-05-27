import React from "react";
import ItemList from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

export default function OthersItems() {
    return <ItemList category={getCategoryValueById(CategoryId.OTHERS)} />;
}
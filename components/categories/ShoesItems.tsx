import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

const ShoesItems = forwardRef<ItemListRefType, {}>((props, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.SHOES)} />;
});

export default ShoesItems;

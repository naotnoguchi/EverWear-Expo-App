import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

const AccessoriesItems = forwardRef<ItemListRefType, {}>((props, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.ACCESSORIES)} />;
});

export default AccessoriesItems;

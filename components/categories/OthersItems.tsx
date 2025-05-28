import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

const OthersItems = forwardRef<ItemListRefType, {}>((props, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.OTHERS)} />;
});

export default OthersItems;

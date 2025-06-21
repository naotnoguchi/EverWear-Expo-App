import React, { forwardRef } from "react";
import { CategoryId, getCategoryValueById } from "../../types/categories";
import ItemList, { ItemListRefType } from "../ItemList";

interface JacketItemsProps {
  onRefresh?: () => void;
}

const JacketItems = forwardRef<ItemListRefType, JacketItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.JACKET)} onRefresh={onRefresh} />;
});

JacketItems.displayName = 'JacketItems';

export default JacketItems; 
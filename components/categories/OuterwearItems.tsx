import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

interface OuterwearItemsProps {
  onRefresh?: () => void;
}

const OuterwearItems = forwardRef<ItemListRefType, OuterwearItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.OUTERWEAR)} onRefresh={onRefresh} />;
});

OuterwearItems.displayName = 'OuterwearItems';

export default OuterwearItems;

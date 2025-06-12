import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

interface BottomsItemsProps {
  onRefresh?: () => void;
}

const BottomsItems = forwardRef<ItemListRefType, BottomsItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.BOTTOMS)} onRefresh={onRefresh} />;
});

BottomsItems.displayName = 'BottomsItems';

export default BottomsItems;

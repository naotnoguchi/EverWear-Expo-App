import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

interface ShoesItemsProps {
  onRefresh?: () => void;
}

const ShoesItems = forwardRef<ItemListRefType, ShoesItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.SHOES)} onRefresh={onRefresh} />;
});

ShoesItems.displayName = 'ShoesItems';

export default ShoesItems;

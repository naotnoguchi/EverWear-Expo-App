import React, { forwardRef } from "react";
import { CategoryId, getCategoryValueById } from "../../types/categories";
import ItemList, { ItemListRefType } from "../ItemList";

interface BagItemsProps {
  onRefresh?: () => void;
}

const BagItems = forwardRef<ItemListRefType, BagItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.BAG)} onRefresh={onRefresh} />;
});

BagItems.displayName = 'BagItems';

export default BagItems; 
import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface OuterwearItemsProps {
  onRefresh?: () => void;
}

const OuterwearItems = forwardRef<ItemListRefType, OuterwearItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category="outerwear" onRefresh={onRefresh} />;
});

OuterwearItems.displayName = 'OuterwearItems';

export default OuterwearItems;

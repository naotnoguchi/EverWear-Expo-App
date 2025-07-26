import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface BottomsItemsProps {
  onRefresh?: () => void;
}

const BottomsItems = forwardRef<ItemListRefType, BottomsItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category="bottoms" onRefresh={onRefresh} />;
});

BottomsItems.displayName = 'BottomsItems';

export default BottomsItems;

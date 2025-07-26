import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface ShoesItemsProps {
  onRefresh?: () => void;
}

const ShoesItems = forwardRef<ItemListRefType, ShoesItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category="shoes" onRefresh={onRefresh} />;
});

ShoesItems.displayName = 'ShoesItems';

export default ShoesItems;

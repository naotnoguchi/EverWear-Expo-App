import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface BagItemsProps {
  onRefresh?: () => void;
}

const BagItems = forwardRef<ItemListRefType, BagItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category="bag" onRefresh={onRefresh} />;
});

BagItems.displayName = 'BagItems';

export default BagItems; 
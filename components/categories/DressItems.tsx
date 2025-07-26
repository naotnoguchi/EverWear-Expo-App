import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface DressItemsProps {
  onRefresh?: () => void;
}

const DressItems = forwardRef<ItemListRefType, DressItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category="dress" onRefresh={onRefresh} />;
});

DressItems.displayName = 'DressItems';

export default DressItems; 
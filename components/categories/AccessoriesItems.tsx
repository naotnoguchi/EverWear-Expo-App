import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface AccessoriesItemsProps {
  onRefresh?: () => void;
}

const AccessoriesItems = forwardRef<ItemListRefType, AccessoriesItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category="accessories" onRefresh={onRefresh} />;
});

AccessoriesItems.displayName = 'AccessoriesItems';

export default AccessoriesItems;

import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface AllItemsProps {
  onRefresh?: () => void;
}

const AllItems = forwardRef<ItemListRefType, AllItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={null} onRefresh={onRefresh} />;
});

AllItems.displayName = 'AllItems';

export default AllItems;

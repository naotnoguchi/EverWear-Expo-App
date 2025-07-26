import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface JacketItemsProps {
  onRefresh?: () => void;
}

const JacketItems = forwardRef<ItemListRefType, JacketItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category="jacket" onRefresh={onRefresh} />;
});

JacketItems.displayName = 'JacketItems';

export default JacketItems; 
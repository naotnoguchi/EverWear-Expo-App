import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface TopsItemsProps {
  onRefresh?: () => void;
}

const TopsItems = forwardRef<ItemListRefType, TopsItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category="tops" onRefresh={onRefresh} />;
});

TopsItems.displayName = 'TopsItems';

export default TopsItems;

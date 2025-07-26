import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface SetupItemsProps {
  onRefresh?: () => void;
}

const SetupItems = forwardRef<ItemListRefType, SetupItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category="setup" onRefresh={onRefresh} />;
});

SetupItems.displayName = 'SetupItems';

export default SetupItems; 
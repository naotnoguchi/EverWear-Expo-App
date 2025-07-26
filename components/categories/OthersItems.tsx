import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";

interface OthersItemsProps {
  onRefresh?: () => void;
}

const OthersItems = forwardRef<ItemListRefType, OthersItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category="others" onRefresh={onRefresh} />;
});

OthersItems.displayName = 'OthersItems';

export default OthersItems;

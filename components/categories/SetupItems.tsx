import React, { forwardRef } from "react";
import { CategoryId, getCategoryValueById } from "../../types/categories";
import ItemList, { ItemListRefType } from "../ItemList";

interface SetupItemsProps {
  onRefresh?: () => void;
}

const SetupItems = forwardRef<ItemListRefType, SetupItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.SETUP)} onRefresh={onRefresh} />;
});

SetupItems.displayName = 'SetupItems';

export default SetupItems; 
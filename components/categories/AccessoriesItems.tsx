import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

interface AccessoriesItemsProps {
  onRefresh?: () => void;
}

const AccessoriesItems = forwardRef<ItemListRefType, AccessoriesItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.ACCESSORIES)} onRefresh={onRefresh} />;
});

AccessoriesItems.displayName = 'AccessoriesItems';

export default AccessoriesItems;

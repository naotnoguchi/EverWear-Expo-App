import React, { forwardRef } from "react";
import { CategoryId, getCategoryValueById } from "../../types/categories";
import ItemList, { ItemListRefType } from "../ItemList";

interface DressItemsProps {
  onRefresh?: () => void;
}

const DressItems = forwardRef<ItemListRefType, DressItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.DRESS)} onRefresh={onRefresh} />;
});

DressItems.displayName = 'DressItems';

export default DressItems; 
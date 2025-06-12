import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

interface TopsItemsProps {
  onRefresh?: () => void;
}

const TopsItems = forwardRef<ItemListRefType, TopsItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.TOPS)} onRefresh={onRefresh} />;
});

TopsItems.displayName = 'TopsItems';

export default TopsItems;

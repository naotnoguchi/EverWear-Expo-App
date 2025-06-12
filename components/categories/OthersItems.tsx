import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList";
import { getCategoryValueById, CategoryId } from "../../types/categories";

interface OthersItemsProps {
  onRefresh?: () => void;
}

const OthersItems = forwardRef<ItemListRefType, OthersItemsProps>(({ onRefresh }, ref) => {
    return <ItemList ref={ref} category={getCategoryValueById(CategoryId.OTHERS)} onRefresh={onRefresh} />;
});

OthersItems.displayName = 'OthersItems';

export default OthersItems;

import React, { forwardRef } from "react";
import ItemList, { ItemListRefType } from "../ItemList"; // 既存のアイテムリストコンポーネント

const AllItems = forwardRef<ItemListRefType, {}>((props, ref) => {
    return <ItemList ref={ref} category={null} />;
});

export default AllItems;

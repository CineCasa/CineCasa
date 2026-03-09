import { useMemo } from "react";
import ContentRow from "./ContentRow";
import { ContentItem } from "@/data/content";

interface DynamicCategoryRowProps {
  title: string;
  items: ContentItem[];
  filterFn: (item: ContentItem) => boolean;
  limit?: number;
}

const shuffleArray = (array: any[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const DynamicCategoryRow = ({ title, items, filterFn, limit = 5 }: DynamicCategoryRowProps) => {
  const dynamicItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    const filtered = items.filter(filterFn);
    // Shuffle the array on every mount to make it dynamic "every restart"
    const shuffled = shuffleArray(filtered);
    return shuffled.slice(0, limit);
  }, [items, filterFn, limit]);

  if (dynamicItems.length === 0) return null;

  return (
    <ContentRow 
      category={{ id: `dyn-${title.replace(/\s+/g, '-').toLowerCase()}`, title, items: dynamicItems }} 
    />
  );
};

export default DynamicCategoryRow;

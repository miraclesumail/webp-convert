import React from 'react';
import { ImageItem } from '../types';
import { ImageItemRow } from './ImageItemRow';

interface ImageListProps {
  items: ImageItem[];
  onRemove: (id: string) => void;
  onPreview: (item: ImageItem) => void;
}

export const ImageList: React.FC<ImageListProps> = ({ items, onRemove, onPreview }) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <ImageItemRow
          key={item.id}
          item={item}
          onRemove={onRemove}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
};

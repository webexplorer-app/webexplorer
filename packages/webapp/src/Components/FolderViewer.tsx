import { useMemo } from "react";
import "./FolderViewer.css";

export type FolderItem = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: bigint | number;
  [key: string]: any;
};

export interface FolderViewerProps {
  items: FolderItem[];
  onItemClick: (item: FolderItem) => void;
}

export function FolderViewer(props: FolderViewerProps) {
  const { items, onItemClick } = props;

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  const formatSize = (size?: bigint | number) => {
    if (!size) return "";
    const numSize = typeof size === "bigint" ? Number(size) : size;
    if (numSize < 1024) return `${numSize} B`;
    if (numSize < 1024 * 1024) return `${(numSize / 1024).toFixed(1)} KB`;
    if (numSize < 1024 * 1024 * 1024) return `${(numSize / (1024 * 1024)).toFixed(1)} MB`;
    return `${(numSize / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="folder-viewer">
      {sortedItems.length === 0 ? (
        <div className="folder-empty">
          Empty folder
        </div>
      ) : (
        <ul className="folder-list">
          {sortedItems.map((item) => (
            <li
              key={item.path}
              className="folder-list-item"
              onClick={() => onItemClick(item)}
            >
              <div className="folder-item-name">
                {item.type === "directory" ? "[DIR] " : ""}{item.name}
              </div>
              {item.type === "file" && item.size && (
                <div className="folder-item-details">{formatSize(item.size)}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FolderViewer;

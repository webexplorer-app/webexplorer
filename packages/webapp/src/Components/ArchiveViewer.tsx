import { useState, useMemo } from "react";
import { useArchiveWorker } from "../Hooks/useArchiveWorker";
import { useUnarchive } from "../Hooks/useUnarchive";
import { FileViewer } from "./FileViewer";
import { FolderViewer, type FolderItem } from "./FolderViewer";
import type { ArchiveEntry } from "../../../archive/dist/esm";
import "./ArchiveViewer.css";

type FileSystemItem = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: bigint;
  entry?: ArchiveEntry;
  children?: Map<string, FileSystemItem>;
};

export interface ArchiveViewerProps {
  file: File;
}

export function ArchiveViewer(props: ArchiveViewerProps) {
  const { file } = props;
  const [currentPath, setCurrentPath] = useState<string>("");
  const [viewMode, setViewMode] = useState<"folder" | "file">("folder");
  const [selectedFile, setSelectedFile] = useState<ArchiveEntry | null>(null);
  const [extractedFile, setExtractedFile] = useState<File | null>(null);

  const worker = useArchiveWorker();
  const [entries] = useUnarchive(worker, file, "");

  // Build file system tree
  const fileSystem = useMemo(() => {
    const root = new Map<string, FileSystemItem>();

    entries.forEach((entry) => {
      const path = entry.path;
      const parts = path.split("/").filter(Boolean);

      let current = root;
      let currentPath = "";

      parts.forEach((part, index) => {
        currentPath += (currentPath ? "/" : "") + part;
        const isLast = index === parts.length - 1;
        
        if (!current.has(part)) {
          const item: FileSystemItem = {
            name: part,
            path: currentPath,
            type: isLast && entry.type === 32768 ? "file" : "directory",
            size: isLast && entry.type === 32768 ? entry.size : undefined,
            entry: isLast && entry.type === 32768 ? entry : undefined,
            children: new Map(),
          };
          current.set(part, item);
        }

        const item = current.get(part)!;
        if (!isLast && item.children) {
          current = item.children;
        }
      });
    });

    return root;
  }, [entries]);

  // Get current directory items
  const currentItems = useMemo(() => {
    if (!currentPath) {
      return Array.from(fileSystem.values());
    }

    const parts = currentPath.split("/").filter(Boolean);
    let current = fileSystem;

    for (const part of parts) {
      const item = current.get(part);
      if (item?.children) {
        current = item.children;
      } else {
        return [];
      }
    }

    return Array.from(current.values());
  }, [fileSystem, currentPath]);

  // Convert FileSystemItems to FolderItems for FolderViewer
  const folderItems = useMemo<FolderItem[]>(() => {
    return currentItems.map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      entry: item.entry,
    }));
  }, [currentItems]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setViewMode("folder");
    setSelectedFile(null);
    setExtractedFile(null);
  };

  const handleItemClick = (item: FolderItem) => {
    if (item.type === "directory") {
      handleNavigate(item.path);
    } else if (item.entry) {
      const entry = item.entry as ArchiveEntry;
      setSelectedFile(entry);
      setViewMode("file");
      
      if (entry.data) {
        // Convert Int8Array to Uint8Array and create a File
        const uint8Array = new Uint8Array(entry.data);
        const blob = new Blob([uint8Array]);
        const extractedFile = new File([blob], item.name, { type: "" });
        setExtractedFile(extractedFile);
      } else {
        setExtractedFile(null);
      }
    }
  };

  const breadcrumbParts = useMemo(() => {
    if (!currentPath) return [];
    return currentPath.split("/").filter(Boolean);
  }, [currentPath]);

  return (
    <div className="archive-viewer">
      <div className="archive-navigation">
        <nav className="archive-breadcrumb">
          <div className="breadcrumb-item">
            <button className="breadcrumb-button" onClick={() => handleNavigate("")}>
              {file.name}
            </button>
          </div>
          {breadcrumbParts.map((part, index) => {
            const path = breadcrumbParts.slice(0, index + 1).join("/");
            return (
              <span key={path} className="breadcrumb-item">
                <span className="breadcrumb-divider">/</span>
                <button className="breadcrumb-button" onClick={() => handleNavigate(path)}>
                  {part}
                </button>
              </span>
            );
          })}
          {viewMode === "file" && selectedFile && (
            <span className="breadcrumb-item">
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-current">{selectedFile.name}</span>
            </span>
          )}
        </nav>
      </div>
      {viewMode === "folder" ? (
        <FolderViewer
          items={folderItems}
          onItemClick={handleItemClick}
        />
      ) : (
        <div className="archive-file-viewer">
          <div className="archive-file-content">
            {extractedFile ? (
              <FileViewer file={extractedFile} />
            ) : (
              <p className="archive-error-message">
                Failed to extract file.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArchiveViewer;

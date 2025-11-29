import { useState, useMemo } from "react";
import { useArchiveWorker } from "../Hooks/useArchiveWorker";
import { useUnarchive } from "../Hooks/useUnarchive";
import { FileViewer } from "./FileViewer";
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
  const [selectedFile, setSelectedFile] = useState<ArchiveEntry | null>(null);
  const [extractedFile, setExtractedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

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

  // Get breadcrumb items
  const breadcrumbParts = useMemo(() => {
    if (!currentPath) return [];
    return currentPath.split("/").filter(Boolean);
  }, [currentPath]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setExtractedFile(null);
  };

  const handleBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    handleNavigate(parts.join("/"));
  };

  const handleItemClick = async (item: FileSystemItem) => {
    if (item.type === "directory") {
      handleNavigate(item.path);
    } else if (item.entry) {
      setSelectedFile(item.entry);
      setExtractedFile(null);
      setIsExtracting(true);

      try {
        // Extract the file with data
        await worker.init();
        await worker.open(file, "");
        const extractedEntries = await worker.entries(false);
        const extractedEntry = extractedEntries.find((e: ArchiveEntry) => e.path === item.entry!.path);
        
        if (extractedEntry && extractedEntry.data) {
          // Convert Int8Array to Uint8Array and create a File
          const uint8Array = new Uint8Array(extractedEntry.data);
          const blob = new Blob([uint8Array]);
          const extractedFile = new File([blob], item.name, { type: "" });
          setExtractedFile(extractedFile);
        }
      } catch (error) {
        console.error("Failed to extract file:", error);
      } finally {
        setIsExtracting(false);
      }
    }
  };

  return (
    <div className="archive-viewer">
      <div className="archive-navigation">
        {currentPath && (
          <button
            className="archive-back-button"
            onClick={handleBack}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M12.6 14.4L8.2 10l4.4-4.4L11.2 4.2 5.4 10l5.8 5.8 1.4-1.4z"/>
            </svg>
          </button>
        )}
        <nav className="archive-breadcrumb">
          <div className="breadcrumb-item">
            <button className="breadcrumb-button" onClick={() => handleNavigate("")}>
              /
            </button>
          </div>
          {breadcrumbParts.map((part, index) => {
            const path = breadcrumbParts.slice(0, index + 1).join("/");
            return (
              <span key={path}>
                <span className="breadcrumb-divider">/</span>
                <div className="breadcrumb-item">
                  <button className="breadcrumb-button" onClick={() => handleNavigate(path)}>
                    {part}
                  </button>
                </div>
              </span>
            );
          })}
        </nav>
      </div>

      <ul className="archive-list">
        {currentItems.length === 0 ? (
          <li className="archive-empty-directory">
            Empty directory
          </li>
        ) : (
          currentItems
            .sort((a, b) => {
              // Directories first, then alphabetical
              if (a.type !== b.type) {
                return a.type === "directory" ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            })
            .map((item) => (
              <li
                key={item.path}
                className="archive-list-item"
                onClick={() => handleItemClick(item)}
              >
                <div className="archive-icon">
                  {item.type === "directory" ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6 2h8l6 6v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm7 7h5.5L13 3.5V9z"/>
                    </svg>
                  )}
                </div>
                <div className="archive-item-content">
                  <h4 className="archive-item-name">{item.name}</h4>
                </div>
              </li>
            ))
        )}
      </ul>

      {selectedFile && (
        <div className="archive-file-viewer">
          <div className="archive-file-header">
            <h3 className="archive-file-name">{selectedFile.name}</h3>
            <button onClick={() => {
              setSelectedFile(null);
              setExtractedFile(null);
            }}>
              Close
            </button>
          </div>
          <div className="archive-file-content">
            {isExtracting ? (
              <p>Extracting file...</p>
            ) : extractedFile ? (
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

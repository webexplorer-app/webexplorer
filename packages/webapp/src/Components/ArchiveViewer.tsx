import { useState, useMemo } from "react";
import { makeStyles, Button, Breadcrumb, BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider } from "@fluentui/react-components";
import { Folder20Regular, Document20Regular, ArrowLeft20Regular } from "@fluentui/react-icons";
import { useArchiveWorker } from "../Hooks/useArchiveWorker";
import { useUnarchive } from "../Hooks/useUnarchive";
import { FileViewer } from "./FileViewer";
import type { ArchiveEntry } from "../../../archive/dist/esm";

const useStyles = makeStyles({
  archiveViewer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "1rem",
  },
  navigation: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid var(--secondary)",
  },
  breadcrumb: {
    flex: 1,
  },
  list: {
    padding: "0",
    listStyle: "none",
    margin: "0",
    flex: 1,
    overflowY: "auto",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    margin: "0.25rem 0",
    padding: "0.75rem 1rem",
    border: "1px solid var(--secondary)",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
  },
  icon: {
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    margin: "0",
    fontWeight: "500",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemDetails: {
    margin: "0.25rem 0 0 0",
    fontSize: "0.875rem",
    color: "var(--colorNeutralForeground3)",
  },
  fileViewer: {
    marginTop: "1rem",
    padding: "1rem",
    border: "1px solid var(--secondary)",
    borderRadius: "4px",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  fileHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid var(--secondary)",
  },
  fileName: {
    margin: "0",
    fontSize: "1.1rem",
    fontWeight: "600",
  },
  fileContent: {
    maxHeight: "400px",
    overflowY: "auto",
  },
  emptyDirectory: {
    padding: "1rem",
    textAlign: "center",
    color: "var(--colorNeutralForeground3)",
  },
  errorMessage: {
    color: "var(--colorNeutralForeground3)",
    fontSize: "0.875rem",
  },
});

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
  const styles = useStyles();
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
    <div className={styles.archiveViewer}>
      <div className={styles.navigation}>
        {currentPath && (
          <Button
            icon={<ArrowLeft20Regular />}
            appearance="subtle"
            onClick={handleBack}
          />
        )}
        <Breadcrumb className={styles.breadcrumb}>
          <BreadcrumbItem>
            <BreadcrumbButton onClick={() => handleNavigate("")}>
              /
            </BreadcrumbButton>
          </BreadcrumbItem>
          {breadcrumbParts.map((part, index) => {
            const path = breadcrumbParts.slice(0, index + 1).join("/");
            return (
              <span key={path}>
                <BreadcrumbDivider />
                <BreadcrumbItem>
                  <BreadcrumbButton onClick={() => handleNavigate(path)}>
                    {part}
                  </BreadcrumbButton>
                </BreadcrumbItem>
              </span>
            );
          })}
        </Breadcrumb>
      </div>

      <ul className={styles.list}>
        {currentItems.length === 0 ? (
          <li className={styles.emptyDirectory}>
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
                className={styles.listItem}
                onClick={() => handleItemClick(item)}
              >
                <div className={styles.icon}>
                  {item.type === "directory" ? (
                    <Folder20Regular />
                  ) : (
                    <Document20Regular />
                  )}
                </div>
                <div className={styles.itemContent}>
                  <h4 className={styles.itemName}>{item.name}</h4>
                </div>
              </li>
            ))
        )}
      </ul>

      {selectedFile && (
        <div className={styles.fileViewer}>
          <div className={styles.fileHeader}>
            <h3 className={styles.fileName}>{selectedFile.name}</h3>
            <Button appearance="subtle" onClick={() => {
              setSelectedFile(null);
              setExtractedFile(null);
            }}>
              Close
            </Button>
          </div>
          <div className={styles.fileContent}>
            {isExtracting ? (
              <p>Extracting file...</p>
            ) : extractedFile ? (
              <FileViewer file={extractedFile} />
            ) : (
              <p className={styles.errorMessage}>
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

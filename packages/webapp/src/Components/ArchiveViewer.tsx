import { makeStyles } from "@fluentui/react-components";
import { useArchiveWorker } from "../Hooks/useArchiveWorker";
import { useUnarchive } from "../Hooks/useUnarchive";

const useStyles = makeStyles({
  archiveViewer: {
    padding: "2px 1rem",
    "& ol": {
      padding: "0",
      listStyle: "none",
    },
    "& li": {
      margin: "0.5rem 0",
      padding: "0.5rem 1rem",
      border: "1px solid var(--secondary)",
    },
    "& h4, & p": {
      margin: "0.5rem 0",
    },
  },
});

export interface ArchiveViewerProps {
  file: File;
}

export function ArchiveViewer(props: ArchiveViewerProps) {
  const { file } = props;
  const styles = useStyles();

  const worker = useArchiveWorker();
  const [entries] = useUnarchive(worker, file, "");

  return (
    <div className={styles.archiveViewer}>
      <ol>
        {entries.map((entry, index) => {
          return (
            <li key={index}>
              <div>
                <h4>{entry.name}</h4>
                <p>{entry.path}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default ArchiveViewer;

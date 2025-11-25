import { useEffect, useState, useCallback, useRef } from "react";
import { makeStyles } from "@fluentui/react-components";
import { State, Stateful } from "./Stateful";
import WebTorrent, {
  type Torrent,
  type TorrentFile,
} from "webtorrent/dist/webtorrent.min";
import { Buffer } from "buffer";
import { Localized } from "@fluent/react";

const useStyles = makeStyles({
  torrentViewer: {
    padding: "1rem",
  },
  torrentFile: {
    "& header": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    "& header p": {
      flex: "1",
    },
    "& header button": {
      marginRight: "1rem",
    },
  },
  previewer: {
    "& *": {
      width: "100%",
    },
  },
});

export interface TorrentViewerProps {
  file: File;
}

export function TorrentViewer(props: TorrentViewerProps) {
  const { file } = props;
  const styles = useStyles();
  const [torrent, setTorrent] = useState<Torrent | null>(null);
  const [state, setState] = useState(State.Initial);
  const [client] = useState(() => {
    return new WebTorrent();
  });

  useEffect(() => {
    function load() {
      setState(State.Loading);

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as ArrayBuffer;

        const buffer = Buffer.from(result);

        client.add(buffer, (torrent: Torrent) => {
          setTorrent(torrent);
          setState(State.Success);
        });

        client.on("error", () => {
          setState(State.Failure);
        });
      };

      reader.onerror = () => {
        setState(State.Failure);
      };

      reader.readAsArrayBuffer(file);
    }

    load();
  }, [client, file, setTorrent]);

  return (
    <Stateful state={state}>
      <div className={styles.torrentViewer}>
        {torrent?.files.map((file, index) => {
          return <TorrentFileItem file={file} key={index}></TorrentFileItem>;
        })}
      </div>
    </Stateful>
  );
}

export function TorrentFileItem({ file }: { file: TorrentFile }) {
  const styles = useStyles();
  const previewerElemRef = useRef<HTMLDivElement>(null);

  const [isPreview, setIsPreview] = useState(false);
  const preview = useCallback(() => {
    if (previewerElemRef.current) {
      file.appendTo(previewerElemRef.current);
      setIsPreview(true);
    }
  }, [file, setIsPreview]);

  const [url, setUrl] = useState("");

  useEffect(() => {
    file.getBlobURL((_err, url) => {
      if (url) {
        setUrl(url);
      }
    });
  }, [file, setUrl]);

  return (
    <div className={styles.torrentFile}>
      <header>
        <p>{file.name}</p>
        <Localized id="preview">
          <button disabled={isPreview} onClick={preview} type="button">
            Preview
          </button>
        </Localized>
        <Localized id="download">
          <a rel="noreferrer" target="_blank" href={url}>
            Download
          </a>
        </Localized>
      </header>
      <div className={styles.previewer} ref={previewerElemRef}></div>
    </div>
  );
}

export default TorrentViewer;

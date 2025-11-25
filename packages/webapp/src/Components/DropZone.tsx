import { FolderRegular } from "@fluentui/react-icons";
import { Localized } from "@fluent/react";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  dropzone: {
    padding: "1rem",
    "& ol p": {
      lineHeight: "1.5rem",
    },
    "& h3": {
      margin: "2rem 0 0.5rem 0",
    },
    "& table": {
      width: "100%",
      borderCollapse: "collapse",
    },
    "& th, & td": {
      padding: "0.5rem",
      border: "1px solid #c0c0c0",
      textAlign: "left",
    },
  },
  dropzoneArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #ccc",
    width: "100%",
    height: "16rem",
  },
});

export interface DropZoneProps {
  onDropFile: (file: File) => void;
}

export function DropZone(props: DropZoneProps) {
  const { onDropFile } = props;
  const styles = useStyles();

  return (
    <div className={styles.dropzone}>
      <div
        className={styles.dropzoneArea}
        onDragStart={(evt) => {
          evt.preventDefault();
          evt.stopPropagation();
        }}
        onDragOver={(evt) => {
          evt.preventDefault();
          evt.stopPropagation();
        }}
        onDragEnd={(evt) => {
          evt.preventDefault();
          evt.stopPropagation();
        }}
        onDrop={(evt) => {
          evt.preventDefault();

          for (let i = 0; i < evt.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (evt.dataTransfer.items[i].kind === "file") {
              const file = evt.dataTransfer.items[i].getAsFile();
              if (file) {
                onDropFile(file);
                break;
              }
            }
          }
        }}
      ><p>
          <FolderRegular />
          <Localized id="drag-and-drop-file-here">
            Drag and drop file here
          </Localized>
        </p>
      </div>
      <div>
        <Localized id="supported-files">
          <h3>Supported Files</h3>
        </Localized>
        <table>
          <thead>
            <tr>
              <th>
                <Localized id="file">File</Localized>
              </th>
              <th>
                <Localized id="extension">Extension</Localized>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Localized id="pdf-file">PDF File</Localized>
              </td>
              <td>.pdf</td>
            </tr>
            <tr>
              <td>
                <Localized id="epub-file">EPUB File</Localized>
              </td>
              <td>.epub</td>
            </tr>
            <tr>
              <td>
                <Localized id="mobi-file">Mobi File</Localized>
              </td>
              <td>.mobi</td>
            </tr>
            <tr>
              <td>
                <Localized id="azw3-file">Azw3 File</Localized>
              </td>
              <td>.azw3 (limited supported)</td>
            </tr>
            <tr>
              <td>
                <Localized id="archive-file">Archive File</Localized>
              </td>
              <td>.zip .rar .tar.gz</td>
            </tr>
            <tr>
              <td>
                <Localized id="guitar-tab-file">Guitar Tab File</Localized>
              </td>
              <td>.gp3 .gp4</td>
            </tr>
            <tr>
              <td>
                <Localized id="threed-model-file">3D Model File</Localized>
              </td>
              <td>.gltf .stl .3mf .obj</td>
            </tr>
            <tr>
              <td>
                <Localized id="torrent-file">Torrent File</Localized>
              </td>
              <td>.torrent</td>
            </tr>
            <tr>
              <td>
                <Localized id="csv-file">CSV File</Localized>
              </td>
              <td>.csv</td>
            </tr>
            <tr>
              <td>
                <Localized id="wasm-file">WASM File</Localized>
              </td>
              <td>.wasm</td>
            </tr>
            <tr>
              <td>
                <Localized id="image-file">Image File</Localized>
              </td>
              <td>.png .jpg .jpeg .gif .webp .apng .bmp .svg .avif .ico .tiff</td>
            </tr>
            <tr>
              <td>
                <Localized id="audio-file">Audio File</Localized>
              </td>
              <td>.mp3 .flac .aac .ogg</td>
            </tr>
            <tr>
              <td>
                <Localized id="video-file">Video File</Localized>
              </td>
              <td>.mp4 .webm .ogg .mov</td>
            </tr>
            <tr>
              <td>
                <Localized id="email-file">Email File</Localized>
              </td>
              <td>.msg</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

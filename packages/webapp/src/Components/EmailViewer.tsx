import { useEffect, useState } from "react";
import { makeStyles } from "@fluentui/react-components";
import { type MsgFile, parseMsgFile } from "@webexplorer/email";
import { Localized } from "@fluent/react";
import { Attachments } from "./Attachments";

const useStyles = makeStyles({
  emailViewer: {
    "& table": {
      marginTop: "0.5rem",
      maxWidth: "fit-content",
      borderCollapse: "collapse",
      whiteSpace: "nowrap",
    },
    "& td": {
      padding: "0.5rem",
      border: "1px solid #f0f0f0",
    },
    "& td:first-child": {
      fontWeight: "bold",
    },
  },
  content: {
    whiteSpace: "pre-wrap",
    textWrap: "wrap",
  },
});

export interface EmailViewerProps {
  file: File;
}

export function EmailViewer(props: EmailViewerProps) {
  const { file } = props;
  const [msgFile, setMsgFile] = useState<MsgFile | null>(null);

  useEffect(() => {
    function init() {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as ArrayBuffer;
        const msgFile = parseMsgFile(new Uint8Array(content));
        if (msgFile) {
          setMsgFile(msgFile);
        }
      };

      reader.readAsArrayBuffer(file);
    }

    init();
  }, [file, setMsgFile]);

  const styles = useStyles();

  if (!msgFile) {
    return <div className={styles.emailViewer}></div>
  }

  return (
    <div className={styles.emailViewer}>
      <table>
        <tbody>
          <tr>
            <td>
              <Localized id="from">From</Localized>
            </td>
            <td>
              {msgFile.senderName || ''} {msgFile.senderEmail ? `<${msgFile.senderName}>` : ''}
            </td>
          </tr>
          <tr>
            <td>
              <Localized id="to">To</Localized>
            </td>
            <td>
              {msgFile.toRecipient}
            </td>
          </tr>
          <tr>
            <td>
              <Localized id="subject">Subject</Localized>
            </td>
            <td>
              {msgFile.subject}
            </td>
          </tr>
          <tr>
            <td>
              <Localized id="attachments">Attachments</Localized>
            </td>
            <td>
              <Attachments attachments={msgFile.attachments} />
            </td>
          </tr>
        </tbody>
      </table>
      <div>
      </div>
      <p className={styles.content}>
        {msgFile.text}
      </p>
    </div>
  );
}

export default EmailViewer;

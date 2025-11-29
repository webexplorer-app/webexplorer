import { useEffect, useState } from "react";
import { type MsgFile, parseMsgFile } from "@webexplorer/email";
import { Localized } from "@fluent/react";
import { Attachments } from "./Attachments";
import "./EmailViewer.css";

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

  if (!msgFile) {
    return <div className="email-viewer"></div>
  }

  return (
    <div className="email-viewer">
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
      <p className="email-content">
        {msgFile.text}
      </p>
    </div>
  );
}

export default EmailViewer;

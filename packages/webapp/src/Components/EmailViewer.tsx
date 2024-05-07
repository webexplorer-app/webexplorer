import { useEffect, useState } from "react";
import "./EmailViewer.css";
import { MsgFile, parseMsgFile } from "@webexplorer/email";
import { Localized } from "@fluent/react";
import { Attachments } from "./Attachments";

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
        console.log(msgFile);
        if (msgFile) {
          setMsgFile(msgFile);
        }
      };

      reader.readAsArrayBuffer(file);
    }

    init();
  }, [file, setMsgFile]);

  if (!msgFile) {
    return <div className="email__viewer"></div>
  }

  return (
    <div className="email__viewer">
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
      <p className="content">
        {msgFile.text}
      </p>
    </div>
  );
}

export default EmailViewer;

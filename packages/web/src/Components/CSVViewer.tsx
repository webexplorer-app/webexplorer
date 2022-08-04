import { useEffect, useState } from "react";
import "./CSVViewer.css";
import { parse } from "csv-parse/browser/esm/sync";

export interface CSVViewerProps {
  file: File;
}

export function CSVViewer(props: CSVViewerProps) {
  const { file } = props;
  const [records, setRecords] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    function init() {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const records = parse(content);
        setRecords(records);
      };

      reader.readAsText(file);
    }

    init();
  }, [file, setRecords]);

  return (
    <div className="csv__viewer">
      <table>
        <tbody>
          {records.map((record, index) => {
            return (
              <tr key={index}>
                {Object.keys(record).map((key, index) => {
                  return <td key={index}>{record[key]}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CSVViewer;

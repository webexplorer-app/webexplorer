import { useEffect, useState } from "react";
import { parse } from "csv-parse";
import { Loading } from "./Loading";
import "./CSVViewer.css";

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
        const parser = parse(content);
        parser.on('data', (data) => {
          setRecords(records => {
            return [...records, data];
          });
        })
      };

      reader.readAsText(file);
    }

    init();
  }, [file, setRecords]);

  if (records.length === 0) {
    return <Loading />
  }

  const [head, ...rows] = records;

  return (
    <div className="csv-viewer">
      <table>
        <thead>
          <tr>
            {Object.keys(head).map((key, index) => {
              return <th key={index}>{head[key]}</th>
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((rows, index) => {
            return (
              <tr key={index}>
                {Object.keys(rows).map((key, index) => {
                  return <td key={index}>{rows[key]}</td>;
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

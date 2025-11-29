import { type ChangeEvent, type ComponentProps, useCallback, useState, useRef } from "react";
import { Localized } from "@fluent/react";
import "./FilePicker.css";

export interface FilePickerProps extends ComponentProps<"input"> {
  onFiles: (files: FileList) => void;
}

export function FilePicker(props: FilePickerProps) {
  const { onFiles } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const [id] = useState(() => {
    return `filepicker-${Date.now()}`;
  });

  const onChange = useCallback(
    (evt: ChangeEvent) => {
      const target = evt.target as HTMLInputElement;
      if (target.files) {
        onFiles(target.files);
      }
    },
    [onFiles]
  );

  const handleButtonClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="filepicker">
      <input 
        ref={inputRef}
        onChange={onChange} 
        type="file" 
        id={id}
        style={{ display: 'none' }}
      />
      <button 
        className="filepicker-button"
        onClick={handleButtonClick}
      >
        <svg className="filepicker-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-8-4h2v2h2v-2h2v-2h-2v-2h-2v2h-2v2z"/>
        </svg>
        <Localized id="choose-file">Choose File</Localized>
      </button>
    </div>
  );
}

import { type ChangeEvent, type ComponentProps, useCallback, useState, useRef } from "react";
import { FolderPlusIcon } from "@heroicons/react/24/outline";
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
        className="filepicker-input"
      />
      <button 
        className="filepicker-button"
        onClick={handleButtonClick}
      >
        <FolderPlusIcon />
        <Localized id="choose-file">Choose File</Localized>
      </button>
    </div>
  );
}

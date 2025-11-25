import { type ChangeEvent, type ComponentProps, useCallback, useState, useRef } from "react";
import { Localized } from "@fluent/react";
import { Button, makeStyles } from "@fluentui/react-components";
import { FolderOpen24Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  filepicker: {
    display: "inline-flex",
    alignItems: "center",
  },
});

export interface FilePickerProps extends ComponentProps<"input"> {
  onFiles: (files: FileList) => void;
}

export function FilePicker(props: FilePickerProps) {
  const { onFiles } = props;
  const styles = useStyles();
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
    <div className={styles.filepicker}>
      <input 
        ref={inputRef}
        onChange={onChange} 
        type="file" 
        id={id}
        style={{ display: 'none' }}
      />
      <Button 
        appearance="primary" 
        icon={<FolderOpen24Regular />}
        onClick={handleButtonClick}
      >
        <Localized id="choose-file">Choose File</Localized>
      </Button>
    </div>
  );
}

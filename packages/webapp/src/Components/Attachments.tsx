import { useMemo } from 'react';
import { Localized } from '@fluent/react';
import { Link, makeStyles } from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  attachments: {
    "& ol": {
      padding: "0",
    },
    "& ol span": {
      display: "inline-block",
      marginRight: "1rem",
    },
  },
});

export interface AttachmentsProps {
    attachments: Array<{
        filename: string;
        content: Uint8Array;
    }>
}

export function Attachments(props: AttachmentsProps) {
    const { attachments } = props;
    const items = useMemo(() => {
        return attachments.map(attachment => {
            return {
                ...attachment,
                downloadUrl: URL.createObjectURL(new Blob([attachment.content.buffer as ArrayBuffer]))
            }
        })
    }, [attachments])

    const styles = useStyles();

    return (
        <div className={styles.attachments}>
            <ol>
                {items.map((item, index) => {
                    return (
                        <li key={index}>
                            <span>{item.filename}</span>
                            <Link 
                                as="a"
                                download={item.filename} 
                                href={item.downloadUrl}
                            >
                                <ArrowDownload24Regular />
                                <Localized id="download">Download</Localized>
                            </Link>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}
import { useMemo } from 'react';
import './Attachments.css';
import { Localized } from '@fluent/react';

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
                downloadUrl: URL.createObjectURL(new Blob([attachment.content]))
            }
        })
    }, [attachments])

    return (
        <div className='attachments'>
            <ol>
                {items.map((item, index) => {
                    return (
                        <li key={index}>
                            <span>{item.filename}</span>
                            <a download={item.filename} href={item.downloadUrl}>
                                <Localized id="download">Download</Localized>
                            </a>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}
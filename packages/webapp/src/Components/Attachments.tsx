import { useMemo } from 'react';
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
                downloadUrl: URL.createObjectURL(new Blob([attachment.content.buffer as ArrayBuffer]))
            }
        })
    }, [attachments])

    return (
        <div style={{ padding: '0' }}>
            <ol style={{ padding: '0' }}>
                {items.map((item, index) => {
                    return (
                        <li key={index}>
                            <span style={{ display: 'inline-block', marginRight: '1rem' }}>{item.filename}</span>
                            <a 
                                download={item.filename} 
                                href={item.downloadUrl}
                                style={{ color: '#0078d4', textDecoration: 'none' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                                </svg>
                                <Localized id="download">Download</Localized>
                            </a>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}
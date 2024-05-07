import { bytesToUTF16LE, isUTF16LE } from '@webexplorer/common';
import { CFB$Container, find, parse } from 'cfb';

// https://msopenspecs.azureedge.net/files/MS-OXMSG/%5bMS-OXMSG%5d.pdf
export const MSG_PROPERTY_TAGS = {
    SENDER_NAME: {
        tag: "__substg1.0_0C1A001F",
        description: "Sender Name",
    },
    SENDER_EMAIL: {
        tag: "__substg1.0_0C1F001F",
        description: "Sender Email",
    },
    SENT_DATE: {
        tag: "__substg1.0_0E060040",
        description: "Sent Date",
    },
    RECEIVED_BY_NAME: {
        tag: "__substg1.0_0C15001F",
        description: "Received By Name",
    },
    RECEIVED_BY_EMAIL: {
        tag: "__substg1.0_0C1E001F",
        description: "Received By Email",
    },
    RECEIVED_DATE: {
        tag: "__substg1.0_0E070040",
        description: "Received Date",
    },
    MESSAGE_CC: {
        tag: "__substg1.0_0E03001F",
        description: "Message CC",
    },
    MESSAGE_BCC: {
        tag: "__substg1.0_0E02001F",
        description: "Message BCC",
    },
    SUBJECT: {
        tag: "__substg1.0_0037001F",
        description: "Subject",
    },
    PLAIN_TEXT_CONTENT: {
        tag: "__substg1.0_1000001F",
        description: "Plain Text Content",
    },
    HTML_CONTENT: {
        tag: "__substg1.0_10130102",
        description: "HTML Content",
    },
    PRIORITY: {
        tag: "__substg1.0_00260003",
        description: "Priority",
    },
    TO: {
        tag: "__substg1.0_0E04001F",
        description: "To",
    },
    ATTACHMENT_ENTRY: {
        tag: "__attach_version1.0_",
        description: "Attachment Entry",
    },
    ATTACHMENT_FILENAME: {
        tag: "__substg1.0_3704001F",
        description: "Attachment Filename",
    },
    ATTACHMENT_DATA: {
        tag: "__substg1.0_37010102",
        description: "Attachment Data",
    },
    REPLY_TO: {
        tag: "__substg1.0_1013011F",
        description: "Reply-To Address",
    },
    IMPORTANCE: {
        tag: "__substg1.0_00170003",
        description: "Importance",
    },
    DELIVERY_RECEIPT_REQUESTED: {
        tag: "__substg1.0_0C150003",
        description: "Delivery Receipt Requested",
    },
};

export interface Attachment {
    filename: string;
    content: Uint8Array;
}

export interface MsgFile {
    subject: string | undefined;
    senderEmail: string | undefined;
    senderName: string | undefined;
    sentDate: string | undefined;
    receivedByName: string | undefined;
    receivedByEmail: string | undefined;
    receivedDate: string | undefined;
    cc: string | undefined;
    bcc: string | undefined;
    toRecipient: string | undefined;
    replyTo: string | undefined;
    priority: string | undefined;
    importance: string | undefined;
    html: string | undefined;
    text: string | undefined;
    attachments: Attachment[];
}

export function parseMsgFile(data: Uint8Array): MsgFile {
    const cfb = parse(data);

    const attachments: Attachment[] = [];
    const attachmentPrefix = MSG_PROPERTY_TAGS.ATTACHMENT_ENTRY.tag;
    const attachmentEntries = cfb.FullPaths.filter((path) => {
        const pathParts = path.split("/");
        return (
            pathParts.length === 3 && pathParts[1].startsWith(attachmentPrefix)
        );
    });

    attachmentEntries.forEach((entryPath) => {
        const contentTag = `${entryPath}${MSG_PROPERTY_TAGS.ATTACHMENT_DATA.tag}`;
        const contentEntry = find(cfb, contentTag);

        const filenameTag = `${entryPath}${MSG_PROPERTY_TAGS.ATTACHMENT_FILENAME.tag}`;
        const filenameEntry = find(cfb, filenameTag);
        const filename = filenameEntry
            ? isUTF16LE(filenameTag)
                ? bytesToUTF16LE(filenameEntry.content)
                : filenameEntry.content.toString()
            : undefined;
        if (contentEntry && filename) {
            attachments.push({
                filename,
                content: new Uint8Array(contentEntry.content)
            });
        }
    });

    return {
        subject: readProperty(cfb, MSG_PROPERTY_TAGS.SUBJECT.tag),
        senderEmail: readProperty(cfb, MSG_PROPERTY_TAGS.SENDER_EMAIL.tag),
        senderName: readProperty(cfb, MSG_PROPERTY_TAGS.SENDER_NAME.tag),
        sentDate: readProperty(cfb, MSG_PROPERTY_TAGS.SENT_DATE.tag),
        receivedByName: readProperty(cfb, MSG_PROPERTY_TAGS.RECEIVED_BY_NAME.tag),
        receivedByEmail: readProperty(cfb, MSG_PROPERTY_TAGS.RECEIVED_BY_EMAIL.tag),
        receivedDate: readProperty(cfb, MSG_PROPERTY_TAGS.RECEIVED_DATE.tag),
        cc: readProperty(cfb, MSG_PROPERTY_TAGS.MESSAGE_CC.tag),
        bcc: readProperty(cfb, MSG_PROPERTY_TAGS.MESSAGE_BCC.tag),
        toRecipient: readProperty(cfb, MSG_PROPERTY_TAGS.TO.tag),
        replyTo: readProperty(cfb, MSG_PROPERTY_TAGS.REPLY_TO.tag),
        priority: readProperty(cfb, MSG_PROPERTY_TAGS.PRIORITY.tag),
        importance: readProperty(cfb, MSG_PROPERTY_TAGS.PRIORITY.tag),
        text: readProperty(cfb, MSG_PROPERTY_TAGS.PLAIN_TEXT_CONTENT.tag),
        html: readProperty(cfb, MSG_PROPERTY_TAGS.HTML_CONTENT.tag),
        attachments
    }
}

function readProperty(cfg: CFB$Container, tag: string): string | undefined {
    const entry = find(cfg, tag);
    if (!entry) {
        return;
    }

    const content = Array.isArray(entry.content) ? new Uint8Array(entry.content) : entry.content;
    if (!content) {
        return;
    }

    return isUTF16LE(tag) ? bytesToUTF16LE(content) : content.toString();
}

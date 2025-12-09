import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseMsgFile, type MsgFile } from '../src/msg';

describe('parseMsgFile', () => {
  it('should parse email.msg file with correct values', () => {
    const msgFilePath = join(__dirname, 'email.msg');
    const msgData = readFileSync(msgFilePath);
    const msgUint8Array = new Uint8Array(msgData);

    const result: MsgFile = parseMsgFile(msgUint8Array);

    // Verify the actual values from the email.msg file
    expect(result.subject).toBe('creating an outlook message file');
    expect(result.senderName).toBe('from@domain.com');
    expect(result.senderEmail).toBe('from@domain.com');
    expect(result.toRecipient).toBe('to@domain.com');
    expect(result.text).toBe('This message is created by Aspose.Email');
    
    // These fields are not present in the test file
    expect(result.cc).toBeUndefined();
    expect(result.bcc).toBeUndefined();
    
    // Verify structure
    expect(result).toHaveProperty('sentDate');
    expect(result).toHaveProperty('receivedByName');
    expect(result).toHaveProperty('receivedByEmail');
    expect(result).toHaveProperty('receivedDate');
    expect(result).toHaveProperty('replyTo');
    expect(result).toHaveProperty('priority');
    expect(result).toHaveProperty('importance');
    expect(result).toHaveProperty('html');
    expect(Array.isArray(result.attachments)).toBe(true);
  });

  it('should handle attachments correctly', () => {
    const msgFilePath = join(__dirname, 'email.msg');
    const msgData = readFileSync(msgFilePath);
    const msgUint8Array = new Uint8Array(msgData);

    const result: MsgFile = parseMsgFile(msgUint8Array);

    // This test email has no attachments
    expect(result.attachments).toEqual([]);
    expect(result.attachments.length).toBe(0);
  });

  it('should return MsgFile with expected types', () => {
    const msgFilePath = join(__dirname, 'email.msg');
    const msgData = readFileSync(msgFilePath);
    const msgUint8Array = new Uint8Array(msgData);

    const result: MsgFile = parseMsgFile(msgUint8Array);

    // Check types for optional string properties
    const stringProps = [
      'subject', 'senderEmail', 'senderName', 'sentDate',
      'receivedByName', 'receivedByEmail', 'receivedDate',
      'cc', 'bcc', 'toRecipient', 'replyTo', 'priority',
      'importance', 'html', 'text'
    ];

    stringProps.forEach(prop => {
      const value = result[prop as keyof MsgFile];
      expect(value === undefined || typeof value === 'string').toBe(true);
    });
  });
});

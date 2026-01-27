/**
 * Document generation handlers.
 *
 * Handles document generation requests and streams results back.
 */

import {
  createContentDocument,
  createContentPage,
  createContentSection,
  createContentRow,
  createContentColumn,
  createContentCell,
  createStructureDocument,
  createStructurePage,
  createStructureSection,
  createStructureRow,
  createStructureColumn,
  createStructureCell,
  serializeDocument,
  serializePart,
  type Part,
  type Document,
  type DocumentMode,
} from '@webexplorer/document';

import { createAIProvider, type AIStreamChunk } from './ai/index';
import type {
  DocumentRequest,
  ServerMessage,
  AckMessage,
  PartMessage,
  ProgressMessage,
  ErrorMessage,
  CompleteMessage,
} from './types';

/**
 * Generate a unique boundary for multipart response.
 */
export function generateBoundary(): string {
  return `----WebExplorerBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;
}

/**
 * Document generation session.
 */
export class DocumentGenerationSession {
  private abortController: AbortController;
  private partsGenerated = 0;
  private boundary: string;

  constructor(
    private request: DocumentRequest,
    private sendMessage: (msg: ServerMessage) => void
  ) {
    this.abortController = new AbortController();
    this.boundary = generateBoundary();
  }

  /**
   * Get the abort controller for this session.
   */
  getAbortController(): AbortController {
    return this.abortController;
  }

  /**
   * Cancel the generation.
   */
  cancel(): void {
    this.abortController.abort();
  }

  /**
   * Start document generation.
   */
  async generate(): Promise<void> {
    const { request, sendMessage } = this;

    try {
      // Send acknowledgment
      const ackMsg: AckMessage = {
        type: 'ack',
        requestId: request.requestId,
        timestamp: Date.now(),
        boundary: this.boundary,
      };
      sendMessage(ackMsg);

      // Get AI provider
      const provider = createAIProvider(request.aiConfig);

      // Build prompt for document generation
      const fullPrompt = this.buildDocumentPrompt();

      // Accumulate AI response
      let fullResponse = '';
      const chunks: AIStreamChunk[] = [];

      for await (const chunk of provider.streamGenerate(
        fullPrompt,
        request.aiConfig,
        this.abortController.signal
      )) {
        if (this.abortController.signal.aborted) {
          break;
        }

        chunks.push(chunk);
        fullResponse += chunk.content;

        // Try to extract and emit document parts as they become available
        await this.processStreamedContent(fullResponse);
      }

      // If we couldn't parse streaming JSON, generate a default document
      if (this.partsGenerated === 0) {
        await this.generateDefaultDocument(fullResponse);
      }

      // Send completion
      const completeMsg: CompleteMessage = {
        type: 'complete',
        requestId: request.requestId,
        timestamp: Date.now(),
        totalParts: this.partsGenerated,
        terminator: `--${this.boundary}--`,
      };
      sendMessage(completeMsg);
    } catch (error) {
      if (this.abortController.signal.aborted) {
        return; // Cancelled, don't send error
      }

      const errorMsg: ErrorMessage = {
        type: 'error',
        requestId: request.requestId,
        timestamp: Date.now(),
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : String(error),
        recoverable: false,
      };
      sendMessage(errorMsg);
    }
  }

  /**
   * Build the prompt for document generation.
   */
  private buildDocumentPrompt(): string {
    const { request } = this;

    let prompt = request.prompt;

    if (request.mode === 'structure') {
      prompt += '\n\nGenerate only the document structure with preview metadata, without actual content.';
    }

    if (request.template) {
      prompt += `\n\nFollow this template:\n${request.template}`;
    }

    if (request.context?.length) {
      prompt += `\n\nContext:\n${request.context.join('\n\n')}`;
    }

    return prompt;
  }

  /**
   * Process streamed content and extract document parts.
   */
  private async processStreamedContent(_content: string): Promise<void> {
    // This is a simplified implementation.
    // In production, you'd parse streaming JSON to extract parts incrementally.
    // For now, we wait for the full response and generate parts from it.
  }

  /**
   * Generate a default document structure from AI response.
   */
  private async generateDefaultDocument(aiResponse: string): Promise<void> {
    const { request, sendMessage } = this;

    // Create document based on mode
    let doc: Document<DocumentMode>;

    if (request.mode === 'structure') {
      doc = createStructureDocument()
        .id(`doc-${request.requestId}`)
        .title(this.extractTitle(aiResponse) || 'Generated Document')
        .addPage(
          createStructurePage()
            .id('page-1')
            .title('Page 1')
            .addSection(
              createStructureSection()
                .id('section-1')
                .addRow(
                  createStructureRow()
                    .id('row-1')
                    .addColumn(
                      createStructureColumn()
                        .id('col-1')
                        .addCell(
                          createStructureCell()
                            .id('cell-1')
                            .preview(
                              'Content',
                              this.extractDescription(aiResponse),
                              'text/plain'
                            )
                            .estimatedSize(aiResponse.length)
                        )
                    )
                )
            )
        )
        .build();
    } else {
      doc = createContentDocument()
        .id(`doc-${request.requestId}`)
        .title(this.extractTitle(aiResponse) || 'Generated Document')
        .addPage(
          createContentPage()
            .id('page-1')
            .title('Page 1')
            .addSection(
              createContentSection()
                .id('section-1')
                .addRow(
                  createContentRow()
                    .id('row-1')
                    .addColumn(
                      createContentColumn()
                        .id('col-1')
                        .addCell(
                          createContentCell()
                            .id('cell-1')
                            .content('text/plain', aiResponse)
                        )
                    )
                )
            )
        )
        .build();
    }

    // Serialize and send parts
    for (const part of serializeDocument(doc)) {
      this.emitPart(part);
    }
  }

  /**
   * Emit a document part.
   */
  private emitPart(part: Part): void {
    const partStr = serializePart(part, this.boundary);
    this.partsGenerated++;

    const msg: PartMessage = {
      type: 'part',
      requestId: this.request.requestId,
      timestamp: Date.now(),
      part: partStr,
      index: this.partsGenerated - 1,
    };

    this.sendMessage(msg);

    // Send progress update
    const progressMsg: ProgressMessage = {
      type: 'progress',
      requestId: this.request.requestId,
      timestamp: Date.now(),
      partsGenerated: this.partsGenerated,
      status: `Generated ${this.partsGenerated} parts`,
    };
    this.sendMessage(progressMsg);
  }

  /**
   * Extract a title from AI response.
   */
  private extractTitle(text: string): string | null {
    // Try to find a title in markdown format
    const match = text.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract a description from AI response.
   */
  private extractDescription(text: string): string {
    // Take first 200 chars as description
    return text.slice(0, 200).replace(/\n/g, ' ').trim();
  }
}

/**
 * Handle a document generation request.
 */
export async function handleGenerateRequest(
  request: DocumentRequest,
  sendMessage: (msg: ServerMessage) => void
): Promise<DocumentGenerationSession> {
  const session = new DocumentGenerationSession(request, sendMessage);

  // Start generation in background
  session.generate().catch(() => {
    // Error already sent via sendMessage
  });

  return session;
}

/**
 * Supported file types configuration
 * 
 * This is the single source of truth for all supported file types
 * used by both the file viewer and the supported files list component.
 */

export interface SupportedFileType {
  /** Unique identifier for the file type */
  id: string;
  /** Display name (translation key) */
  nameKey: string;
  /** Default display name */
  defaultName: string;
  /** File extensions (without dot) */
  extensions: string[];
  /** MIME types that map to this file type */
  mimeTypes: string[];
  /** Viewer component name */
  viewer: string;
  /** Whether the viewer needs to be lazy loaded */
  lazyLoad: boolean;
  /** Optional note about support level */
  note?: string;
  /** Category for grouping */
  category: 'document' | 'ebook' | 'media' | 'archive' | 'data' | 'code' | 'other';
}

/**
 * All supported file types
 */
export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  // Documents
  {
    id: 'pdf',
    nameKey: 'pdf-file',
    defaultName: 'PDF File',
    extensions: ['pdf'],
    mimeTypes: ['application/pdf'],
    viewer: 'pdf-viewer',
    lazyLoad: true,
    category: 'document',
  },
  
  // Ebooks
  {
    id: 'epub',
    nameKey: 'epub-file',
    defaultName: 'EPUB File',
    extensions: ['epub'],
    mimeTypes: ['application/epub+zip'],
    viewer: 'epub-viewer',
    lazyLoad: true,
    category: 'ebook',
  },
  {
    id: 'mobi',
    nameKey: 'mobi-file',
    defaultName: 'Mobi File',
    extensions: ['mobi'],
    mimeTypes: ['application/x-mobipocket-ebook'],
    viewer: 'mobi-viewer',
    lazyLoad: true,
    category: 'ebook',
  },
  {
    id: 'azw3',
    nameKey: 'azw3-file',
    defaultName: 'Azw3 File',
    extensions: ['azw3'],
    mimeTypes: ['application/x-azw3'],
    viewer: 'mobi-viewer',
    lazyLoad: true,
    category: 'ebook',
    note: 'limited support',
  },
  
  // Archives
  {
    id: 'archive',
    nameKey: 'archive-file',
    defaultName: 'Archive File',
    extensions: ['zip', 'rar', 'tar', 'gz', 'tar.gz', '7z'],
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-tar',
      'application/x-compressed',
      'application/vnd.rar',
      'application/x-gzip',
    ],
    viewer: 'archive-viewer',
    lazyLoad: true,
    category: 'archive',
  },
  
  // Media - Images
  {
    id: 'image',
    nameKey: 'image-file',
    defaultName: 'Image File',
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'apng', 'bmp', 'svg', 'avif', 'ico', 'tiff'],
    mimeTypes: [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/apng',
      'image/bmp',
      'image/svg+xml',
      'image/.avif',
      'image/x-icon',
      'image/tiff',
    ],
    viewer: 'image-viewer',
    lazyLoad: false,
    category: 'media',
  },
  
  // Media - Audio
  {
    id: 'audio',
    nameKey: 'audio-file',
    defaultName: 'Audio File',
    extensions: ['mp3', 'flac', 'aac', 'ogg', 'wav'],
    mimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/flac',
      'audio/aac',
      'audio/ogg',
      'audio/wav',
    ],
    viewer: 'audio-viewer',
    lazyLoad: false,
    category: 'media',
  },
  
  // Media - Video
  {
    id: 'video',
    nameKey: 'video-file',
    defaultName: 'Video File',
    extensions: ['mp4', 'webm', 'ogg', 'mov'],
    mimeTypes: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/mov',
      'video/quicktime',
    ],
    viewer: 'video-viewer',
    lazyLoad: false,
    category: 'media',
  },
  
  // 3D Models
  {
    id: 'three',
    nameKey: 'threed-model-file',
    defaultName: '3D Model File',
    extensions: ['gltf', 'glb', 'stl', '3mf', 'obj'],
    mimeTypes: [
      'model/stl',
      'model/gltf-binary',
      'model/gltf+json',
      'model/obj',
      'model/3mf',
    ],
    viewer: 'three-viewer',
    lazyLoad: true,
    category: 'other',
  },
  
  // Data
  {
    id: 'csv',
    nameKey: 'csv-file',
    defaultName: 'CSV File',
    extensions: ['csv'],
    mimeTypes: ['text/csv'],
    viewer: 'csv-viewer',
    lazyLoad: true,
    category: 'data',
  },
  {
    id: 'torrent',
    nameKey: 'torrent-file',
    defaultName: 'Torrent File',
    extensions: ['torrent'],
    mimeTypes: ['application/x-bittorrent'],
    viewer: 'torrent-viewer',
    lazyLoad: true,
    category: 'data',
  },
  
  // Code/Binary
  {
    id: 'wasm',
    nameKey: 'wasm-file',
    defaultName: 'WASM File',
    extensions: ['wasm'],
    mimeTypes: ['application/wasm'],
    viewer: 'wasm-viewer',
    lazyLoad: true,
    category: 'code',
  },
  
  // Music/Tabs
  {
    id: 'tab',
    nameKey: 'guitar-tab-file',
    defaultName: 'Guitar Tab File',
    extensions: ['gp3', 'gp4', 'gp5', 'gpx'],
    mimeTypes: ['application/x-gtp'],
    viewer: 'tab-viewer',
    lazyLoad: true,
    category: 'other',
  },
  
  // Email
  {
    id: 'email',
    nameKey: 'email-file',
    defaultName: 'Email File',
    extensions: ['msg'],
    mimeTypes: ['application/vnd.ms-outlook'],
    viewer: 'email-viewer',
    lazyLoad: true,
    category: 'other',
  },
];

/**
 * Get file type configuration by MIME type
 */
export function getFileTypeByMime(mimeType: string): SupportedFileType | undefined {
  return SUPPORTED_FILE_TYPES.find(ft => ft.mimeTypes.includes(mimeType));
}

/**
 * Get file type configuration by extension
 */
export function getFileTypeByExtension(extension: string): SupportedFileType | undefined {
  const ext = extension.toLowerCase().replace(/^\./, '');
  return SUPPORTED_FILE_TYPES.find(ft => ft.extensions.includes(ext));
}

/**
 * Get viewer name for a MIME type
 */
export function getViewerForMime(mimeType: string): { viewer: string; lazyLoad: boolean } | undefined {
  const fileType = getFileTypeByMime(mimeType);
  if (fileType) {
    return { viewer: fileType.viewer, lazyLoad: fileType.lazyLoad };
  }
  return undefined;
}

/**
 * Check if a MIME type is supported
 */
export function isMimeTypeSupported(mimeType: string): boolean {
  return SUPPORTED_FILE_TYPES.some(ft => ft.mimeTypes.includes(mimeType));
}

/**
 * Get all supported extensions as a flat array
 */
export function getAllSupportedExtensions(): string[] {
  return SUPPORTED_FILE_TYPES.flatMap(ft => ft.extensions);
}

/**
 * Format extensions for display
 */
export function formatExtensions(extensions: string[], note?: string): string {
  const formatted = extensions.map(ext => `.${ext}`).join(' ');
  return note ? `${formatted} (${note})` : formatted;
}

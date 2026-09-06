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
  {
    id: 'word',
    nameKey: 'word-file',
    defaultName: 'Word Document',
    extensions: ['docx', 'doc'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
    viewer: 'word-viewer',
    lazyLoad: true,
    category: 'document',
    note: 'docx only',
  },
  {
    id: 'excel',
    nameKey: 'excel-file',
    defaultName: 'Excel Spreadsheet',
    extensions: ['xlsx', 'xls', 'xlsm', 'xlsb', 'csv'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
    ],
    viewer: 'excel-viewer',
    lazyLoad: true,
    category: 'document',
  },
  {
    id: 'powerpoint',
    nameKey: 'powerpoint-file',
    defaultName: 'PowerPoint Presentation',
    extensions: ['pptx', 'ppt'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
    ],
    viewer: 'powerpoint-viewer',
    lazyLoad: true,
    category: 'document',
    note: 'pptx only',
  },
  {
    id: 'rtf',
    nameKey: 'rtf-file',
    defaultName: 'Rich Text Document',
    extensions: ['rtf'],
    mimeTypes: [
      'application/rtf',
      'text/rtf',
    ],
    viewer: 'rtf-viewer',
    lazyLoad: true,
    category: 'document',
  },
  {
    id: 'opendocument',
    nameKey: 'opendocument-file',
    defaultName: 'OpenDocument File',
    extensions: ['odt', 'ods', 'odp', 'odg'],
    mimeTypes: [
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      'application/vnd.oasis.opendocument.graphics',
    ],
    viewer: 'opendocument-viewer',
    lazyLoad: true,
    category: 'document',
  },
  {
    id: 'iwork',
    nameKey: 'iwork-file',
    defaultName: 'Apple iWork Document',
    extensions: ['pages', 'numbers', 'key'],
    mimeTypes: [
      'application/vnd.apple.pages',
      'application/vnd.apple.numbers',
      'application/vnd.apple.keynote',
    ],
    viewer: 'iwork-viewer',
    lazyLoad: true,
    category: 'document',
    note: 'embedded preview',
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
    extensions: ['zip', 'rar', 'tar', 'gz', 'tar.gz', '7z', 'bz2', 'xz', 'tgz', 'lz', 'lzma', 'zst', 'cab', 'iso', 'cpio', 'ar', 'deb', 'rpm'],
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/x-compressed',
      'application/vnd.rar',
      'application/x-gzip',
      'application/x-bzip2',
      'application/x-xz',
      'application/x-lzma',
      'application/zstd',
      'application/vnd.ms-cab-compressed',
      'application/x-iso9660-image',
      'application/x-cpio',
      'application/x-debian-package',
      'application/x-rpm',
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
  {
    id: 'psd',
    nameKey: 'psd-file',
    defaultName: 'Photoshop Document',
    extensions: ['psd'],
    mimeTypes: ['image/vnd.adobe.photoshop', 'image/x-photoshop'],
    viewer: 'psd-viewer',
    lazyLoad: true,
    category: 'media',
  },
  {
    id: 'dicom',
    nameKey: 'dicom-file',
    defaultName: 'DICOM Medical Image',
    extensions: ['dcm', 'dicom', 'ima'],
    mimeTypes: ['application/dicom', 'application/dicom+json'],
    viewer: 'dicom-viewer',
    lazyLoad: true,
    category: 'media',
    note: 'uncompressed images',
  },
  
  // Fonts
  {
    id: 'font',
    nameKey: 'font-file',
    defaultName: 'Font File',
    extensions: ['ttf', 'otf', 'woff', 'woff2', 'eot'],
    mimeTypes: [
      'font/ttf',
      'font/otf',
      'font/woff',
      'font/woff2',
      'application/vnd.ms-fontobject',
      'application/x-font-ttf',
      'application/x-font-otf',
    ],
    viewer: 'font-viewer',
    lazyLoad: true,
    category: 'other',
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
  
  // Media - FFmpeg (formats not natively supported by browsers)
  {
    id: 'ffmpeg',
    nameKey: 'media-file',
    defaultName: 'Media File',
    extensions: [
      // Video
      'avi', 'mkv', 'wmv', 'flv', 'f4v',
      'ts', 'mts', 'm2ts', 'vob',
      'mpg', 'mpeg', 'm4v', '3gp', '3g2',
      'mxf', 'rm', 'rmvb', 'asf', 'divx',
      'ogv', 'swf',
      // Audio
      'wma', 'ac3', 'dts', 'ape', 'mka',
      'opus', 'amr', 'au', 'snd',
      'mid', 'midi', 'ra', 'ram',
      'aiff', 'aif', 'caf', 'tta', 'wv',
    ],
    mimeTypes: [
      // Video
      'video/x-msvideo',
      'video/x-matroska',
      'video/x-ms-wmv',
      'video/x-flv',
      'video/mp2t',
      'video/mpeg',
      'video/3gpp',
      'video/3gpp2',
      'video/x-ms-asf',
      'video/dvd',
      // Audio
      'audio/x-ms-wma',
      'audio/ac3',
      'audio/x-ape',
      'audio/x-matroska',
      'audio/opus',
      'audio/amr',
      'audio/basic',
      'audio/midi',
      'audio/x-realaudio',
      'audio/aiff',
      'audio/x-caf',
    ],
    viewer: 'ffmpeg-viewer',
    lazyLoad: true,
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
    id: 'sqlite',
    nameKey: 'sqlite-file',
    defaultName: 'SQLite Database',
    extensions: ['sqlite', 'sqlite3', 'db', 'db3'],
    mimeTypes: [
      'application/x-sqlite3',
      'application/vnd.sqlite3',
    ],
    viewer: 'sqlite-viewer',
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
  {
    id: 'parquet',
    nameKey: 'parquet-file',
    defaultName: 'Apache Parquet File',
    extensions: ['parquet'],
    mimeTypes: ['application/vnd.apache.parquet', 'application/x-parquet'],
    viewer: 'parquet-viewer',
    lazyLoad: true,
    category: 'data',
  },
  {
    id: 'notebook',
    nameKey: 'notebook-file',
    defaultName: 'Jupyter Notebook',
    extensions: ['ipynb'],
    mimeTypes: ['application/x-ipynb+json'],
    viewer: 'notebook-viewer',
    lazyLoad: true,
    category: 'data',
    note: 'read-only preview',
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
    extensions: ['msg', 'eml', 'mht', 'mhtml'],
    mimeTypes: [
      'application/vnd.ms-outlook',
      'message/rfc822',
      'message/rfc2822',
      'multipart/related',
    ],
    viewer: 'email-viewer',
    lazyLoad: true,
    category: 'other',
  },
  {
    id: 'mbox',
    nameKey: 'mbox-file',
    defaultName: 'Mailbox File',
    extensions: ['mbox'],
    mimeTypes: ['application/mbox', 'application/x-mbox'],
    viewer: 'mbox-viewer',
    lazyLoad: true,
    category: 'other',
  },
  
  // Calendar/Contacts
  {
    id: 'ical',
    nameKey: 'ical-file',
    defaultName: 'Calendar/Contact File',
    extensions: ['ics', 'vcf', 'vcard'],
    mimeTypes: [
      'text/calendar',
      'text/x-vcalendar',
      'text/vcard',
      'text/x-vcard',
    ],
    viewer: 'ical-viewer',
    lazyLoad: true,
    category: 'data',
  },
  
  // Comic Books
  {
    id: 'comic',
    nameKey: 'comic-file',
    defaultName: 'Comic Book Archive',
    extensions: ['cbz', 'cbr'],
    mimeTypes: [
      'application/vnd.comicbook+zip',
      'application/vnd.comicbook-rar',
      'application/x-cbz',
      'application/x-cbr',
    ],
    viewer: 'comic-viewer',
    lazyLoad: true,
    category: 'ebook',
  },
  
  // Log Files
  {
    id: 'log',
    nameKey: 'log-file',
    defaultName: 'Log File',
    extensions: ['log', 'logs'],
    mimeTypes: [
      'text/x-log',
      'application/x-log',
    ],
    viewer: 'log-viewer',
    lazyLoad: true,
    category: 'data',
  },
  
  // Configuration Files
  {
    id: 'config',
    nameKey: 'config-file',
    defaultName: 'Configuration File',
    extensions: ['ini', 'cfg', 'conf', 'properties', 'env', 'toml'],
    mimeTypes: [
      'text/x-ini',
      'application/x-wine-extension-ini',
      'text/x-properties',
      'application/toml',
    ],
    viewer: 'config-viewer',
    lazyLoad: true,
    category: 'data',
  },
  
  // Binary/Hex Viewer
  {
    id: 'hex',
    nameKey: 'hex-file',
    defaultName: 'Binary File',
    extensions: ['bin', 'dat', 'rom', 'img', 'exe', 'dll', 'so', 'dylib'],
    mimeTypes: [
      'application/octet-stream',
      'application/x-executable',
      'application/x-sharedlib',
    ],
    viewer: 'hex-viewer',
    lazyLoad: true,
    category: 'other',
  },
  
  // Diff/Patch Files
  {
    id: 'diff',
    nameKey: 'diff-file',
    defaultName: 'Diff/Patch File',
    extensions: ['diff', 'patch'],
    mimeTypes: [
      'text/x-diff',
      'text/x-patch',
    ],
    viewer: 'diff-viewer',
    lazyLoad: true,
    category: 'code',
  },
  
  // Certificate Files
  {
    id: 'certificate',
    nameKey: 'certificate-file',
    defaultName: 'Certificate File',
    extensions: ['pem', 'crt', 'cer', 'key', 'pub', 'csr'],
    mimeTypes: [
      'application/x-pem-file',
      'application/x-x509-ca-cert',
      'application/pkix-cert',
      'application/x-pkcs12',
    ],
    viewer: 'certificate-viewer',
    lazyLoad: true,
    category: 'other',
  },
  
  // Fiddler HTTP Session Archive
  {
    id: 'fiddler',
    nameKey: 'fiddler-file',
    defaultName: 'Fiddler Session Archive',
    extensions: ['saz'],
    mimeTypes: [
      'application/x-fiddler-session-archive',
    ],
    viewer: 'fiddler-viewer',
    lazyLoad: true,
    category: 'data',
  },
  
  // Clipboard Data
  {
    id: 'clipboard',
    nameKey: 'clipboard-file',
    defaultName: 'Clipboard Data',
    extensions: ['clipboard'],
    mimeTypes: [
      'application/x-clipboard',
    ],
    viewer: 'clipboard-viewer',
    lazyLoad: true,
    category: 'other',
  },
  
  // URL / Internet Shortcut
  {
    id: 'url',
    nameKey: 'url-file',
    defaultName: 'Internet Shortcut',
    extensions: ['url'],
    mimeTypes: [
      'application/x-url',
      'application/internet-shortcut',
    ],
    viewer: 'url-viewer',
    lazyLoad: true,
    category: 'other',
  },
  
  // Structured Data (JSON/XML tree view)
  {
    id: 'tree',
    nameKey: 'tree-file',
    defaultName: 'Structured Data File',
    extensions: ['json', 'jsonc', 'json5', 'xml', 'plist', 'svg', 'har', 'jsonl', 'ndjson'],
    mimeTypes: [
      'application/json',
      'text/xml',
      'application/xml',
      'image/svg+xml',
      'application/plist+xml',
      'application/har+json',
      'application/x-ndjson',
    ],
    viewer: 'tree-viewer',
    lazyLoad: true,
    category: 'data',
  },
  
  // Charts/Diagrams/Graphs
  {
    id: 'mermaid',
    nameKey: 'mermaid-file',
    defaultName: 'Mermaid Diagram',
    extensions: ['mmd', 'mermaid'],
    mimeTypes: [
      'text/x-mermaid',
    ],
    viewer: 'mermaid-viewer',
    lazyLoad: true,
    category: 'data',
  },
  {
    id: 'graphviz',
    nameKey: 'graphviz-file',
    defaultName: 'Graphviz Diagram',
    extensions: ['dot', 'gv'],
    mimeTypes: [
      'text/vnd.graphviz',
    ],
    viewer: 'graphviz-viewer',
    lazyLoad: true,
    category: 'data',
  },
  {
    id: 'vega',
    nameKey: 'vega-file',
    defaultName: 'Vega/Vega-Lite Chart',
    extensions: ['vg', 'vl', 'vg.json', 'vl.json'],
    mimeTypes: [
      'application/vnd.vega.v5+json',
      'application/vnd.vegalite.v5+json',
    ],
    viewer: 'vega-viewer',
    lazyLoad: true,
    category: 'data',
  },
  {
    id: 'drawio',
    nameKey: 'drawio-file',
    defaultName: 'Draw.io Diagram',
    extensions: ['drawio', 'drawio.xml'],
    mimeTypes: [
      'application/vnd.jgraph.mxfile',
    ],
    viewer: 'drawio-viewer',
    lazyLoad: true,
    category: 'data',
  },
  {
    id: 'excalidraw',
    nameKey: 'excalidraw-file',
    defaultName: 'Excalidraw Diagram',
    extensions: ['excalidraw'],
    mimeTypes: [
      'application/vnd.excalidraw+json',
    ],
    viewer: 'excalidraw-viewer',
    lazyLoad: true,
    category: 'data',
  },
  {
    id: 'geojson',
    nameKey: 'geojson-file',
    defaultName: 'GeoJSON Map',
    extensions: ['geojson'],
    mimeTypes: [
      'application/geo+json',
    ],
    viewer: 'geojson-viewer',
    lazyLoad: true,
    category: 'data',
  },
  {
    id: 'plantuml',
    nameKey: 'plantuml-file',
    defaultName: 'PlantUML Diagram',
    extensions: ['puml', 'plantuml', 'pu'],
    mimeTypes: [
      'text/x-plantuml',
    ],
    viewer: 'plantuml-viewer',
    lazyLoad: true,
    category: 'data',
  },
  
  // Code/Source Files
  {
    id: 'markdown',
    nameKey: 'markdown-file',
    defaultName: 'Markdown Document',
    extensions: ['md', 'markdown', 'mdx'],
    mimeTypes: ['text/markdown', 'text/x-markdown'],
    viewer: 'markdown-viewer',
    lazyLoad: true,
    category: 'document',
  },
  {
    id: 'subtitle',
    nameKey: 'subtitle-file',
    defaultName: 'Subtitle File',
    extensions: ['srt', 'vtt', 'ass', 'ssa'],
    mimeTypes: [
      'application/x-subrip',
      'text/vtt',
      'text/x-ssa',
      'text/x-ass',
    ],
    viewer: 'subtitle-viewer',
    lazyLoad: true,
    category: 'media',
  },
  {
    id: 'code',
    nameKey: 'code-file',
    defaultName: 'Source Code',
    extensions: [
      // JavaScript/TypeScript
      'js', 'mjs', 'cjs', 'jsx',
      'ts', 'tsx', 'mts', 'cts',
      // Web
      'html', 'htm',
      'css', 'scss', 'sass', 'less',
      // Programming languages
      'py', 'pyw',
      'java',
      'c', 'h', 'cpp', 'cc', 'cxx', 'hpp', 'hxx',
      'cs',
      'go',
      'rs',
      'rb',
      'php',
      'swift',
      'kt', 'kts',
      'scala',
      'r',
      'lua',
      'pl', 'pm',
      // Shell/Scripts
      'sh', 'bash', 'zsh', 'fish',
      'ps1', 'psm1',
      'bat', 'cmd',
      // Query languages
      'sql',
      'graphql', 'gql',
      // Plain text
      'txt', 'text',
    ],
    mimeTypes: [
      'text/javascript',
      'application/javascript',
      'text/typescript',
      'text/html',
      'text/css',
      'text/x-python',
      'text/x-java-source',
      'text/x-c',
      'text/x-c++',
      'text/x-csharp',
      'text/x-go',
      'text/x-rust',
      'text/x-ruby',
      'text/x-php',
      'text/x-swift',
      'text/x-kotlin',
      'text/x-scala',
      'text/x-lua',
      'text/x-perl',
      'text/x-sh',
      'text/x-sql',
      'text/plain',
    ],
    viewer: 'code-viewer',
    lazyLoad: true,
    category: 'code',
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

export interface FileCleanupMessage {
  fileId: string;
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}

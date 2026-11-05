export type FileType = 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'TXT' | 'ZIP';

/** Backend response shape for a file */
export interface ApiFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedBy: string; // user ID string from backend
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** Frontend display shape */
export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  type: FileType;
  mimeType: string;
  size: number; // in bytes
  uploadedBy: string;    // display name or ID
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  isProtected: boolean;
  // mock-only fields kept for compatibility with existing viewers:
  mockPassword?: string;
  description?: string;
  pageCount?: number;
  sampleContent?: string[];
}

/** Maps a backend file object to the frontend FileItem shape */
export function mapApiFile(apiFile: ApiFile): FileItem {
  const type = mimeTypeToFileType(apiFile.mimeType, apiFile.name);
  return {
    id: apiFile.id,
    name: apiFile.name,
    originalName: apiFile.name,
    type,
    mimeType: apiFile.mimeType,
    size: apiFile.size,
    uploadedBy: apiFile.uploader?.name || apiFile.uploadedBy,
    uploadedById: apiFile.uploadedBy,
    createdAt: apiFile.createdAt,
    updatedAt: apiFile.updatedAt,
    isProtected: true,
  };
}

function mimeTypeToFileType(mimeType: string, name?: string): FileType {
  if (name && name.toLowerCase().endsWith('.zip')) return 'ZIP';
  if (!mimeType) return 'PDF';
  const m = mimeType.toLowerCase();
  if (m.includes('zip') || m.includes('compressed') || m.includes('archive')) return 'ZIP';
  if (m.includes('pdf')) return 'PDF';
  if (m.includes('wordprocessingml') || m.includes('msword') || m.includes('docx')) return 'DOCX';
  if (m.includes('spreadsheetml') || m.includes('excel') || m.includes('xlsx')) return 'XLSX';
  if (m.includes('presentationml') || m.includes('powerpoint') || m.includes('pptx')) return 'PPTX';
  if (m.includes('text')) return 'TXT';
  return 'PDF';
}

export type FileSortField = 'name' | 'size' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

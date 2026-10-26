export type FileType = 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'TXT' | 'ZIP';

export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  type: FileType;
  size: number; // in bytes
  uploadedBy: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  mockPassword?: string;
  description?: string;
  pageCount?: number;
  isProtected: boolean;
  sampleContent?: string[];
}

export type FileSortField = 'name' | 'size' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

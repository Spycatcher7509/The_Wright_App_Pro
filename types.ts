
export type UserRole = 'SUPER_ADMIN' | 'LOCAL_ADMIN' | 'STANDARD';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isFirstLogin: boolean;
  avatar?: string;
  name?: string;
}

export type ExportFormat = 'pdf' | 'md' | 'html' | 'text' | 'json';
export type MediaFormat = 'm4a' | 'mp3' | 'av1' | 'mp4';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  hash: string;
  file?: {
    name: string;
    size: number;
    type: string;
    data: string; // Base64
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  title: string;
  checksum: string;
  absolutePath: string;
  errorMessage?: string;
  status: 'SUCCESS' | 'FAILURE';
}

export interface Ticket {
  id: string;
  timestamp: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'CLOSED';
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  description: string;
  path: string;
  type: 'BACKUP' | 'RESTORE';
}

// Global declaration for the AI Studio bridge
declare global {
  // Defining AIStudio interface to resolve type mismatch with existing global definitions
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}


export type UserRole = 'ADMIN' | 'STANDARD' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isFirstLogin: boolean;
  avatar?: string; // Base64 or URL
  name?: string;
}

export type ExportFormat = 'pdf' | 'md' | 'html' | 'text' | 'json';
export type MediaFormat = 'm4a' | 'mp3' | 'av1' | 'mp4';

export interface LogEntry {
  id: string;
  timestamp: string; // GBFormat
  title: string;
  checksum: string;
  absolutePath: string;
  errorMessage?: string;
  status: 'SUCCESS' | 'FAILURE';
}

export interface Ticket {
  id: string; // Alphanumerical sequential e.g. TKT-001
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

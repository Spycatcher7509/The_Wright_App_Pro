
import { LogEntry, Ticket, BackupRecord, User } from '../types';
import { GB_DATE_OPTIONS } from '../constants';

const STORAGE_KEYS = {
  LOGS: 'wright_logs_db',
  TICKETS: 'wright_tickets_db',
  BACKUPS: 'wright_backups_db',
  USERS: 'wright_users_db'
};

export class DBService {
  private static getNow(): string {
    return new Date().toLocaleString('en-GB', GB_DATE_OPTIONS);
  }

  // --- LOGS ---
  static async getLogs(): Promise<LogEntry[]> {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  }

  static async addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logs = await this.getLogs();
    const newEntry: LogEntry = {
      ...entry,
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase(),
      timestamp: this.getNow()
    };
    logs.push(newEntry);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  // --- TICKETS ---
  static async getTickets(): Promise<Ticket[]> {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  }

  static async createTicket(subject: string, description: string): Promise<Ticket> {
    const tickets = await this.getTickets();
    const nextIdNumber = tickets.length + 1;
    const nextId = `WAP-TKT-${nextIdNumber.toString().padStart(4, '0')}`;
    
    const newTicket: Ticket = {
      id: nextId,
      timestamp: this.getNow(),
      subject,
      description,
      status: 'OPEN'
    };
    
    tickets.push(newTicket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    return newTicket;
  }

  // --- BACKUPS ---
  static async getBackups(): Promise<BackupRecord[]> {
    const data = localStorage.getItem(STORAGE_KEYS.BACKUPS);
    return data ? JSON.parse(data) : [];
  }

  static async recordBackup(description: string, path: string, type: 'BACKUP' | 'RESTORE'): Promise<void> {
    const backups = await this.getBackups();
    const newRecord: BackupRecord = {
      id: `BK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      timestamp: this.getNow(),
      description,
      path,
      type
    };
    backups.push(newRecord);
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
  }

  // --- USERS (Admin Control) ---
  static async getUsers(): Promise<User[]> {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      const seedAdmin: User = {
        id: 'super-admin-0',
        email: 'accounts@thewrightsupport.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        isFirstLogin: false,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WrightSupport'
      };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([seedAdmin]));
      return [seedAdmin];
    }
    return JSON.parse(data);
  }

  static async saveUser(user: User): Promise<void> {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: User[] = data ? JSON.parse(data) : [];
    
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static async deleteUser(id: string): Promise<void> {
    const users = await this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  }

  static async verifyChecksum(checksum: string): Promise<boolean> {
    const logs = await this.getLogs();
    return logs.some(l => l.checksum === checksum && l.status === 'SUCCESS');
  }
}

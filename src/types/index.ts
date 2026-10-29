export interface Student {
  id: string; // UUID
  primaryKey: string; // e.g. "KIQS-86-000001"
  fullName: string;
  fatherName: string;
  photoUrl?: string;
  class: string;
  section: string;
  rollNumber: string;
  admissionNumber: string;
  guardianContact: string;
  whatsappNumber?: string;
  dateOfBirth?: string;
  address?: string;
  admissionDate: string;
  enrollmentStatus: 'active' | 'archived' | 'graduated';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QRCredential {
  id: string; // UUID
  studentId: string;
  primaryKey: string;
  token: string; // Opaque format: KIQS1:<token>
  status: 'active' | 'revoked';
  issuedAt: string;
  revokedAt?: string;
  version: number;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'EXCUSED' | 'HOLIDAY';
export type AttendanceMethod = 'QR_SCAN' | 'MANUAL_KEY' | 'AUTHORIZED_CORRECTION';

export interface AttendanceRecord {
  id: string; // UUID
  studentId: string;
  primaryKey: string;
  studentName: string;
  studentClass: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  timeFormatted: string; // e.g. "08:12 AM"
  status: AttendanceStatus;
  method: AttendanceMethod;
  sessionId: string; // e.g. "morning-session"
  operator: string;
  correctionReason?: string;
  photoUrl?: string;
}

export interface AttendanceSettings {
  schoolName: string;
  branchName: string;
  campusName: string;
  address: string;
  phoneCall: string;
  phoneWhatsapp: string;
  schoolStartTime: string; // "08:00"
  lateGraceMinutes: number; // 15
  cutoffTime: string; // "11:00"
  workingDays: number[]; // [1,2,3,4,5,6] (Mon-Sat)
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  continuousScan: boolean;
  photoConfirmation: boolean;
  activeSession: string; // "Morning Session"
}

export interface UserAccount {
  name: string;
  pin: string;
  role: 'ADMIN' | 'OPERATOR' | 'TEACHER';
  isSetupComplete: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

export interface BackupData {
  version: string;
  exportDate: string;
  school: string;
  branch: string;
  students: Student[];
  credentials: QRCredential[];
  attendance: AttendanceRecord[];
  settings: AttendanceSettings;
  auditLogs: AuditLog[];
  checksum: string;
}

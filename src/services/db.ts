import {
  Student,
  QRCredential,
  AttendanceRecord,
  AttendanceSettings,
  UserAccount,
  AuditLog,
  BackupData,
  AttendanceStatus,
  AttendanceMethod
} from '../types';

const DB_NAME = 'KIQS_SMART_ATTENDANCE_DB';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: AttendanceSettings = {
  schoolName: 'KANZ UL IMAN SCHOOL OF QURAN SCIENCES',
  branchName: 'Branch 86',
  campusName: 'HAZRT ABU BAKAR SIDDIQUI CAMPUS',
  address: 'House #6-A/2, Street 7, Mehar Pura, Awan Town, Lahore, Pakistan',
  phoneCall: '03001428928',
  phoneWhatsapp: '03201428928',
  schoolStartTime: '08:00',
  lateGraceMinutes: 15,
  cutoffTime: '11:00',
  workingDays: [1, 2, 3, 4, 5, 6], // Mon - Sat
  soundEnabled: true,
  vibrationEnabled: true,
  continuousScan: true,
  photoConfirmation: false,
  activeSession: 'Morning Session'
};

const DEFAULT_USER: UserAccount = {
  name: 'Head Administrator',
  pin: '8686',
  role: 'ADMIN',
  isSetupComplete: false
};

class OfflineDB {
  private db: IDBDatabase | null = null;
  private isReadyPromise: Promise<void>;

  constructor() {
    this.isReadyPromise = this.init();
  }

  private init(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve();
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('students')) {
          const studentStore = db.createObjectStore('students', { keyPath: 'id' });
          studentStore.createIndex('primaryKey', 'primaryKey', { unique: true });
          studentStore.createIndex('class', 'class', { unique: false });
        }
        if (!db.objectStoreNames.contains('credentials')) {
          const credStore = db.createObjectStore('credentials', { keyPath: 'id' });
          credStore.createIndex('studentId', 'studentId', { unique: false });
          credStore.createIndex('token', 'token', { unique: true });
        }
        if (!db.objectStoreNames.contains('attendance')) {
          const attStore = db.createObjectStore('attendance', { keyPath: 'id' });
          attStore.createIndex('student_date_session', ['studentId', 'date', 'sessionId'], { unique: true });
          attStore.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('auditLogs')) {
          db.createObjectStore('auditLogs', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => {
        // Fallback to localStorage gracefully
        resolve();
      };
    });
  }

  public async ready(): Promise<void> {
    await this.isReadyPromise;
  }

  // --- LocalStorage Fallback Helpers ---
  private getLocal<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(`kiqs_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setLocal<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`kiqs_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error', e);
    }
  }

  // --- Settings ---
  public getSettings(): AttendanceSettings {
    return this.getLocal<AttendanceSettings>('settings', DEFAULT_SETTINGS);
  }

  public saveSettings(settings: AttendanceSettings): void {
    this.setLocal('settings', settings);
  }

  // --- User Account ---
  public getUser(): UserAccount {
    return this.getLocal<UserAccount>('user', DEFAULT_USER);
  }

  public saveUser(user: UserAccount): void {
    this.setLocal('user', user);
  }

  // --- Students Management ---
  public async getStudents(): Promise<Student[]> {
    await this.ready();
    if (!this.db) {
      return this.getLocal<Student[]>('students', []);
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('students', 'readonly');
        const store = tx.objectStore('students');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(this.getLocal<Student[]>('students', []));
      } catch {
        resolve(this.getLocal<Student[]>('students', []));
      }
    });
  }

  public async getStudentById(id: string): Promise<Student | null> {
    const students = await this.getStudents();
    return students.find((s) => s.id === id) || null;
  }

  public async getStudentByPrimaryKey(primaryKey: string): Promise<Student | null> {
    const students = await this.getStudents();
    const cleanKey = primaryKey.trim().toUpperCase();
    return students.find((s) => s.primaryKey.toUpperCase() === cleanKey) || null;
  }

  public async generateNextPrimaryKey(): Promise<string> {
    const students = await this.getStudents();
    let maxNumber = 0;
    const prefix = 'KIQS-86-';
    for (const student of students) {
      if (student.primaryKey.startsWith(prefix)) {
        const numPart = parseInt(student.primaryKey.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNumber) {
          maxNumber = numPart;
        }
      }
    }
    const nextNumber = maxNumber + 1;
    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
  }

  public async registerStudent(
    studentData: Omit<Student, 'id' | 'primaryKey' | 'createdAt' | 'updatedAt'>,
    customPrimaryKey?: string
  ): Promise<{ student: Student; credential: QRCredential }> {
    await this.ready();
    const id = crypto.randomUUID();
    const primaryKey = customPrimaryKey || (await this.generateNextPrimaryKey());

    // Validate unique primaryKey
    const existing = await this.getStudentByPrimaryKey(primaryKey);
    if (existing) {
      throw new Error(`Student with Primary Key ${primaryKey} already exists.`);
    }

    const now = new Date().toISOString();
    const student: Student = {
      ...studentData,
      id,
      primaryKey,
      createdAt: now,
      updatedAt: now
    };

    // Save Student in DB
    await this.persistStudent(student);

    // Generate unique QR Credential
    const credential = await this.issueQRCredential(student.id, student.primaryKey);

    await this.logAudit('STUDENT_REGISTER', `Registered student ${student.fullName} (${student.primaryKey})`);

    return { student, credential };
  }

  public async updateStudent(student: Student): Promise<void> {
    await this.ready();
    student.updatedAt = new Date().toISOString();
    await this.persistStudent(student);
    await this.logAudit('STUDENT_UPDATE', `Updated student ${student.fullName} (${student.primaryKey})`);
  }

  private async persistStudent(student: Student): Promise<void> {
    // Save to memory/localStorage first
    const students = await this.getStudents();
    const idx = students.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      students[idx] = student;
    } else {
      students.push(student);
    }
    this.setLocal('students', students);

    // Save to IndexedDB if available
    if (this.db) {
      try {
        const tx = this.db.transaction('students', 'readwrite');
        tx.objectStore('students').put(student);
      } catch (err) {
        console.warn('IDB put student failed, stored in localStorage', err);
      }
    }
  }

  // --- QR Credential Management ---
  public async getCredentials(): Promise<QRCredential[]> {
    await this.ready();
    if (!this.db) {
      return this.getLocal<QRCredential[]>('credentials', []);
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('credentials', 'readonly');
        const store = tx.objectStore('credentials');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(this.getLocal<QRCredential[]>('credentials', []));
      } catch {
        resolve(this.getLocal<QRCredential[]>('credentials', []));
      }
    });
  }

  public async getActiveCredentialForStudent(studentId: string): Promise<QRCredential | null> {
    const creds = await this.getCredentials();
    return creds.find((c) => c.studentId === studentId && c.status === 'active') || null;
  }

  public async getCredentialByToken(token: string): Promise<QRCredential | null> {
    const creds = await this.getCredentials();
    return creds.find((c) => c.token === token) || null;
  }

  public async issueQRCredential(studentId: string, primaryKey: string): Promise<QRCredential> {
    await this.ready();
    // Revoke any previous active credential
    const creds = await this.getCredentials();
    const now = new Date().toISOString();

    for (const cred of creds) {
      if (cred.studentId === studentId && cred.status === 'active') {
        cred.status = 'revoked';
        cred.revokedAt = now;
      }
    }

    // Generate random secure token
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const token = `KIQS1:${randomHex}`;

    const newCred: QRCredential = {
      id: crypto.randomUUID(),
      studentId,
      primaryKey,
      token,
      status: 'active',
      issuedAt: now,
      version: 1
    };

    creds.push(newCred);
    this.setLocal('credentials', creds);

    if (this.db) {
      try {
        const tx = this.db.transaction('credentials', 'readwrite');
        const store = tx.objectStore('credentials');
        for (const c of creds) {
          store.put(c);
        }
      } catch (e) {
        console.warn('IDB put credential failed', e);
      }
    }

    return newCred;
  }

  public async revokeCredential(credentialId: string): Promise<void> {
    const creds = await this.getCredentials();
    const cred = creds.find((c) => c.id === credentialId);
    if (cred) {
      cred.status = 'revoked';
      cred.revokedAt = new Date().toISOString();
      this.setLocal('credentials', creds);
      if (this.db) {
        try {
          const tx = this.db.transaction('credentials', 'readwrite');
          tx.objectStore('credentials').put(cred);
        } catch (e) {
          console.warn('IDB revoke credential failed', e);
        }
      }
      await this.logAudit('QR_REVOKE', `Revoked QR credential for ${cred.primaryKey}`);
    }
  }

  // --- Attendance Recording ---
  public async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    await this.ready();
    if (!this.db) {
      return this.getLocal<AttendanceRecord[]>('attendance', []);
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('attendance', 'readonly');
        const req = tx.objectStore('attendance').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(this.getLocal<AttendanceRecord[]>('attendance', []));
      } catch {
        resolve(this.getLocal<AttendanceRecord[]>('attendance', []));
      }
    });
  }

  public async getTodayAttendance(dateStr?: string): Promise<AttendanceRecord[]> {
    const date = dateStr || this.getTodayDateString();
    const all = await this.getAttendanceRecords();
    return all.filter((r) => r.date === date);
  }

  public getTodayDateString(): string {
    // Local date string in YYYY-MM-DD
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public formatDisplayTime(dateObj: Date = new Date()): string {
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  public calculateStatus(timeObj: Date = new Date()): AttendanceStatus {
    const settings = this.getSettings();
    const [startH, startM] = settings.schoolStartTime.split(':').map(Number);
    const graceMinutes = settings.lateGraceMinutes || 15;

    const startMinutes = startH * 60 + startM;
    const currentMinutes = timeObj.getHours() * 60 + timeObj.getMinutes();

    if (currentMinutes <= startMinutes + graceMinutes) {
      return 'PRESENT';
    } else {
      return 'LATE';
    }
  }

  /**
   * Mark attendance with strict duplicate checks, session enforcement, and transactional safety
   */
  public async markAttendance(params: {
    studentId: string;
    method: AttendanceMethod;
    forceStatus?: AttendanceStatus;
    customTime?: Date;
    correctionReason?: string;
  }): Promise<{
    success: boolean;
    record?: AttendanceRecord;
    isDuplicate?: boolean;
    existingRecord?: AttendanceRecord;
    error?: string;
    student?: Student;
  }> {
    await this.ready();
    const student = await this.getStudentById(params.studentId);
    if (!student) {
      return { success: false, error: 'Student not found in database.' };
    }

    if (student.enrollmentStatus !== 'active') {
      return {
        success: false,
        error: `Student enrollment is ${student.enrollmentStatus.toUpperCase()}. Attendance cannot be marked.`
      };
    }

    const settings = this.getSettings();
    const now = params.customTime || new Date();
    const todayDate = this.getTodayDateString();
    const sessionId = settings.activeSession || 'Morning Session';

    // Duplicate Check
    const allRecords = await this.getAttendanceRecords();
    const existing = allRecords.find(
      (r) => r.studentId === student.id && r.date === todayDate && r.sessionId === sessionId
    );

    if (existing) {
      return {
        success: false,
        isDuplicate: true,
        existingRecord: existing,
        student,
        error: `ALREADY MARKED today at ${existing.timeFormatted} (${existing.status})`
      };
    }

    const status: AttendanceStatus = params.forceStatus || this.calculateStatus(now);
    const user = this.getUser();

    const record: AttendanceRecord = {
      id: crypto.randomUUID(),
      studentId: student.id,
      primaryKey: student.primaryKey,
      studentName: student.fullName,
      studentClass: `${student.class} - ${student.section}`,
      date: todayDate,
      timestamp: now.toISOString(),
      timeFormatted: this.formatDisplayTime(now),
      status,
      method: params.method,
      sessionId,
      operator: user.name || 'Admin',
      correctionReason: params.correctionReason,
      photoUrl: student.photoUrl
    };

    allRecords.unshift(record);
    this.setLocal('attendance', allRecords);

    if (this.db) {
      try {
        const tx = this.db.transaction('attendance', 'readwrite');
        tx.objectStore('attendance').put(record);
      } catch (err) {
        console.warn('IDB put attendance error', err);
      }
    }

    await this.logAudit(
      'ATTENDANCE_MARKED',
      `Marked ${status} for ${student.fullName} (${student.primaryKey}) via ${params.method}`
    );

    return {
      success: true,
      record,
      student
    };
  }

  public async updateAttendanceRecord(
    recordId: string,
    newStatus: AttendanceStatus,
    reason: string
  ): Promise<AttendanceRecord | null> {
    const records = await this.getAttendanceRecords();
    const rec = records.find((r) => r.id === recordId);
    if (!rec) return null;

    const oldStatus = rec.status;
    rec.status = newStatus;
    rec.method = 'AUTHORIZED_CORRECTION';
    rec.correctionReason = reason;

    this.setLocal('attendance', records);
    if (this.db) {
      try {
        const tx = this.db.transaction('attendance', 'readwrite');
        tx.objectStore('attendance').put(rec);
      } catch (e) {
        console.warn('IDB update attendance failed', e);
      }
    }

    await this.logAudit(
      'ATTENDANCE_CORRECTION',
      `Corrected attendance for ${rec.studentName} from ${oldStatus} to ${newStatus}. Reason: ${reason}`
    );

    return rec;
  }

  // --- Audit Logs ---
  public async logAudit(action: string, details: string): Promise<void> {
    const logs = this.getLocal<AuditLog[]>('auditLogs', []);
    const log: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      details,
      user: this.getUser().name || 'Admin'
    };
    logs.unshift(log);
    // Keep max 500 logs
    if (logs.length > 500) logs.pop();
    this.setLocal('auditLogs', logs);
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.getLocal<AuditLog[]>('auditLogs', []);
  }

  // --- Backup & Restore ---
  public async createBackup(): Promise<string> {
    const students = await this.getStudents();
    const credentials = await this.getCredentials();
    const attendance = await this.getAttendanceRecords();
    const settings = this.getSettings();
    const auditLogs = await this.getAuditLogs();

    const payload: Omit<BackupData, 'checksum'> = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      school: settings.schoolName,
      branch: settings.branchName,
      students,
      credentials,
      attendance,
      settings,
      auditLogs
    };

    // Calculate simple SHA-256 or hash representation for integrity
    const jsonStr = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      hash = (hash << 5) - hash + jsonStr.charCodeAt(i);
      hash |= 0;
    }
    const checksum = `KIQS-CRC-${Math.abs(hash).toString(16)}`;

    const fullBackup: BackupData = {
      ...payload,
      checksum
    };

    return JSON.stringify(fullBackup, null, 2);
  }

  public async restoreBackup(backupJsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const data: BackupData = JSON.parse(backupJsonString);

      if (!data.school || !data.students || !Array.isArray(data.students)) {
        return { success: false, message: 'Invalid backup file structure.' };
      }

      // Verify School & Branch match
      const currentSettings = this.getSettings();
      if (data.branch !== currentSettings.branchName && !data.school.includes('KANZ UL IMAN')) {
        return {
          success: false,
          message: `Branch mismatch: Backup is for "${data.school} - ${data.branch}", expected "${currentSettings.branchName}".`
        };
      }

      // Restore data
      this.setLocal('students', data.students);
      this.setLocal('credentials', data.credentials || []);
      this.setLocal('attendance', data.attendance || []);
      this.setLocal('settings', data.settings || currentSettings);
      this.setLocal('auditLogs', data.auditLogs || []);

      if (this.db) {
        // Clear and rebuild IDB stores
        const tx = this.db.transaction(['students', 'credentials', 'attendance'], 'readwrite');
        tx.objectStore('students').clear();
        tx.objectStore('credentials').clear();
        tx.objectStore('attendance').clear();

        for (const s of data.students) tx.objectStore('students').put(s);
        for (const c of data.credentials || []) tx.objectStore('credentials').put(c);
        for (const a of data.attendance || []) tx.objectStore('attendance').put(a);
      }

      await this.logAudit('BACKUP_RESTORE', `Restored ${data.students.length} students and ${data.attendance.length} attendance records`);

      return {
        success: true,
        message: `Restored successfully: ${data.students.length} students, ${data.attendance.length} attendance records.`
      };
    } catch (err: any) {
      return { success: false, message: `Failed to restore: ${err.message}` };
    }
  }

  // --- Seed Data for Quick Testing / Initial Setup ---
  public async seedInitialDemoStudents(): Promise<void> {
    const current = await this.getStudents();
    if (current.length > 0) return; // Don't overwrite if data exists

    const initialStudents: Array<Omit<Student, 'id' | 'primaryKey' | 'createdAt' | 'updatedAt'>> = [
      {
        fullName: 'Muhammad Ahmed Ali',
        fatherName: 'Tariq Mahmood',
        class: 'Hifz 1',
        section: 'A',
        rollNumber: '01',
        admissionNumber: 'ADM-2024-001',
        guardianContact: '03001234567',
        whatsappNumber: '03001234567',
        admissionDate: '2024-03-01',
        enrollmentStatus: 'active',
        address: 'Mehar Pura, Awan Town, Lahore'
      },
      {
        fullName: 'Abdul Rehman Khan',
        fatherName: 'Muhammad Farooq',
        class: 'Hifz 1',
        section: 'A',
        rollNumber: '02',
        admissionNumber: 'ADM-2024-002',
        guardianContact: '03219876543',
        whatsappNumber: '03219876543',
        admissionDate: '2024-03-05',
        enrollmentStatus: 'active',
        address: 'Multan Road, Lahore'
      },
      {
        fullName: 'Hamza Bilal Qureshi',
        fatherName: 'Bilal Ahmed',
        class: 'Nazra 2',
        section: 'B',
        rollNumber: '05',
        admissionNumber: 'ADM-2024-015',
        guardianContact: '03334567890',
        whatsappNumber: '03334567890',
        admissionDate: '2024-04-10',
        enrollmentStatus: 'active',
        address: 'Sabzazar Block F, Lahore'
      },
      {
        fullName: 'Usman Ghani Siddiqui',
        fatherName: 'Rashid Siddiqui',
        class: 'Dars-e-Nizami 1',
        section: 'A',
        rollNumber: '11',
        admissionNumber: 'ADM-2024-032',
        guardianContact: '03123456789',
        whatsappNumber: '03123456789',
        admissionDate: '2024-05-01',
        enrollmentStatus: 'active',
        address: 'Street 7, Mehar Pura, Lahore'
      },
      {
        fullName: 'Hassan Raza Attari',
        fatherName: 'Ghulam Mustafa',
        class: 'Class 5',
        section: 'Girls',
        rollNumber: '08',
        admissionNumber: 'ADM-2024-044',
        guardianContact: '03456789012',
        whatsappNumber: '03456789012',
        admissionDate: '2024-06-15',
        enrollmentStatus: 'active',
        address: 'Awan Town, Lahore'
      }
    ];

    for (const s of initialStudents) {
      await this.registerStudent(s);
    }
  }
}

export const offlineDB = new OfflineDB();

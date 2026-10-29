import React, { useState, useEffect } from 'react';
import { offlineDB, DEFAULT_SETTINGS } from '../services/db';
import { AttendanceSettings, UserAccount } from '../types';
import {
  Settings as SettingsIcon,
  Clock,
  Volume2,
  Database,
  Shield,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Laptop
} from 'lucide-react';

interface SettingsViewProps {
  onLanguageToggle?: () => void;
  isUrdu?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onLanguageToggle,
  isUrdu
}) => {
  const [settings, setSettings] = useState<AttendanceSettings>(DEFAULT_SETTINGS);
  const [user, setUser] = useState<UserAccount>(offlineDB.getUser());
  const [pinInput, setPinInput] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [backupRestoreMessage, setBackupRestoreMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'SCHOOL' | 'DATA' | 'WINDOWS' | 'SECURITY'>('ATTENDANCE');

  useEffect(() => {
    setSettings(offlineDB.getSettings());
    setUser(offlineDB.getUser());
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    offlineDB.saveSettings(settings);
    setSaveMessage('Settings saved successfully.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleUpdatePin = () => {
    if (!pinInput.trim() || pinInput.length < 4) {
      alert('PIN must be at least 4 digits');
      return;
    }
    const updated = { ...user, pin: pinInput.trim() };
    offlineDB.saveUser(updated);
    setUser(updated);
    setPinInput('');
    alert('Security PIN updated successfully');
  };

  const handleDownloadBackup = async () => {
    const backupJson = await offlineDB.createBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KIQS_Branch86_Backup_${offlineDB.getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupRestoreMessage('Backup snapshot exported successfully.');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await offlineDB.restoreBackup(content);
      if (res.success) {
        setBackupRestoreMessage(`Restore Successful: ${res.message}`);
        setSettings(offlineDB.getSettings());
      } else {
        setBackupRestoreMessage(`Restore Failed: ${res.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSeedInitialDemoData = async () => {
    await offlineDB.seedInitialDemoStudents();
    alert('Initial sample students loaded for testing.');
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      {/* Settings Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'ATTENDANCE'
              ? 'bg-[#12365A] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock size={15} />
          Attendance Rules
        </button>
        <button
          onClick={() => setActiveTab('DATA')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'DATA'
              ? 'bg-[#12365A] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database size={15} />
          Backup & Restore
        </button>
        <button
          onClick={() => setActiveTab('WINDOWS')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'WINDOWS'
              ? 'bg-[#12365A] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Laptop size={15} />
          Windows Integration
        </button>
        <button
          onClick={() => setActiveTab('SCHOOL')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'SCHOOL'
              ? 'bg-[#12365A] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 size={15} />
          School Identity
        </button>
        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'SECURITY'
              ? 'bg-[#12365A] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Shield size={15} />
          Security & PIN
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* 1. Attendance Rules Form */}
      {activeTab === 'ATTENDANCE' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-[#12365A]">Attendance Timing & Session Rules</h3>
            <p className="text-xs text-slate-500">
              Configure school arrival timings, grace periods for late status, and hardware feedback
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Start Time
              </label>
              <input
                type="time"
                value={settings.schoolStartTime}
                onChange={(e) => setSettings({ ...settings, schoolStartTime: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B] font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 08:00 AM</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Late Grace Period (Minutes)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={settings.lateGraceMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, lateGraceMinutes: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B] font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Up to {settings.lateGraceMinutes}m after start = PRESENT, after = LATE
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Session
              </label>
              <select
                value={settings.activeSession}
                onChange={(e) => setSettings({ ...settings, activeSession: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B] font-semibold"
              >
                <option value="Morning Session">Morning Session</option>
                <option value="Evening Session">Evening Session</option>
                <option value="Special Exam Session">Special Exam Session</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Prevents duplicate scans per session
              </span>
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Feedback & Scanner Behavior
            </h4>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-xs font-bold text-[#18283B] block">Audio Synthesizer Chime</span>
                <span className="text-[11px] text-slate-500">
                  Plays success chime, duplicate buzz, or invalid error tone
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                className="w-4 h-4 text-[#12365A] rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-xs font-bold text-[#18283B]">Haptic Vibration</span>
                <span className="text-[11px] text-slate-500 block">
                  Triggers mobile vibration pulse on confirmed scans
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => setSettings({ ...settings, vibrationEnabled: e.target.checked })}
                className="w-4 h-4 text-[#12365A] rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-xs font-bold text-[#18283B]">Continuous Scanning Mode</span>
                <span className="text-[11px] text-slate-500 block">
                  Keeps camera running smoothly between successive students with auto-debounce
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.continuousScan}
                onChange={(e) => setSettings({ ...settings, continuousScan: e.target.checked })}
                className="w-4 h-4 text-[#12365A] rounded"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#12365A] hover:bg-[#086B9B] text-white text-xs font-bold rounded-xl transition shadow"
            >
              Save Attendance Rules
            </button>
          </div>
        </form>
      )}

      {/* 2. Backup & Restore */}
      {activeTab === 'DATA' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-[#12365A]">Local Offline Backup & Snapshot Recovery</h3>
            <p className="text-xs text-slate-500">
              Save complete student registry, QR tokens, and historical attendance logs safely to disk
            </p>
          </div>

          {backupRestoreMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold rounded-xl">
              {backupRestoreMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#12365A] mb-1">Create Full Database Backup</h4>
                <p className="text-xs text-slate-500">
                  Exports a verified JSON snapshot with SHA-256 integrity checksum. Suitable for storage on
                  USB flash drive, SD card, or email transfer.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-[#12365A] hover:bg-[#086B9B] text-white text-xs font-bold rounded-xl transition"
              >
                <Download size={15} />
                Download Backup File (.json)
              </button>
            </div>

            <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#12365A] mb-1">Restore from Backup</h4>
                <p className="text-xs text-slate-500">
                  Restores students and attendance history after verifying school name and branch integrity.
                </p>
              </div>
              <label className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition">
                <Upload size={15} />
                Select Backup File to Restore
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Diagnostic Data Management</h4>
            <button
              onClick={handleSeedInitialDemoData}
              className="text-xs text-[#086B9B] font-bold hover:underline"
            >
              Load 5 Initial Sample Students for Testing
            </button>
          </div>
        </div>
      )}

      {/* 3. Windows Integration */}
      {activeTab === 'WINDOWS' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-[#12365A]">
              KIQS Windows School Management Software Integration Contract
            </h3>
            <p className="text-xs text-slate-500">
              Bi-directional offline data exchange specification between Android devices and desktop software
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-[#12365A] mb-1">Method 1 — Standard File Import / Export</h4>
              <p className="text-slate-600 mb-2">
                Export daily attendance in standardized CSV / JSON formats for instant import into the Windows
                School Management Software.
              </p>
              <div className="font-mono text-[11px] bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto">
{`// Attendance CSV Standard Format
Primary Key, Student Name, Class, Status, Time, Method, Date
KIQS-86-000001, "Muhammad Ahmed Ali", "Hifz 1", PRESENT, 08:02 AM, QR_SCAN, 2026-10-29`}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-[#12365A] mb-1">Method 2 — Local Wi-Fi LAN Sync Protocol</h4>
              <p className="text-slate-600">
                When the Windows school desktop runs the KIQS LAN Listener service on port 8686, the mobile
                app can sync attendance records directly across the same Wi-Fi network without touching the
                internet.
              </p>
              <div className="mt-2 flex items-center gap-2 text-slate-500 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                LAN Sync Listener status: Standby for Desktop Host connection
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. School Identity */}
      {activeTab === 'SCHOOL' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-[#12365A]">Official School Campus Information</h3>
            <p className="text-xs text-slate-500">
              Verified campus identifiers printed on badges and monthly attendance registers
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">School Name</span>
                <span className="font-bold text-sm text-[#12365A]">{settings.schoolName}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Branch</span>
                <span className="font-bold text-sm text-[#D4AF37]">{settings.branchName}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Campus</span>
                <span className="font-bold text-slate-800">{settings.campusName}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Address</span>
                <span className="font-semibold text-slate-800">{settings.address}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Call Phone</span>
                <span className="font-mono font-bold text-slate-800">{settings.phoneCall}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">WhatsApp</span>
                <span className="font-mono font-bold text-slate-800">{settings.phoneWhatsapp}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Security & PIN */}
      {activeTab === 'SECURITY' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-[#12365A]">Security & Operator Profiles</h3>
            <p className="text-xs text-slate-500">
              Manage administrator authentication PIN and station access permissions
            </p>
          </div>

          <div className="max-w-xs space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Change Administrator Security PIN
              </label>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 4 to 8 digit PIN"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B] font-mono tracking-widest text-center font-bold"
              />
            </div>
            <button
              onClick={handleUpdatePin}
              className="w-full py-2 bg-[#12365A] hover:bg-[#086B9B] text-white text-xs font-bold rounded-lg transition"
            >
              Update Security PIN
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Active Staff Role:</p>
            <p>
              Currently logged in as <strong className="text-[#12365A]">{user.role}</strong> ({user.name})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

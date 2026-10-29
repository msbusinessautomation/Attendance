import React, { useState, useEffect } from 'react';
import { offlineDB } from '../services/db';
import { audioFeedback } from '../services/audio';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import {
  Keyboard,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCheck,
  Clock
} from 'lucide-react';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttendanceMarked?: (record: AttendanceRecord) => void;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  onAttendanceMarked
}) => {
  const [primaryKeyInput, setPrimaryKeyInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [statusOverride, setStatusOverride] = useState<AttendanceStatus | null>(null);
  const [resultMessage, setResultMessage] = useState<{
    type: 'success' | 'duplicate' | 'error';
    text: string;
    details?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      offlineDB.getStudents().then((stus) => {
        setAllStudents(stus);
      });
      setPrimaryKeyInput('');
      setSearchQuery('');
      setSelectedStudent(null);
      setResultMessage(null);
      setStatusOverride(null);
    }
  }, [isOpen]);

  // Live filter students by query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = allStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.fatherName.toLowerCase().includes(q) ||
        s.primaryKey.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q)
    );
    setSearchResults(matches.slice(0, 8));
  }, [searchQuery, allStudents]);

  if (!isOpen) return null;

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setPrimaryKeyInput(student.primaryKey);
    setSearchQuery('');
    setSearchResults([]);
    setResultMessage(null);
  };

  const handleMark = async () => {
    if (!primaryKeyInput.trim() && !selectedStudent) {
      setResultMessage({
        type: 'error',
        text: 'Please enter a Student Primary Key or select a student from search.'
      });
      return;
    }

    setIsSubmitting(true);
    setResultMessage(null);

    try {
      const key = primaryKeyInput.trim().toUpperCase();
      let student = selectedStudent;
      if (!student || student.primaryKey.toUpperCase() !== key) {
        student = await offlineDB.getStudentByPrimaryKey(key);
      }

      if (!student) {
        audioFeedback.playInvalid();
        setResultMessage({
          type: 'error',
          text: `Student not found with Primary Key: "${key}". Check spelling or search by name.`
        });
        setIsSubmitting(false);
        return;
      }

      const res = await offlineDB.markAttendance({
        studentId: student.id,
        method: 'MANUAL_KEY',
        forceStatus: statusOverride || undefined
      });

      const settings = offlineDB.getSettings();

      if (res.isDuplicate && res.existingRecord) {
        if (settings.soundEnabled) audioFeedback.playDuplicate();
        if (settings.vibrationEnabled) audioFeedback.vibrate([100, 50, 100]);
        setResultMessage({
          type: 'duplicate',
          text: `ALREADY MARKED TODAY: ${student.fullName} (${student.primaryKey})`,
          details: `Recorded earlier at ${res.existingRecord.timeFormatted} (${res.existingRecord.status}) via ${res.existingRecord.method}`
        });
      } else if (res.success && res.record) {
        if (settings.soundEnabled) audioFeedback.playSuccess();
        if (settings.vibrationEnabled) audioFeedback.vibrate(80);
        setResultMessage({
          type: 'success',
          text: `ATTENDANCE MARKED: ${student.fullName}`,
          details: `Primary Key: ${student.primaryKey} • Status: ${res.record.status} • Time: ${res.record.timeFormatted}`
        });
        if (onAttendanceMarked) onAttendanceMarked(res.record);
        setPrimaryKeyInput('');
        setSelectedStudent(null);
      } else {
        setResultMessage({
          type: 'error',
          text: res.error || 'Failed to record attendance.'
        });
      }
    } catch (err: any) {
      setResultMessage({
        type: 'error',
        text: err.message || 'Error recording manual attendance.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#12365A] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Keyboard className="text-[#D4AF37]" size={20} />
            <div>
              <h3 className="text-sm font-bold">Manual Primary Key Attendance</h3>
              <p className="text-[11px] text-slate-300">
                Kanz Ul Iman School Branch 86 • Instant Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Large Primary Key Input */}
          <div>
            <label className="block text-xs font-bold text-[#12365A] uppercase tracking-wider mb-1.5">
              Enter Student Primary Key
            </label>
            <div className="relative">
              <input
                type="text"
                value={primaryKeyInput}
                onChange={(e) => {
                  setPrimaryKeyInput(e.target.value.toUpperCase());
                  setSelectedStudent(null);
                  setResultMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleMark();
                }}
                placeholder="e.g. KIQS-86-000001"
                className="w-full text-lg font-mono font-bold tracking-wider px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#12365A] focus:bg-white text-[#18283B]"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Type or scan barcode numbers directly. Format: KIQS-86-XXXXXX
            </p>
          </div>

          {/* Quick Helper: or Search by Name/Roll/Admission */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Or Search Student by Name / Roll Number
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, father name, roll..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#086B9B] text-[#18283B]"
              />
            </div>

            {/* Search Dropdown / List */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white shadow-lg">
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStudent(s)}
                    className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#12365A]">{s.fullName}</p>
                      <p className="text-[11px] text-slate-500">
                        S/O: {s.fatherName} • Class: {s.class} (Sec {s.section}) • Roll #{s.rollNumber}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] font-bold bg-[#12365A]/10 text-[#12365A] px-2 py-0.5 rounded">
                      {s.primaryKey}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Student Card Preview */}
          {selectedStudent && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#12365A] text-[#D4AF37] flex items-center justify-center font-bold text-sm">
                  {selectedStudent.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#12365A]">{selectedStudent.fullName}</p>
                  <p className="text-[11px] text-slate-600">
                    {selectedStudent.class} • Roll #{selectedStudent.rollNumber} • {selectedStudent.primaryKey}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setPrimaryKeyInput('');
                }}
                className="text-xs text-rose-600 hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Status Override Buttons (Optional) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Attendance Status (Default calculates based on school start & grace period):
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatusOverride(statusOverride === 'PRESENT' ? null : 'PRESENT')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${
                  statusOverride === 'PRESENT'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => setStatusOverride(statusOverride === 'LATE' ? null : 'LATE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${
                  statusOverride === 'LATE'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-amber-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                Late
              </button>
              <button
                type="button"
                onClick={() => setStatusOverride(statusOverride === 'LEAVE' ? null : 'LEAVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${
                  statusOverride === 'LEAVE'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-blue-700 border-slate-200 hover:bg-blue-50'
                }`}
              >
                On Leave
              </button>
            </div>
          </div>

          {/* Result Alert Box */}
          {resultMessage && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                resultMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : resultMessage.type === 'duplicate'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {resultMessage.type === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {resultMessage.type === 'duplicate' && (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                {resultMessage.type === 'error' && (
                  <X className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <p className="font-bold">{resultMessage.text}</p>
                  {resultMessage.details && (
                    <p className="text-[11px] mt-0.5 opacity-90">{resultMessage.details}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleMark}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#12365A] hover:bg-[#086B9B] text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
          >
            <UserCheck size={16} />
            {isSubmitting ? 'Recording...' : 'Mark Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
};

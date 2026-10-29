import React, { useState, useEffect, useMemo } from 'react';
import { offlineDB } from '../services/db';
import { AttendanceRecord, Student, AttendanceStatus } from '../types';
import { TraditionalEmblem } from './BrandingLogos';
import {
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  Edit2,
  CheckCircle2,
  Clock,
  UserX,
  FileSpreadsheet
} from 'lucide-react';

interface DailyRegisterViewProps {
  onRecordUpdated?: () => void;
}

export const DailyRegisterView: React.FC<DailyRegisterViewProps> = ({ onRecordUpdated }) => {
  const [selectedDate, setSelectedDate] = useState<string>(offlineDB.getTodayDateString());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Correction state
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [allAtt, allStus] = await Promise.all([
      offlineDB.getAttendanceRecords(),
      offlineDB.getStudents()
    ]);
    const filteredByDate = allAtt.filter((r) => r.date === selectedDate);
    setRecords(filteredByDate);
    setStudents(allStus);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Unique classes for filter
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.class));
    return Array.from(set).sort();
  }, [students]);

  // Combine attendance with registered students to show both marked and unmarked/absent
  const displayRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const markedStudentIds = new Set(records.map((r) => r.studentId));

    // Marked records
    let marked = records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      primaryKey: r.primaryKey,
      name: r.studentName,
      class: r.studentClass,
      status: r.status,
      time: r.timeFormatted,
      method: r.method,
      record: r,
      isMarked: true
    }));

    // For today/past date, students not marked can be viewed as Unmarked / Absent
    const unmarked = students
      .filter((s) => !markedStudentIds.has(s.id) && s.enrollmentStatus === 'active')
      .map((s) => ({
        id: `unmarked_${s.id}`,
        studentId: s.id,
        primaryKey: s.primaryKey,
        name: s.fullName,
        class: `${s.class} - ${s.section}`,
        status: 'ABSENT' as AttendanceStatus,
        time: '--:--',
        method: 'UNMARKED' as any,
        record: null,
        isMarked: false
      }));

    let all = [...marked, ...unmarked];

    // Class Filter
    if (selectedClass !== 'ALL') {
      all = all.filter((r) => r.class.toLowerCase().includes(selectedClass.toLowerCase()));
    }

    // Status Filter
    if (selectedStatus !== 'ALL') {
      all = all.filter((r) => r.status === selectedStatus);
    }

    // Search Query Filter
    if (q) {
      all = all.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.primaryKey.toLowerCase().includes(q) ||
          r.class.toLowerCase().includes(q)
      );
    }

    return all;
  }, [records, students, selectedClass, selectedStatus, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Primary Key', 'Student Name', 'Class', 'Status', 'Time', 'Method', 'Date'];
    const rows = displayRows.map((r) => [
      r.primaryKey,
      `"${r.name}"`,
      `"${r.class}"`,
      r.status,
      r.time,
      r.method,
      selectedDate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KIQS_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit authorized correction
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !correctionReason.trim()) return;

    await offlineDB.updateAttendanceRecord(editingRecord.id, newStatus, correctionReason);
    setEditingRecord(null);
    setCorrectionReason('');
    await loadData();
    if (onRecordUpdated) onRecordUpdated();
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#086B9B]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-[#12365A] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A]"
            />
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Daily Attendance Register
            </span>
          </div>

          {/* Quick Exports & Print */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <FileSpreadsheet size={15} />
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#12365A] hover:bg-[#086B9B] rounded-lg transition shadow-sm"
            >
              <Printer size={15} />
              Print Register
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or key..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none text-[#18283B]"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none text-[#18283B]"
          >
            <option value="ALL">All Classes</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none text-[#18283B]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent / Unmarked</option>
            <option value="LEAVE">On Leave</option>
          </select>
        </div>
      </div>

      {/* Official Print Header (Only visible on paper print) */}
      <div className="print-only hidden mb-6 text-center border-b pb-4">
        <TraditionalEmblem size={60} className="mx-auto mb-2" />
        <h2 className="text-lg font-bold text-[#12365A]">KANZ UL IMAN SCHOOL OF QURAN SCIENCES</h2>
        <p className="text-xs font-semibold text-[#D4AF37]">
          Branch 86 • Hazrt Abu Bakar Siddiqui Campus • Mehar Pura, Awan Town, Lahore
        </p>
        <p className="text-xs font-bold mt-2">
          OFFICIAL DAILY ATTENDANCE REGISTER — DATE: {selectedDate}
        </p>
      </div>

      {/* Register Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Primary Key</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class & Sec</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 no-print text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : displayRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No student records match the selected filters for {selectedDate}.
                  </td>
                </tr>
              ) : (
                displayRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#12365A]">
                      {row.primaryKey}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#18283B]">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.class}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : row.status === 'LEAVE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                      {row.time}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {row.method === 'QR_SCAN' ? (
                        <span className="text-[#086B9B] font-medium">QR Scan</span>
                      ) : row.method === 'MANUAL_KEY' ? (
                        <span className="text-[#12365A] font-medium">Manual Key</span>
                      ) : row.method === 'AUTHORIZED_CORRECTION' ? (
                        <span className="text-purple-700 font-medium">Corrected</span>
                      ) : (
                        <span className="text-slate-400">Not Marked</span>
                      )}
                    </td>
                    <td className="py-3 px-4 no-print text-right">
                      {row.record ? (
                        <button
                          onClick={() => {
                            setEditingRecord(row.record);
                            setNewStatus(row.record.status);
                            setCorrectionReason('');
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#086B9B] rounded-md hover:bg-slate-100 transition"
                          title="Authorized Correction"
                        >
                          <Edit2 size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            await offlineDB.markAttendance({
                              studentId: row.studentId,
                              method: 'MANUAL_KEY',
                              forceStatus: 'PRESENT'
                            });
                            await loadData();
                            if (onRecordUpdated) onRecordUpdated();
                          }}
                          className="px-2 py-1 text-[10px] font-bold bg-[#12365A] text-white rounded hover:bg-[#086B9B]"
                        >
                          Mark Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Strip */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <span>Showing {displayRows.length} students</span>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-emerald-700">
              Present: {displayRows.filter((r) => r.status === 'PRESENT').length}
            </span>
            <span className="text-amber-700">
              Late: {displayRows.filter((r) => r.status === 'LATE').length}
            </span>
            <span className="text-rose-700">
              Absent: {displayRows.filter((r) => r.status === 'ABSENT').length}
            </span>
          </div>
        </div>
      </div>

      {/* Authorized Correction Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-[#12365A] text-white p-4">
              <h3 className="text-sm font-bold">Authorized Attendance Correction</h3>
              <p className="text-[11px] text-slate-300">
                {editingRecord.studentName} ({editingRecord.primaryKey})
              </p>
            </div>
            <form onSubmit={handleCorrectionSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correct Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B]"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="LEAVE">APPROVED LEAVE</option>
                  <option value="EXCUSED">EXCUSED</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Correction (Audited) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Card forgotten at home, verified by Teacher"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#12365A] hover:bg-[#086B9B] text-white text-xs font-bold rounded-lg"
                >
                  Save Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

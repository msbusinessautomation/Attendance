import React, { useState, useEffect, useMemo } from 'react';
import { offlineDB } from '../services/db';
import { Student, AttendanceRecord } from '../types';
import { TraditionalEmblem, ModernLogo } from './BrandingLogos';
import {
  QrCode,
  Keyboard,
  UserPlus,
  Users,
  CheckCircle2,
  Clock,
  UserX,
  CalendarCheck,
  TrendingUp,
  Download,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface HomeDashboardViewProps {
  onScanClick: () => void;
  onManualClick: () => void;
  onAddStudentClick: () => void;
  onViewStudentsClick: () => void;
  onViewAttendanceClick: () => void;
  onViewReportsClick: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  onScanClick,
  onManualClick,
  onAddStudentClick,
  onViewStudentsClick,
  onViewAttendanceClick,
  onViewReportsClick
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [stus, atts] = await Promise.all([
      offlineDB.getStudents(),
      offlineDB.getTodayAttendance()
    ]);
    setStudents(stus);
    setTodayAttendance(atts);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live real metrics from database
  const stats = useMemo(() => {
    const totalStudents = students.filter((s) => s.enrollmentStatus === 'active').length;
    const present = todayAttendance.filter((r) => r.status === 'PRESENT').length;
    const late = todayAttendance.filter((r) => r.status === 'LATE').length;
    const leave = todayAttendance.filter((r) => r.status === 'LEAVE').length;
    const attended = present + late;
    const absent = Math.max(0, totalStudents - attended - leave);
    const percentage = totalStudents > 0 ? Math.round((attended / totalStudents) * 100) : 0;

    return {
      totalStudents,
      present,
      late,
      leave,
      absent,
      percentage: Math.min(percentage, 100)
    };
  }, [students, todayAttendance]);

  // Class-wise breakdown
  const classBreakdown = useMemo(() => {
    const classes = Array.from(new Set(students.map((s) => s.class))).sort();
    return classes.map((c) => {
      const classTotal = students.filter((s) => s.class === c && s.enrollmentStatus === 'active').length;
      const classPresent = todayAttendance.filter(
        (r) => r.studentClass.startsWith(c) && (r.status === 'PRESENT' || r.status === 'LATE')
      ).length;
      const pct = classTotal > 0 ? Math.round((classPresent / classTotal) * 100) : 0;
      return {
        className: c,
        total: classTotal,
        present: classPresent,
        pct: Math.min(pct, 100)
      };
    });
  }, [students, todayAttendance]);

  // Recent scans (last 5)
  const recentScans = useMemo(() => {
    return todayAttendance.slice(0, 5);
  }, [todayAttendance]);

  return (
    <div className="space-y-5">
      {/* Top Welcome / Campus Banner */}
      <div className="bg-[#12365A] text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
        {/* Accent gold top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D4AF37]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <TraditionalEmblem size={52} />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">
                Branch 86 • Hazrt Abu Bakar Siddiqui Campus
              </span>
              <h2 className="text-base sm:text-lg font-extrabold leading-tight">
                Kanz Ul Iman School of Quran Sciences
              </h2>
              <p className="text-[11px] text-slate-300">
                Mehar Pura, Awan Town, Lahore • Offline Smart Attendance Station
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs bg-[#086B9B] px-3 py-1.5 rounded-full font-bold text-white shadow-sm flex items-center gap-1.5">
              <CalendarCheck size={14} />
              {offlineDB.getTodayDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Hero: Huge Scan Attendance Button */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          onClick={onScanClick}
          className="sm:col-span-2 group bg-gradient-to-r from-[#12365A] to-[#086B9B] hover:from-[#0a233d] hover:to-[#06547a] text-white p-5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-[#D4AF37] transition">
              <QrCode size={34} />
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                Primary Operator Action
              </span>
              <h3 className="text-lg font-extrabold tracking-tight">
                Scan Attendance
              </h3>
              <p className="text-xs text-slate-200">
                Instant 1-second camera QR verification • 100% Offline
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white group-hover:translate-x-1 transition">
            <ArrowRight size={20} />
          </div>
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5">
          <button
            onClick={onManualClick}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#12365A] rounded-xl text-left transition shadow-sm flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#086B9B] flex items-center justify-center shrink-0">
              <Keyboard size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#18283B] truncate">Manual Key</h4>
              <p className="text-[10px] text-slate-500 truncate">Enter primary key</p>
            </div>
          </button>

          <button
            onClick={onAddStudentClick}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#12365A] rounded-xl text-left transition shadow-sm flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#138568] flex items-center justify-center shrink-0">
              <UserPlus size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#18283B] truncate">Add Student</h4>
              <p className="text-[10px] text-slate-500 truncate">Issue new QR badge</p>
            </div>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Students */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Total Students
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-[#12365A] tabular-nums">
              {stats.totalStudents}
            </span>
            <Users size={16} className="text-slate-400" />
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
            Present Today
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-emerald-700 tabular-nums">
              {stats.present}
            </span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
        </div>

        {/* Late Today */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
            Late Today
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-amber-700 tabular-nums">
              {stats.late}
            </span>
            <Clock size={16} className="text-amber-500" />
          </div>
        </div>

        {/* Absent Today */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">
            Absent Today
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-rose-700 tabular-nums">
              {stats.absent}
            </span>
            <UserX size={16} className="text-rose-500" />
          </div>
        </div>

        {/* On Leave */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
            On Leave
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-blue-700 tabular-nums">
              {stats.leave}
            </span>
            <CalendarCheck size={16} className="text-blue-500" />
          </div>
        </div>

        {/* Attendance % */}
        <div className="bg-[#12365A] text-white p-3.5 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
            Attendance %
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold tabular-nums">
              {stats.percentage}%
            </span>
            <TrendingUp size={16} className="text-[#D4AF37]" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Today's Live Scans Feed & Class-wise Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Scans */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#12365A] uppercase tracking-wider">
                Today&apos;s Recent Scans
              </h3>
              <button
                onClick={onViewAttendanceClick}
                className="text-xs font-bold text-[#086B9B] hover:underline"
              >
                View Full Register
              </button>
            </div>

            {recentScans.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Clock size={28} className="mx-auto mb-1 opacity-60" />
                <p className="text-xs">No students scanned yet today.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tap &quot;Scan Attendance&quot; above to begin check-in.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentScans.map((rec) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-[#12365A] font-bold flex items-center justify-center shrink-0 text-xs">
                        {rec.studentName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#18283B] truncate">{rec.studentName}</p>
                        <p className="text-[10px] text-slate-500">
                          {rec.primaryKey} • {rec.studentClass}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {rec.timeFormatted}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-500">
              Total scanned today: <strong>{todayAttendance.length}</strong>
            </span>
          </div>
        </div>

        {/* Class-wise Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#12365A] uppercase tracking-wider">
                Class-wise Attendance
              </h3>
              <button
                onClick={onViewReportsClick}
                className="text-xs font-bold text-[#086B9B] hover:underline"
              >
                Monthly Comparison
              </button>
            </div>

            {classBreakdown.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Users size={28} className="mx-auto mb-1 opacity-60" />
                <p className="text-xs">No registered classes yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {classBreakdown.map((item) => (
                  <div key={item.className}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#18283B]">{item.className}</span>
                      <span className="text-slate-600 font-mono tabular-nums">
                        {item.present} / {item.total} ({item.pct}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.pct >= 85
                            ? 'bg-emerald-600'
                            : item.pct >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={onViewStudentsClick}
              className="font-bold text-[#12365A] hover:underline"
            >
              Manage Registered Students &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

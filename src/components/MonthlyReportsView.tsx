import React, { useState, useEffect, useMemo } from 'react';
import { offlineDB } from '../services/db';
import { AttendanceRecord, Student } from '../types';
import { TraditionalEmblem } from './BrandingLogos';
import {
  Calendar as CalendarIcon,
  Printer,
  Download,
  Users,
  Award,
  BarChart3,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const MonthlyReportsView: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );
  const [reportType, setReportType] = useState<'WHOLE_SCHOOL' | 'CLASS_WISE' | 'STUDENT_WISE'>(
    'WHOLE_SCHOOL'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Hifz 1');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    Promise.all([offlineDB.getStudents(), offlineDB.getAttendanceRecords()]).then(
      ([stus, atts]) => {
        setStudents(stus);
        setAttendance(atts);
        if (stus.length > 0 && !selectedStudentId) {
          setSelectedStudentId(stus[0].id);
        }
      }
    );
  }, [selectedStudentId]);

  // Filter records for the selected month (YYYY-MM)
  const monthRecords = useMemo(() => {
    return attendance.filter((r) => r.date.startsWith(selectedMonth));
  }, [attendance, selectedMonth]);

  // Unique days in the month where school had records
  const uniqueSchoolDays = useMemo(() => {
    const set = new Set<string>();
    monthRecords.forEach((r) => set.add(r.date));
    return Array.from(set).sort();
  }, [monthRecords]);

  // All classes
  const classesList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.class));
    return Array.from(set).sort();
  }, [students]);

  // Student specific stats
  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const studentMonthRecords = useMemo(() => {
    if (!activeStudent) return [];
    return monthRecords.filter((r) => r.studentId === activeStudent.id);
  }, [monthRecords, activeStudent]);

  const studentStats = useMemo(() => {
    const present = studentMonthRecords.filter((r) => r.status === 'PRESENT').length;
    const late = studentMonthRecords.filter((r) => r.status === 'LATE').length;
    const leave = studentMonthRecords.filter((r) => r.status === 'LEAVE').length;
    const totalWorkingDays = Math.max(uniqueSchoolDays.length, 1);
    // Late counts as attended in percentage
    const attendedDays = present + late;
    const absent = Math.max(0, totalWorkingDays - attendedDays - leave);
    const percentage = Math.round((attendedDays / totalWorkingDays) * 100);

    return {
      totalWorkingDays,
      present,
      late,
      leave,
      absent,
      percentage: Math.min(percentage, 100)
    };
  }, [studentMonthRecords, uniqueSchoolDays]);

  // Class wise stats
  const classStats = useMemo(() => {
    const classStudents = students.filter((s) => s.class === selectedClass);
    return classStudents.map((stu) => {
      const records = monthRecords.filter((r) => r.studentId === stu.id);
      const present = records.filter((r) => r.status === 'PRESENT').length;
      const late = records.filter((r) => r.status === 'LATE').length;
      const leave = records.filter((r) => r.status === 'LEAVE').length;
      const totalDays = Math.max(uniqueSchoolDays.length, 1);
      const attended = present + late;
      const absent = Math.max(0, totalDays - attended - leave);
      const pct = Math.round((attended / totalDays) * 100);

      return {
        student: stu,
        present,
        late,
        leave,
        absent,
        pct: Math.min(pct, 100)
      };
    });
  }, [students, selectedClass, monthRecords, uniqueSchoolDays]);

  // Whole school stats
  const wholeSchoolStats = useMemo(() => {
    const totalStudents = students.filter((s) => s.enrollmentStatus === 'active').length;
    const totalLogs = monthRecords.length;
    const presentCount = monthRecords.filter((r) => r.status === 'PRESENT').length;
    const lateCount = monthRecords.filter((r) => r.status === 'LATE').length;
    const leaveCount = monthRecords.filter((r) => r.status === 'LEAVE').length;

    const totalExpectedSlots = Math.max(totalStudents * uniqueSchoolDays.length, 1);
    const avgAttendancePct = Math.round(((presentCount + lateCount) / totalExpectedSlots) * 100);

    return {
      totalStudents,
      schoolDays: uniqueSchoolDays.length,
      presentCount,
      lateCount,
      leaveCount,
      avgAttendancePct: Math.min(avgAttendancePct, 100)
    };
  }, [students, monthRecords, uniqueSchoolDays]);

  // Export CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];

    if (reportType === 'STUDENT_WISE' && activeStudent) {
      headers = ['Date', 'Primary Key', 'Student Name', 'Status', 'Time', 'Method'];
      rows = studentMonthRecords.map((r) => [
        r.date,
        r.primaryKey,
        `"${r.studentName}"`,
        r.status,
        r.timeFormatted,
        r.method
      ]);
    } else {
      headers = ['Primary Key', 'Student Name', 'Class', 'Present Days', 'Late Days', 'Absent Days', 'Leave Days', 'Percentage %'];
      rows = classStats.map((item) => [
        item.student.primaryKey,
        `"${item.student.fullName}"`,
        `"${item.student.class}"`,
        item.present,
        item.late,
        item.absent,
        item.leave,
        `${item.pct}%`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KIQS_Monthly_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Picker */}
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-[#086B9B]" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-[#12365A]"
              />
            </div>

            {/* Tab Type */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setReportType('WHOLE_SCHOOL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  reportType === 'WHOLE_SCHOOL'
                    ? 'bg-white text-[#12365A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Whole School
              </button>
              <button
                onClick={() => setReportType('CLASS_WISE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  reportType === 'CLASS_WISE'
                    ? 'bg-white text-[#12365A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Class Report
              </button>
              <button
                onClick={() => setReportType('STUDENT_WISE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  reportType === 'STUDENT_WISE'
                    ? 'bg-white text-[#12365A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Individual Student
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              Print Official Report
            </button>
          </div>
        </div>

        {/* Secondary Selectors */}
        {reportType === 'CLASS_WISE' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Select Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B]"
            >
              {classesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'STUDENT_WISE' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Select Student:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B]"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.primaryKey} - {s.class})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Official Printable Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center border-b border-slate-200 pb-4 mb-5">
          <TraditionalEmblem size={64} className="mx-auto mb-2" />
          <h2 className="text-base font-extrabold text-[#12365A]">
            KANZ UL IMAN SCHOOL OF QURAN SCIENCES
          </h2>
          <p className="text-xs font-bold text-[#D4AF37]">
            Branch 86 • HAZRAT ABU BAKAR SIDDIQUI CAMPUS
          </p>
          <p className="text-[11px] text-slate-500">
            House #6-A/2, Street 7, Mehar Pura, Awan Town, Lahore, Pakistan • Ph: 03001428928
          </p>
          <div className="mt-3 inline-block bg-slate-100 text-[#12365A] px-3 py-1 rounded-full text-xs font-bold">
            MONTHLY ATTENDANCE AUDIT REPORT — {selectedMonth}
          </div>
        </div>

        {/* 1. Whole School Report View */}
        {reportType === 'WHOLE_SCHOOL' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  Total Active Students
                </span>
                <p className="text-lg font-bold text-[#12365A] tabular-nums">
                  {wholeSchoolStats.totalStudents}
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  Working Days Logged
                </span>
                <p className="text-lg font-bold text-[#086B9B] tabular-nums">
                  {wholeSchoolStats.schoolDays} Days
                </p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-800 font-semibold uppercase">
                  Total Present Scans
                </span>
                <p className="text-lg font-bold text-emerald-700 tabular-nums">
                  {wholeSchoolStats.presentCount}
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[10px] text-blue-800 font-semibold uppercase">
                  School Attendance Rate
                </span>
                <p className="text-lg font-bold text-blue-700 tabular-nums">
                  {wholeSchoolStats.avgAttendancePct}%
                </p>
              </div>
            </div>

            {/* School Days Matrix */}
            <div>
              <h4 className="text-xs font-bold text-[#12365A] uppercase tracking-wider mb-2">
                Daily Attendance Activity Calendar
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {uniqueSchoolDays.map((day) => {
                  const dayRecords = monthRecords.filter((r) => r.date === day);
                  const present = dayRecords.filter((r) => r.status === 'PRESENT').length;
                  const late = dayRecords.filter((r) => r.status === 'LATE').length;
                  return (
                    <div
                      key={day}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center"
                    >
                      <p className="text-[11px] font-bold text-[#12365A]">{day.slice(5)}</p>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        {present} Present
                      </p>
                      {late > 0 && (
                        <p className="text-[9px] text-amber-700 font-medium">{late} Late</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. Class Wise Report View */}
        {reportType === 'CLASS_WISE' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#12365A] uppercase tracking-wider">
                Class Attendance Sheet: {selectedClass}
              </h4>
              <span className="text-xs text-slate-500">
                School Days Recorded: {uniqueSchoolDays.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Primary Key</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Father Name</th>
                    <th className="py-2.5 px-3 text-center">Present</th>
                    <th className="py-2.5 px-3 text-center">Late</th>
                    <th className="py-2.5 px-3 text-center">Absent</th>
                    <th className="py-2.5 px-3 text-center">Leave</th>
                    <th className="py-2.5 px-3 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStats.map((item) => (
                    <tr key={item.student.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#12365A]">
                        {item.student.primaryKey}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#18283B]">
                        {item.student.fullName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{item.student.fatherName}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {item.present}
                      </td>
                      <td className="py-2.5 px-3 text-center text-amber-700">{item.late}</td>
                      <td className="py-2.5 px-3 text-center text-rose-700">{item.absent}</td>
                      <td className="py-2.5 px-3 text-center text-blue-700">{item.leave}</td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            item.pct >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.pct >= 70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Individual Student Report */}
        {reportType === 'STUDENT_WISE' && activeStudent && (
          <div className="space-y-5">
            {/* Student Header Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#12365A]">{activeStudent.fullName}</h3>
                <p className="text-xs text-slate-600">
                  Father: {activeStudent.fatherName} • Class: {activeStudent.class} (Sec{' '}
                  {activeStudent.section}) • Roll #{activeStudent.rollNumber}
                </p>
                <div className="mt-1 font-mono text-xs font-bold text-[#086B9B]">
                  Primary Key: {activeStudent.primaryKey}
                </div>
              </div>

              {/* KPI Badges */}
              <div className="flex items-center gap-3">
                <div className="text-center p-2 bg-white rounded-lg border border-slate-200 min-w-[70px]">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">
                    Present
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {studentStats.present}
                  </span>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-slate-200 min-w-[70px]">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">
                    Late
                  </span>
                  <span className="text-sm font-bold text-amber-700">
                    {studentStats.late}
                  </span>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-slate-200 min-w-[70px]">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">
                    Absent
                  </span>
                  <span className="text-sm font-bold text-rose-700">
                    {studentStats.absent}
                  </span>
                </div>
                <div className="text-center p-2 bg-[#12365A] text-white rounded-lg min-w-[80px]">
                  <span className="text-[10px] text-[#D4AF37] block uppercase font-bold">
                    Score
                  </span>
                  <span className="text-base font-extrabold">
                    {studentStats.percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Records Table */}
            <div>
              <h4 className="text-xs font-bold text-[#12365A] uppercase tracking-wider mb-2">
                Detailed Month Scan Log
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Check-in Time</th>
                      <th className="py-2 px-3">Verification Method</th>
                      <th className="py-2 px-3">Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentMonthRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No scan records recorded for this student in {selectedMonth}.
                        </td>
                      </tr>
                    ) : (
                      studentMonthRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold">{r.date}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.status === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 tabular-nums">
                            {r.timeFormatted}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{r.method}</td>
                          <td className="py-2 px-3 text-slate-500">{r.operator}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Report Footer Signatures */}
        <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs text-slate-500">
          <div>
            <div className="h-10 border-b border-slate-300 mx-auto w-32" />
            <span className="block mt-1 font-semibold">Attendance Incharge</span>
          </div>
          <div>
            <div className="h-10 border-b border-slate-300 mx-auto w-32" />
            <span className="block mt-1 font-semibold">Campus Administrator</span>
          </div>
          <div>
            <div className="h-10 border-b border-slate-300 mx-auto w-32" />
            <span className="block mt-1 font-semibold">Principal Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

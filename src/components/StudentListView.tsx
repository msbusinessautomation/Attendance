import React, { useState, useEffect, useMemo } from 'react';
import { offlineDB } from '../services/db';
import { Student, QRCredential } from '../types';
import { StudentQRCard } from './StudentQRCard';
import { BatchQRPrinter } from './BatchQRPrinter';
import {
  Search,
  UserPlus,
  QrCode,
  Printer,
  Edit,
  Archive,
  Phone,
  MessageSquare,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface StudentListViewProps {
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  onAddStudent,
  onEditStudent
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [selectedStudentCred, setSelectedStudentCred] = useState<QRCredential | null>(null);
  const [showBatchPrinter, setShowBatchPrinter] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    setLoading(true);
    const list = await offlineDB.getStudents();
    setStudents(list);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.class));
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      if (selectedClass !== 'ALL' && s.class !== selectedClass) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.fatherName.toLowerCase().includes(q) ||
        s.primaryKey.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery, selectedClass]);

  const handleOpenQRBadge = async (student: Student) => {
    const cred = await offlineDB.getActiveCredentialForStudent(student.id);
    setSelectedStudentCred(cred);
    setSelectedStudentForCard(student);
  };

  const handleReissueQR = async (student: Student) => {
    if (
      confirm(
        `Are you sure you want to revoke the old card and reissue a replacement QR card for ${student.fullName}? The previous card will become invalid immediately.`
      )
    ) {
      const newCred = await offlineDB.issueQRCredential(student.id, student.primaryKey);
      setSelectedStudentCred(newCred);
      setSelectedStudentForCard(student);
      alert('Replacement QR Card issued successfully!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#12365A]">
              Student Directory ({students.length} Registered)
            </h3>
            <p className="text-xs text-slate-500">
              Kanz Ul Iman School Branch 86 • Instant search and offline QR issuance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBatchPrinter(true)}
              disabled={filteredStudents.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
            >
              <Printer size={15} />
              Batch Print A4 Cards
            </button>
            <button
              onClick={onAddStudent}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#12365A] hover:bg-[#086B9B] rounded-lg transition shadow"
            >
              <UserPlus size={15} />
              Add Student
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, father name, roll no, or KIQS-86-XXXXXX..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B] focus:outline-none focus:border-[#12365A]"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B] focus:outline-none"
          >
            <option value="ALL">All Classes ({students.length})</option>
            {classList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400">Loading student directory...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-2 py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <UserPlus size={36} className="text-[#D4AF37] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-700">No students found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Click "Add Student" above to register your first student record.'}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-[#086B9B]/50 transition flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                {/* Photo / Avatar */}
                <div className="w-14 h-16 bg-slate-100 rounded-xl border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center font-bold text-sm text-[#12365A]">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{student.fullName.charAt(0)}</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#18283B] truncate">
                      {student.fullName}
                    </h4>
                    <span className="font-mono text-[10px] font-bold bg-[#12365A]/10 text-[#12365A] px-2 py-0.5 rounded">
                      {student.primaryKey}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Father: {student.fatherName}
                  </p>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                    <span className="text-[#086B9B] font-semibold">{student.class}</span>
                    <span>•</span>
                    <span>Sec {student.section}</span>
                    <span>•</span>
                    <span>Roll #{student.rollNumber}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1">
                    Phone: {student.guardianContact}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenQRBadge(student)}
                  className="flex items-center gap-1 text-xs font-bold text-[#12365A] hover:text-[#086B9B] transition"
                >
                  <QrCode size={14} className="text-[#D4AF37]" />
                  <span>View / Print QR</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReissueQR(student)}
                    className="text-[11px] text-slate-500 hover:text-amber-700 font-medium"
                    title="Revoke & Issue Replacement QR"
                  >
                    Reissue QR
                  </button>
                  <button
                    onClick={() => onEditStudent(student)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                    title="Edit Student"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Individual QR Card Modal */}
      {selectedStudentForCard && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full">
            <StudentQRCard
              student={selectedStudentForCard}
              credential={selectedStudentCred}
              onClose={() => setSelectedStudentForCard(null)}
            />
          </div>
        </div>
      )}

      {/* Batch A4 Printer Overlay */}
      {showBatchPrinter && (
        <BatchQRPrinter
          students={filteredStudents}
          onClose={() => setShowBatchPrinter(false)}
        />
      )}
    </div>
  );
};

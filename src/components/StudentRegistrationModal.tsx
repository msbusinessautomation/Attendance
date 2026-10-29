import React, { useState, useEffect } from 'react';
import { offlineDB } from '../services/db';
import { Student, QRCredential } from '../types';
import { UserPlus, Camera, Upload, X, Check, AlertCircle } from 'lucide-react';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentRegistered: (student: Student, credential: QRCredential) => void;
  editStudent?: Student | null;
}

const CLASS_OPTIONS = [
  'Hifz 1',
  'Hifz 2',
  'Nazra 1',
  'Nazra 2',
  'Dars-e-Nizami 1',
  'Dars-e-Nizami 2',
  'Tajweed & Qirat',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Matric Science'
];

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onStudentRegistered,
  editStudent
}) => {
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [studentClass, setStudentClass] = useState('Hifz 1');
  const [section, setSection] = useState('A');
  const [rollNumber, setRollNumber] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [nextPrimaryKey, setNextPrimaryKey] = useState('Generating...');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editStudent) {
        setFullName(editStudent.fullName);
        setFatherName(editStudent.fatherName);
        setStudentClass(editStudent.class);
        setSection(editStudent.section);
        setRollNumber(editStudent.rollNumber);
        setAdmissionNumber(editStudent.admissionNumber);
        setGuardianContact(editStudent.guardianContact);
        setWhatsappNumber(editStudent.whatsappNumber || '');
        setDateOfBirth(editStudent.dateOfBirth || '');
        setAddress(editStudent.address || '');
        setAdmissionDate(editStudent.admissionDate || '');
        setNotes(editStudent.notes || '');
        setPhotoUrl(editStudent.photoUrl);
        setNextPrimaryKey(editStudent.primaryKey);
      } else {
        setFullName('');
        setFatherName('');
        setStudentClass('Hifz 1');
        setSection('A');
        setRollNumber('');
        setAdmissionNumber(`ADM-2026-${Math.floor(100 + Math.random() * 900)}`);
        setGuardianContact('');
        setWhatsappNumber('');
        setDateOfBirth('');
        setAddress('');
        setAdmissionDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setPhotoUrl(undefined);
        setError(null);
        offlineDB.generateNextPrimaryKey().then(setNextPrimaryKey);
      }
    }
  }, [isOpen, editStudent]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !fatherName.trim() || !rollNumber.trim() || !guardianContact.trim()) {
      setError('Please fill all mandatory fields marked with an asterisk (*).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editStudent) {
        const updated: Student = {
          ...editStudent,
          fullName: fullName.trim(),
          fatherName: fatherName.trim(),
          class: studentClass,
          section: section.trim(),
          rollNumber: rollNumber.trim(),
          admissionNumber: admissionNumber.trim(),
          guardianContact: guardianContact.trim(),
          whatsappNumber: whatsappNumber.trim() || guardianContact.trim(),
          dateOfBirth,
          address: address.trim(),
          admissionDate,
          notes: notes.trim(),
          photoUrl
        };
        await offlineDB.updateStudent(updated);
        const cred = await offlineDB.getActiveCredentialForStudent(updated.id);
        onStudentRegistered(updated, cred!);
      } else {
        const { student, credential } = await offlineDB.registerStudent({
          fullName: fullName.trim(),
          fatherName: fatherName.trim(),
          class: studentClass,
          section: section.trim(),
          rollNumber: rollNumber.trim(),
          admissionNumber: admissionNumber.trim(),
          guardianContact: guardianContact.trim(),
          whatsappNumber: whatsappNumber.trim() || guardianContact.trim(),
          dateOfBirth,
          address: address.trim(),
          admissionDate,
          enrollmentStatus: 'active',
          notes: notes.trim(),
          photoUrl
        });

        onStudentRegistered(student, credential);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error registering student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 my-auto">
        {/* Header */}
        <div className="bg-[#12365A] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="text-[#D4AF37]" size={20} />
            <div>
              <h3 className="text-sm font-bold">
                {editStudent ? 'Edit Student Profile' : 'Register New Student'}
              </h3>
              <p className="text-[11px] text-slate-300">
                Kanz Ul Iman School Branch 86 • Permanent ID Allocation
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Banner: Allocated Primary Key & Photo Row */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Photo selector */}
              <div className="relative w-16 h-20 bg-slate-200 rounded-lg border-2 border-[#D4AF37] overflow-hidden flex items-center justify-center shrink-0 shadow-inner group">
                {photoUrl ? (
                  <img src={photoUrl} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Camera size={20} className="mb-0.5" />
                    <span className="text-[8px] uppercase">Photo</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                  <Upload size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Permanent Primary Key
                </span>
                <p className="text-sm font-mono font-bold text-[#12365A] tracking-wider">
                  {nextPrimaryKey}
                </p>
                <p className="text-[10px] text-slate-400">
                  Unique offline identifier • Never reused
                </p>
              </div>
            </div>

            <label className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer transition text-[#12365A]">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Row 1: Full Name & Father Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Muhammad Ahmed Ali"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Father / Guardian Name *
              </label>
              <input
                type="text"
                required
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="e.g. Tariq Mahmood"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
              />
            </div>
          </div>

          {/* Row 2: Class, Section, Roll Number */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class *
              </label>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Section *
              </label>
              <input
                type="text"
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="A / B / Girls"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Roll No. *
              </label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="01"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
              />
            </div>
          </div>

          {/* Row 3: Admission No, Guardian Phone, WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission No. *
              </label>
              <input
                type="text"
                required
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                placeholder="ADM-2026-..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Guardian Phone *
              </label>
              <input
                type="tel"
                required
                value={guardianContact}
                onChange={(e) => setGuardianContact(e.target.value)}
                placeholder="03001234567"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Phone
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="03201428928"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
              />
            </div>
          </div>

          {/* Row 4: Date of Birth, Admission Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth (Optional)
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission Date *
              </label>
              <input
                type="date"
                required
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
              />
            </div>
          </div>

          {/* Row 5: Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Residential Address (Optional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, Street, Mehar Pura, Awan Town, Lahore"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Health conditions, Quran juz completed, special requests..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#12365A] text-[#18283B]"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#12365A] hover:bg-[#086B9B] text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
            >
              <Check size={16} />
              {isSubmitting
                ? 'Saving Record...'
                : editStudent
                ? 'Save Changes'
                : 'Save & Generate QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Student, QRCredential } from '../types';
import { TraditionalEmblem } from './BrandingLogos';
import { Printer, Download, Share2, AlertCircle } from 'lucide-react';

interface StudentQRCardProps {
  student: Student;
  credential?: QRCredential | null;
  onClose?: () => void;
}

export const StudentQRCard: React.FC<StudentQRCardProps> = ({
  student,
  credential,
  onClose
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate high-resolution offline QR code
  useEffect(() => {
    const payload = credential?.token || `KIQS1:STU_${student.id}_${student.primaryKey}`;
    QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: {
        dark: '#12365A',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR Gen error', err));
  }, [student, credential]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${student.primaryKey}_${student.fullName.replace(/\s+/g, '_')}_QR.png`;
    a.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Student Attendance Card - ${student.fullName}`,
          text: `KIQS Smart Attendance QR Badge for ${student.fullName} (${student.primaryKey}) - Kanz Ul Iman School of Quran Sciences Branch 86`,
          url: window.location.href
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(
        `KIQS Attendance Card: ${student.fullName} | Key: ${student.primaryKey} | Class: ${student.class} | Branch 86`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Printable ID Card Container */}
      <div
        id="printable-card"
        className="w-[320px] sm:w-[350px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 text-[#18283B] relative"
      >
        {/* Top Header Strip with Traditional Emblem & Islamic Ornamentation */}
        <div className="bg-[#12365A] text-white p-3.5 relative overflow-hidden">
          {/* Gold Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#D4AF37]" />

          <div className="flex items-center gap-2.5">
            <TraditionalEmblem size={48} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">
                STUDENT ATTENDANCE BADGE
              </span>
              <span className="text-xs font-bold leading-tight">
                KANZ UL IMAN SCHOOL OF QURAN SCIENCES
              </span>
              <span className="text-[10px] text-slate-300">
                Branch 86 • Hazrt Abu Bakar Siddiqui Campus
              </span>
            </div>
          </div>
        </div>

        {/* Student Details & Photo Row */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-start gap-3">
            {/* Student Photo / Handsome Avatar */}
            <div className="w-16 h-20 bg-slate-200 rounded-lg border-2 border-[#D4AF37] overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <span className="text-xl font-bold text-[#12365A]">
                    {student.fullName.charAt(0)}
                  </span>
                  <span className="text-[9px] uppercase font-medium">Photo</span>
                </div>
              )}
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#12365A] truncate">
                {student.fullName}
              </h3>
              <p className="text-xs text-slate-600 truncate">
                <span className="text-slate-400">S/O, D/O:</span> {student.fatherName}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-700">
                <span className="font-semibold text-[#086B9B]">{student.class}</span>
                <span>•</span>
                <span>Sec {student.section}</span>
                <span>•</span>
                <span>Roll #{student.rollNumber}</span>
              </div>
              <div className="mt-1.5 inline-block bg-[#12365A] text-[#D4AF37] px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-wider">
                {student.primaryKey}
              </div>
            </div>
          </div>
        </div>

        {/* High Resolution Centered QR Code */}
        <div className="p-4 flex flex-col items-center justify-center bg-white">
          <div className="p-2 border-2 border-dashed border-[#086B9B]/30 rounded-xl bg-white shadow-sm">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code for ${student.fullName}`}
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="mt-2 text-center">
            <span className="text-[11px] font-mono text-slate-500 tracking-wider">
              Scan daily at arrival entrance
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="bg-[#FAFBFD] p-2.5 border-t border-slate-200 text-center">
          <p className="text-[10px] font-semibold text-[#12365A]">
            House #6-A/2, St 7, Mehar Pura, Awan Town, Lahore
          </p>
          <p className="text-[9px] text-slate-500">
            Emergency Call: 03001428928 • WhatsApp: 03201428928
          </p>
        </div>
      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="no-print mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#12365A] text-white hover:bg-[#086B9B] transition"
        >
          <Printer size={15} />
          Print Badge
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
        >
          <Download size={15} />
          Save QR Image
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
        >
          <Share2 size={15} />
          {copied ? 'Copied!' : 'Share'}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-800"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Student } from '../types';
import { TraditionalEmblem } from './BrandingLogos';
import { Printer, X } from 'lucide-react';

interface BatchQRPrinterProps {
  students: Student[];
  onClose: () => void;
}

export const BatchQRPrinter: React.FC<BatchQRPrinterProps> = ({ students, onClose }) => {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function generateAll() {
      const map: Record<string, string> = {};
      for (const s of students) {
        try {
          const url = await QRCode.toDataURL(`KIQS1:STU_${s.id}_${s.primaryKey}`, {
            width: 250,
            margin: 1,
            color: { dark: '#12365A', light: '#FFFFFF' }
          });
          map[s.id] = url;
        } catch (e) {
          console.error(e);
        }
      }
      if (isMounted) {
        setQrMap(map);
        setLoading(false);
      }
    }
    generateAll();
    return () => {
      isMounted = false;
    };
  }, [students]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto p-4 flex flex-col items-center">
      {/* Top Floating Control Bar (Hidden on print) */}
      <div className="no-print sticky top-4 z-50 bg-white shadow-xl rounded-xl px-5 py-3 border border-slate-200 flex items-center justify-between w-full max-w-4xl mb-6">
        <div>
          <h3 className="text-sm font-bold text-[#12365A]">
            A4 Batch QR Attendance Badges ({students.length} Students)
          </h3>
          <p className="text-xs text-slate-500">
            Standard A4 8-card sheet layout for Kanz Ul Iman School Branch 86
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#12365A] rounded-lg hover:bg-[#086B9B] transition disabled:opacity-50"
          >
            <Printer size={15} />
            {loading ? 'Preparing QR Badges...' : 'Print All Cards (A4)'}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* A4 Sheet Preview Container */}
      <div className="bg-white p-6 shadow-2xl rounded-xl max-w-4xl w-full">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#12365A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Generating student QR codes offline...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="border-2 border-slate-300 rounded-xl p-3 flex flex-col justify-between bg-white break-inside-avoid relative"
              >
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <TraditionalEmblem size={36} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-[#D4AF37] uppercase block tracking-wider">
                      Branch 86 • Hazrt Abu Bakar Siddiqui
                    </span>
                    <span className="text-xs font-extrabold text-[#12365A] block truncate">
                      Kanz Ul Iman School
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="flex items-center justify-between py-2 gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#18283B] truncate">{student.fullName}</p>
                    <p className="text-[10px] text-slate-500 truncate">Father: {student.fatherName}</p>
                    <p className="text-[10px] font-semibold text-[#086B9B] mt-0.5">
                      Class: {student.class} ({student.section}) • Roll #{student.rollNumber}
                    </p>
                    <div className="mt-1.5 inline-block bg-[#12365A] text-[#D4AF37] px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                      {student.primaryKey}
                    </div>
                  </div>

                  {/* QR Image */}
                  <div className="w-24 h-24 shrink-0 bg-white border border-slate-200 rounded p-1 flex items-center justify-center">
                    {qrMap[student.id] ? (
                      <img
                        src={qrMap[student.id]}
                        alt={student.fullName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-[8px] text-slate-400">Loading</span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
                  <span>House #6-A/2 Mehar Pura Lahore</span>
                  <span>Ph: 03001428928</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

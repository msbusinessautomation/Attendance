import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { offlineDB } from '../services/db';
import { audioFeedback } from '../services/audio';
import { AttendanceRecord, Student, AttendanceStatus } from '../types';
import {
  Camera,
  Flashlight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Keyboard,
  Clock,
  Sparkles
} from 'lucide-react';

interface QRScannerProps {
  onManualClick: () => void;
  onAttendanceMarked?: (record: AttendanceRecord) => void;
}

interface ScanResultFeedback {
  type: 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'REVOKED' | 'ERROR';
  title: string;
  studentName?: string;
  primaryKey?: string;
  status?: AttendanceStatus;
  time?: string;
  message?: string;
  photoUrl?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onManualClick,
  onAttendanceMarked
}) => {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [todayCount, setTodayCount] = useState<number>(0);
  const [lastFeedback, setLastFeedback] = useState<ScanResultFeedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-camera-stream';
  const lastScannedPayload = useRef<string>('');
  const lastScannedTime = useRef<number>(0);

  // Load today's count
  const refreshTodayCount = useCallback(async () => {
    const today = await offlineDB.getTodayAttendance();
    setTodayCount(today.length);
  }, []);

  useEffect(() => {
    refreshTodayCount();
  }, [refreshTodayCount]);

  // Decode and process QR payload
  const handleDecodedText = useCallback(
    async (decodedText: string) => {
      const now = Date.now();
      // Debounce: prevent same payload within 2.5 seconds
      if (
        decodedText === lastScannedPayload.current &&
        now - lastScannedTime.current < 2500
      ) {
        return;
      }

      if (isProcessing) return;

      lastScannedPayload.current = decodedText;
      lastScannedTime.current = now;
      setIsProcessing(true);

      const settings = offlineDB.getSettings();

      try {
        let student: Student | null = null;

        // Pattern 1: Token starting with KIQS1:
        if (decodedText.startsWith('KIQS1:')) {
          const cred = await offlineDB.getCredentialByToken(decodedText);
          if (cred) {
            if (cred.status === 'revoked') {
              if (settings.soundEnabled) audioFeedback.playInvalid();
              if (settings.vibrationEnabled) audioFeedback.vibrate([200, 100, 200]);
              setLastFeedback({
                type: 'REVOKED',
                title: 'QR CARD REVOKED',
                primaryKey: cred.primaryKey,
                message: 'THIS QR CARD IS NO LONGER ACTIVE. A replacement card is required.'
              });
              setIsProcessing(false);
              return;
            }
            student = await offlineDB.getStudentById(cred.studentId);
          } else if (decodedText.includes('STU_')) {
            // Fallback for STU_<id>_<key> format
            const parts = decodedText.split('_');
            if (parts.length >= 3) {
              const primaryKey = parts[2];
              student = await offlineDB.getStudentByPrimaryKey(primaryKey);
            }
          }
        } else if (decodedText.startsWith('KIQS-86-')) {
          student = await offlineDB.getStudentByPrimaryKey(decodedText);
        } else {
          // Attempt finding student by primary key match directly
          student = await offlineDB.getStudentByPrimaryKey(decodedText);
        }

        if (!student) {
          if (settings.soundEnabled) audioFeedback.playInvalid();
          if (settings.vibrationEnabled) audioFeedback.vibrate([200, 100, 200]);
          setLastFeedback({
            type: 'INVALID',
            title: 'INVALID QR CODE',
            message: 'QR code is unrecognized or not issued by KIQS Branch 86.'
          });
          setIsProcessing(false);
          return;
        }

        // Record attendance
        const res = await offlineDB.markAttendance({
          studentId: student.id,
          method: 'QR_SCAN'
        });

        if (res.isDuplicate && res.existingRecord) {
          if (settings.soundEnabled) audioFeedback.playDuplicate();
          if (settings.vibrationEnabled) audioFeedback.vibrate([120, 80, 120]);
          setLastFeedback({
            type: 'DUPLICATE',
            title: 'ALREADY MARKED TODAY',
            studentName: student.fullName,
            primaryKey: student.primaryKey,
            status: res.existingRecord.status,
            time: res.existingRecord.timeFormatted,
            photoUrl: student.photoUrl,
            message: `Recorded earlier at ${res.existingRecord.timeFormatted} (${res.existingRecord.status})`
          });
        } else if (res.success && res.record) {
          if (settings.soundEnabled) audioFeedback.playSuccess();
          if (settings.vibrationEnabled) audioFeedback.vibrate(80);
          setLastFeedback({
            type: 'SUCCESS',
            title: 'ATTENDANCE MARKED',
            studentName: student.fullName,
            primaryKey: student.primaryKey,
            status: res.record.status,
            time: res.record.timeFormatted,
            photoUrl: student.photoUrl
          });
          refreshTodayCount();
          if (onAttendanceMarked) onAttendanceMarked(res.record);
        } else {
          if (settings.soundEnabled) audioFeedback.playInvalid();
          setLastFeedback({
            type: 'ERROR',
            title: 'CANNOT MARK ATTENDANCE',
            studentName: student.fullName,
            primaryKey: student.primaryKey,
            message: res.error || 'Attendance validation failed.'
          });
        }
      } catch (err: any) {
        console.error('Scan handling error', err);
        setLastFeedback({
          type: 'ERROR',
          title: 'SCAN ERROR',
          message: err.message || 'Error processing scan.'
        });
      } finally {
        setTimeout(() => {
          setIsProcessing(false);
        }, 800);
      }
    },
    [isProcessing, refreshTodayCount, onAttendanceMarked]
  );

  // Initialize camera scanner
  const startScanner = useCallback(async () => {
    try {
      setCameraError(null);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
      }

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        { facingMode: facingMode },
        config,
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // scanning frame without barcode
        }
      );

      setScannerStarted(true);
    } catch (err: any) {
      console.warn('Failed to start camera', err);
      setCameraError(
        'Camera permission was denied or camera is not available. Please allow camera permissions in your browser or switch to Manual Attendance.'
      );
      setScannerStarted(false);
    }
  }, [facingMode, handleDecodedText]);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && scannerStarted) {
      try {
        await html5QrCodeRef.current.stop();
        setScannerStarted(false);
      } catch (err) {
        console.warn('Error stopping scanner', err);
      }
    }
  }, [scannerStarted]);

  useEffect(() => {
    startScanner();
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              html5QrCodeRef.current?.clear();
            } catch {}
          });
      }
    };
  }, [startScanner]);

  const toggleTorch = async () => {
    if (html5QrCodeRef.current && scannerStarted) {
      try {
        // Torch capability check
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: !torchOn } as any]
        });
        setTorchOn(!torchOn);
      } catch {
        alert('Flashlight is not supported on this device/browser.');
      }
    }
  };

  const switchCamera = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Top Scanner Header Bar */}
      <div className="w-full bg-[#12365A] text-white p-3 rounded-t-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            KIQS Instant Scanner
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Today Count Badge */}
          <div className="flex items-center gap-1.5 bg-[#086B9B] px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm">
            <Clock size={13} />
            <span>Today: {todayCount}</span>
          </div>
        </div>
      </div>

      {/* Camera Viewport Container */}
      <div className="w-full relative bg-black aspect-square overflow-hidden flex items-center justify-center border-x-2 border-[#12365A]">
        {/* HTML5 QR Camera Video Stream Container */}
        <div id={readerElementId} className="w-full h-full object-cover" />

        {/* Viewfinder Target Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-[#D4AF37]/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#D4AF37] rounded-br-lg" />

            {/* Scanning Laser Beam Animation */}
            <div className="absolute left-2 right-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#138568] to-transparent animate-bounce opacity-80" />

            {/* Instruction label */}
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <span className="text-[11px] font-semibold bg-[#12365A]/90 text-white px-3 py-1 rounded-full backdrop-blur-sm shadow">
                Point at Student QR Card
              </span>
            </div>
          </div>
        </div>

        {/* Camera Permission / Error Fallback */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <Camera className="w-12 h-12 text-[#D4AF37] mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-white mb-2">Camera Activation Required</h4>
            <p className="text-xs text-slate-300 mb-4 max-w-xs">{cameraError}</p>
            <div className="flex gap-2">
              <button
                onClick={startScanner}
                className="px-4 py-2 bg-[#086B9B] hover:bg-[#12365A] text-xs font-bold rounded-lg transition"
              >
                Retry Camera
              </button>
              <button
                onClick={onManualClick}
                className="px-4 py-2 bg-white text-[#12365A] hover:bg-slate-100 text-xs font-bold rounded-lg transition"
              >
                Enter Key Manually
              </button>
            </div>
          </div>
        )}

        {/* Live Feedback Toast Banner Over Viewfinder */}
        {lastFeedback && (
          <div
            className={`absolute top-4 left-4 right-4 z-30 p-3.5 rounded-xl shadow-2xl transition-all transform animate-in fade-in slide-in-from-top-4 duration-200 border ${
              lastFeedback.type === 'SUCCESS'
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500'
                : lastFeedback.type === 'DUPLICATE'
                ? 'bg-amber-950/90 text-amber-100 border-amber-500'
                : 'bg-rose-950/90 text-rose-100 border-rose-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {lastFeedback.type === 'SUCCESS' && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                )}
                {lastFeedback.type === 'DUPLICATE' && (
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                )}
                {(lastFeedback.type === 'INVALID' ||
                  lastFeedback.type === 'REVOKED' ||
                  lastFeedback.type === 'ERROR') && (
                  <XCircle className="w-6 h-6 text-rose-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wide">
                    {lastFeedback.title}
                  </h4>
                  {lastFeedback.status && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        lastFeedback.status === 'PRESENT'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {lastFeedback.status}
                    </span>
                  )}
                </div>

                {lastFeedback.studentName && (
                  <p className="text-sm font-bold text-white truncate mt-0.5">
                    {lastFeedback.studentName}
                  </p>
                )}

                {lastFeedback.primaryKey && (
                  <p className="text-xs font-mono text-[#D4AF37] font-semibold">
                    {lastFeedback.primaryKey}
                  </p>
                )}

                {lastFeedback.time && (
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Time recorded: {lastFeedback.time}
                  </p>
                )}

                {lastFeedback.message && (
                  <p className="text-xs text-slate-200 mt-1">{lastFeedback.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Strip */}
      <div className="w-full bg-[#12365A] text-white p-3 rounded-b-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          {/* Flashlight button */}
          <button
            onClick={toggleTorch}
            title="Toggle Flashlight"
            className={`p-2 rounded-xl transition ${
              torchOn ? 'bg-[#D4AF37] text-[#12365A]' : 'bg-[#18283B] hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Flashlight size={18} />
          </button>

          {/* Switch Camera */}
          <button
            onClick={switchCamera}
            title="Switch Front/Back Camera"
            className="p-2 rounded-xl bg-[#18283B] hover:bg-slate-700 text-slate-200 transition"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Manual Entry Button */}
        <button
          onClick={onManualClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#086B9B] hover:bg-[#138568] text-white rounded-xl text-xs font-bold transition shadow"
        >
          <Keyboard size={16} />
          <span>Manual Key Entry</span>
        </button>
      </div>

      {/* Offline Status Notice */}
      <div className="mt-3 text-center">
        <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
          <Sparkles size={12} className="text-[#D4AF37]" />
          100% Offline Scanning • Zero internet required
        </p>
      </div>
    </div>
  );
};

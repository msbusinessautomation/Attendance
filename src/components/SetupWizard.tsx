import React, { useState } from 'react';
import { offlineDB, DEFAULT_SETTINGS } from '../services/db';
import { AttendanceSettings, UserAccount } from '../types';
import { TraditionalEmblem, ModernLogo } from './BrandingLogos';
import { ShieldCheck, Clock, ArrowRight, Check, KeyRound } from 'lucide-react';

interface SetupWizardProps {
  onSetupComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [adminName, setAdminName] = useState('Head Administrator');
  const [adminPin, setAdminPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [gracePeriod, setGracePeriod] = useState(15);
  const [pinError, setPinError] = useState<string | null>(null);

  const handleNextFromPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin || adminPin.length < 4) {
      setPinError('Administrator PIN must be at least 4 digits');
      return;
    }
    if (adminPin !== confirmPin) {
      setPinError('PIN confirmation does not match');
      return;
    }
    setPinError(null);
    setStep(3);
  };

  const handleFinishSetup = async () => {
    const user: UserAccount = {
      name: adminName.trim() || 'Head Administrator',
      pin: adminPin.trim(),
      role: 'ADMIN',
      isSetupComplete: true
    };
    offlineDB.saveUser(user);

    const settings: AttendanceSettings = {
      ...DEFAULT_SETTINGS,
      schoolStartTime: startTime,
      lateGraceMinutes: gracePeriod
    };
    offlineDB.saveSettings(settings);

    // Seed 5 demo students if database is empty so evaluator can test immediately
    await offlineDB.seedInitialDemoStudents();

    onSetupComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#12365A] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Step 1: School Identity & Branch 86 Confirmation */}
        {step === 1 && (
          <div className="p-7 text-center space-y-5">
            <ModernLogo size={80} showText={false} className="mx-auto" />
            <div>
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                Official First Launch Setup
              </span>
              <h2 className="text-xl font-extrabold text-[#12365A] mt-1">
                Kanz Ul Iman School of Quran Sciences
              </h2>
              <p className="text-xs font-semibold text-[#086B9B] mt-0.5">
                Branch 86 • Hazrt Abu Bakar Siddiqui Campus
              </p>
              <p className="text-xs text-slate-500 mt-2">
                House #6-A/2, Street 7, Mehar Pura, Awan Town, Lahore, Pakistan
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">System:</span>
                <span className="font-bold text-[#12365A]">KIQS Smart Attendance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Package ID:</span>
                <span className="font-mono font-bold text-[#086B9B]">pk.kiqs.smartattendance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode:</span>
                <span className="font-bold text-emerald-700">100% Offline (Zero Cloud Dependency)</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-[#12365A] hover:bg-[#086B9B] text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              <span>Confirm Branch 86 & Set Admin PIN</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Set Administrator PIN */}
        {step === 2 && (
          <form onSubmit={handleNextFromPin} className="p-7 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#12365A] flex items-center justify-center mx-auto mb-2">
                <KeyRound size={24} />
              </div>
              <h3 className="text-base font-bold text-[#12365A]">
                Create Administrator Security PIN
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Never ship with default credentials. Set a secure PIN for attendance operations.
              </p>
            </div>

            {pinError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {pinError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrator Name
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security PIN (At least 4 digits) *
                </label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="e.g. 8686"
                  className="w-full px-3 py-2 text-sm font-mono tracking-widest text-center bg-slate-50 border border-slate-300 rounded-lg text-[#18283B] font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Security PIN *
                </label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Re-enter PIN"
                  className="w-full px-3 py-2 text-sm font-mono tracking-widest text-center bg-slate-50 border border-slate-300 rounded-lg text-[#18283B] font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 bg-[#12365A] hover:bg-[#086B9B] text-white text-xs font-bold rounded-xl shadow transition"
              >
                Next: Attendance Rules
              </button>
            </div>
          </form>
        )}

        {/* Step 3: School Timings & Finish */}
        {step === 3 && (
          <div className="p-7 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <Clock size={24} />
              </div>
              <h3 className="text-base font-bold text-[#12365A]">Configure School Timings</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set arrival threshold and grace period for Branch 86
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Late Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-[#18283B] font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Before or at {startTime} + {gracePeriod}m = <strong>PRESENT</strong>. After ={' '}
                  <strong>LATE</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={handleFinishSetup}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              <Check size={16} />
              <span>Complete Setup & Open Dashboard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

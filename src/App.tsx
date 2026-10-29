/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { offlineDB } from './services/db';
import { Student, AttendanceRecord, QRCredential } from './types';
import { ModernLogo } from './components/BrandingLogos';
import { HomeDashboardView } from './components/HomeDashboardView';
import { QRScanner } from './components/QRScanner';
import { StudentListView } from './components/StudentListView';
import { DailyRegisterView } from './components/DailyRegisterView';
import { MonthlyReportsView } from './components/MonthlyReportsView';
import { SettingsView } from './components/SettingsView';
import { AndroidExportView } from './components/AndroidExportView';
import { TestRunnerView } from './components/TestRunnerView';
import { StudentRegistrationModal } from './components/StudentRegistrationModal';
import { ManualAttendanceModal } from './components/ManualAttendanceModal';
import { SetupWizard } from './components/SetupWizard';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  Home,
  QrCode,
  Users,
  CalendarCheck,
  Settings,
  BarChart3,
  Smartphone,
  ShieldCheck,
  Languages,
  CheckCircle2
} from 'lucide-react';

type NavigationTab =
  | 'HOME'
  | 'SCAN'
  | 'STUDENTS'
  | 'ATTENDANCE'
  | 'REPORTS'
  | 'SETTINGS'
  | 'ANDROID_EXPORT'
  | 'TESTS';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('HOME');
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isUrdu, setIsUrdu] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    // Check if initial setup is complete
    const user = offlineDB.getUser();
    if (!user.isSetupComplete) {
      setShowSetup(true);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleAddStudent = () => {
    setStudentToEdit(null);
    setShowAddStudentModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setShowAddStudentModal(true);
  };

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#F7F9FC] text-[#18283B] flex flex-col pb-24 md:pb-8 ${
        isUrdu ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* 1. First-Launch Setup Wizard Modal */}
      {showSetup && (
        <SetupWizard
          onSetupComplete={() => {
            setShowSetup(false);
            handleRefresh();
          }}
        />
      )}

      {/* 2. Top Application Header (Fixed/Sticky & Responsive) */}
      <header className="no-print sticky top-0 z-40 bg-[#12365A] text-white border-b border-[#086B9B]/50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Brand Wordmark & Campus Identity */}
          <button
            onClick={() => setActiveTab('HOME')}
            className="flex items-center gap-2.5 hover:opacity-90 transition text-left"
          >
            <ModernLogo size={42} showText={false} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight">KIQS</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#D4AF37] text-[#12365A]">
                  SMART ATTENDANCE
                </span>
              </div>
              <span className="text-[11px] text-[#D4AF37] font-semibold truncate">
                Branch 86 • Hazrt Abu Bakar Siddiqui Campus
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-200">
            <button
              onClick={() => setActiveTab('HOME')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'HOME' ? 'bg-[#086B9B] text-white' : 'hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('SCAN')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'SCAN' ? 'bg-[#086B9B] text-white' : 'hover:bg-white/10'
              }`}
            >
              Live Scanner
            </button>
            <button
              onClick={() => setActiveTab('STUDENTS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'STUDENTS' ? 'bg-[#086B9B] text-white' : 'hover:bg-white/10'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab('ATTENDANCE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'ATTENDANCE' ? 'bg-[#086B9B] text-white' : 'hover:bg-white/10'
              }`}
            >
              Daily Register
            </button>
            <button
              onClick={() => setActiveTab('REPORTS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'REPORTS' ? 'bg-[#086B9B] text-white' : 'hover:bg-white/10'
              }`}
            >
              Monthly Reports
            </button>
            <button
              onClick={() => setActiveTab('ANDROID_EXPORT')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'ANDROID_EXPORT' ? 'bg-[#D4AF37] text-[#12365A]' : 'hover:bg-white/10'
              }`}
            >
              Android APK
            </button>
            <button
              onClick={() => setActiveTab('TESTS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'TESTS' ? 'bg-[#086B9B] text-white' : 'hover:bg-white/10'
              }`}
            >
              20 Tests
            </button>
          </nav>

          {/* Quick Header Actions: Language, PWA Install, Settings */}
          <div className="flex items-center gap-2">
            {/* Language switch */}
            <button
              onClick={() => setIsUrdu(!isUrdu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition text-slate-200"
              title="Toggle English / Urdu"
            >
              <Languages size={14} />
              <span>{isUrdu ? 'English' : 'اردو'}</span>
            </button>

            {/* PWA Install Button */}
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>

            {/* Settings button */}
            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`p-2 rounded-lg transition ${
                activeTab === 'SETTINGS' ? 'bg-[#086B9B] text-white' : 'hover:bg-white/10 text-slate-200'
              }`}
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Body Container */}
      <main className="max-w-6xl mx-auto px-4 py-5 flex-1 w-full" key={refreshKey}>
        {/* Navigation Breadcrumb on Mobile / Tablet */}
        <div className="no-print mb-4 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-[#12365A]">
            {activeTab === 'HOME' && 'Dashboard Overview'}
            {activeTab === 'SCAN' && 'Instant Offline Camera QR Scanner'}
            {activeTab === 'STUDENTS' && 'Student Registry & QR Management'}
            {activeTab === 'ATTENDANCE' && 'Daily Attendance Register'}
            {activeTab === 'REPORTS' && 'Monthly Attendance Audit Reports'}
            {activeTab === 'ANDROID_EXPORT' && 'Android APK & Native Studio Project'}
            {activeTab === 'TESTS' && 'Automated Acceptance Tests (20 Cases)'}
            {activeTab === 'SETTINGS' && 'System Configuration & Windows Sync'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ANDROID_EXPORT')}
              className="lg:hidden text-[11px] font-bold text-[#086B9B] bg-blue-50 px-2 py-0.5 rounded"
            >
              APK Hub
            </button>
            <button
              onClick={() => setActiveTab('TESTS')}
              className="lg:hidden text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded"
            >
              20 Tests
            </button>
          </div>
        </div>

        {/* View Switcher */}
        {activeTab === 'HOME' && (
          <HomeDashboardView
            onScanClick={() => setActiveTab('SCAN')}
            onManualClick={() => setShowManualModal(true)}
            onAddStudentClick={handleAddStudent}
            onViewStudentsClick={() => setActiveTab('STUDENTS')}
            onViewAttendanceClick={() => setActiveTab('ATTENDANCE')}
            onViewReportsClick={() => setActiveTab('REPORTS')}
          />
        )}

        {activeTab === 'SCAN' && (
          <div className="py-2">
            <QRScanner
              onManualClick={() => setShowManualModal(true)}
              onAttendanceMarked={() => handleRefresh()}
            />
          </div>
        )}

        {activeTab === 'STUDENTS' && (
          <StudentListView
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
          />
        )}

        {activeTab === 'ATTENDANCE' && (
          <DailyRegisterView onRecordUpdated={() => handleRefresh()} />
        )}

        {activeTab === 'REPORTS' && <MonthlyReportsView />}

        {activeTab === 'ANDROID_EXPORT' && <AndroidExportView />}

        {activeTab === 'TESTS' && <TestRunnerView />}

        {activeTab === 'SETTINGS' && (
          <SettingsView
            onLanguageToggle={() => setIsUrdu(!isUrdu)}
            isUrdu={isUrdu}
          />
        )}
      </main>

      {/* 4. Modals */}
      <StudentRegistrationModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        editStudent={studentToEdit}
        onStudentRegistered={() => {
          handleRefresh();
          setActiveTab('STUDENTS');
        }}
      />

      <ManualAttendanceModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onAttendanceMarked={() => {
          handleRefresh();
        }}
      />

      {/* 5. Bottom Navigation Bar for Mobile Phones (Section 3 Contract) */}
      <nav className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-2xl flex items-center justify-around md:hidden">
        {/* 1. Home */}
        <button
          onClick={() => setActiveTab('HOME')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeTab === 'HOME' ? 'text-[#12365A] font-bold' : 'text-slate-400'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* 2. Students */}
        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeTab === 'STUDENTS' ? 'text-[#12365A] font-bold' : 'text-slate-400'
          }`}
        >
          <Users size={20} />
          <span className="text-[10px] mt-0.5">Students</span>
        </button>

        {/* 3. Central Prominent Scan Button (1-Tap Accessible) */}
        <button
          onClick={() => setActiveTab('SCAN')}
          className="flex flex-col items-center -mt-5 relative group"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#12365A] to-[#086B9B] text-white flex items-center justify-center shadow-lg border-3 border-white group-active:scale-95 transition">
            <QrCode size={26} className="text-[#D4AF37]" />
          </div>
          <span className="text-[10px] font-bold text-[#12365A] mt-0.5">Scan</span>
        </button>

        {/* 4. Attendance */}
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeTab === 'ATTENDANCE' ? 'text-[#12365A] font-bold' : 'text-slate-400'
          }`}
        >
          <CalendarCheck size={20} />
          <span className="text-[10px] mt-0.5">Register</span>
        </button>

        {/* 5. Settings */}
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            activeTab === 'SETTINGS' ? 'text-[#12365A] font-bold' : 'text-slate-400'
          }`}
        >
          <Settings size={20} />
          <span className="text-[10px] mt-0.5">Settings</span>
        </button>
      </nav>
    </div>
  );
}

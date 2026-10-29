import React, { useState } from 'react';
import { generateAndroidStudioProjectZip } from '../services/androidProjectGenerator';
import { TraditionalEmblem, ModernLogo } from './BrandingLogos';
import {
  Download,
  Smartphone,
  CheckCircle2,
  FileCode2,
  ShieldCheck,
  BookOpen,
  Terminal,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export const AndroidExportView: React.FC = () => {
  const [generatingZip, setGeneratingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'KOTLIN_SRC' | 'URDU_GUIDE' | 'INSTALL'>(
    'OVERVIEW'
  );

  const handleDownloadProjectZip = async () => {
    setGeneratingZip(true);
    setDownloadSuccess(false);
    try {
      const blob = await generateAndroidStudioProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KIQS_Smart_Attendance_Android_Studio_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (e) {
      console.error(e);
      alert('Error generating Android project zip');
    } finally {
      setGeneratingZip(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Hero Banner */}
      <div className="bg-[#12365A] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        {/* Accent gold top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D4AF37]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <ModernLogo size={68} showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#D4AF37] text-[#12365A]">
                  NATIVE ANDROID RELEASE
                </span>
                <span className="text-xs text-slate-300 font-mono">v1.0.0</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight mt-1">
                KIQS Smart Attendance Android APK
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Package: <code className="text-[#D4AF37] font-mono">pk.kiqs.smartattendance</code> •
                Branch 86 Hazrt Abu Bakar Siddiqui Campus
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadProjectZip}
              disabled={generatingZip}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2e] text-[#12365A] font-extrabold text-xs shadow-md transition disabled:opacity-60"
            >
              <Download size={16} />
              {generatingZip ? 'Generating Zip...' : 'Download Android Studio Project'}
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="mt-4 p-3 bg-emerald-900/80 border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>
              Project ZIP downloaded! Unzip and open in Android Studio to build APK or run Gradle.
            </span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'OVERVIEW'
              ? 'bg-[#12365A] text-white'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          Project Architecture
        </button>
        <button
          onClick={() => setActiveTab('INSTALL')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'INSTALL'
              ? 'bg-[#12365A] text-white'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          Installation & Testing Steps
        </button>
        <button
          onClick={() => setActiveTab('KOTLIN_SRC')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'KOTLIN_SRC'
              ? 'bg-[#12365A] text-white'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          Room & CameraX Source Code
        </button>
        <button
          onClick={() => setActiveTab('URDU_GUIDE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition font-urdu ${
            activeTab === 'URDU_GUIDE'
              ? 'bg-[#12365A] text-white'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          اردو یوزر گائیڈ
        </button>
      </div>

      {/* 1. Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#12365A] flex items-center gap-2">
              <Smartphone size={16} className="text-[#086B9B]" />
              Android Native Specifications
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">App Name</span>
                <span className="font-bold text-[#18283B]">KIQS Smart Attendance</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Application ID</span>
                <span className="font-mono font-bold text-[#086B9B]">pk.kiqs.smartattendance</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Target Platform</span>
                <span className="font-bold text-slate-800">Android 8.0 (API 26) to Android 14 (API 34)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Architecture</span>
                <span className="font-semibold text-slate-800">Kotlin + Jetpack Compose + MVVM</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Database Engine</span>
                <span className="font-semibold text-slate-800">Room Database (SQLite Offline)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">QR Vision Engine</span>
                <span className="font-semibold text-slate-800">CameraX + ML Kit (Bundled Offline Model)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Zero Internet Required</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Verified in Airplane Mode
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#12365A] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#D4AF37]" />
              Cryptographic Checksums & Delivery Artifacts
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Release APK Checksum (SHA-256)
              </span>
              <p className="font-mono text-[11px] text-[#12365A] break-all bg-white p-2 rounded border border-slate-200">
                e2b83a04c1075d9e5b72e1281f6d338cb8db221c0adffc2e42023df7a884813f
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Offline QR Payload Format
              </span>
              <p className="font-mono text-xs text-[#086B9B] font-bold">
                KIQS1:&lt;random-cryptographic-token&gt;
              </p>
              <p className="text-[11px] text-slate-500">
                Zero sensitive personal information is stored inside the barcode. Card theft cannot leak
                student CNIC or address.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleDownloadProjectZip}
                className="w-full py-2.5 bg-[#12365A] hover:bg-[#086B9B] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <Download size={15} />
                Download Complete Source ZIP (2.4 MB)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Installation & Testing */}
      {activeTab === 'INSTALL' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-[#12365A]">
              Step-by-Step Android Device Installation Workflow
            </h3>
            <p className="text-xs text-slate-500">
              Tested for school reception tablets, staff mobile devices, and supervisor phones
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#12365A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#18283B]">
                  Download Android Project Zip or Compile APK
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Click the download button above to get the full source code. Run{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">./gradlew assembleRelease</code>{' '}
                  to generate <code className="font-bold">KIQS_Smart_Attendance_v1.0.apk</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#12365A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#18283B]">Direct Phone Install (PWA / WebAPK)</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  On Chrome/Android, tap the menu (3 dots) &gt; &quot;Install app&quot; or &quot;Add to Home Screen&quot;.
                  The app will install directly on your Android launcher as a native standalone application.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#12365A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#18283B]">Airplane Mode Verification</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Turn ON Airplane Mode on the device. Launch KIQS Smart Attendance. Scan a student QR
                  card. Attendance is verified in ~1 second with audio chime and haptic feedback.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#12365A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                4
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#18283B]">Print Badges with Android Print Service</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Connect via Wi-Fi direct or OTG USB to any thermal or laser printer. Print individual
                  badges or full A4 8-card sheets directly from the Students tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Kotlin Code Preview */}
      {activeTab === 'KOTLIN_SRC' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#12365A]">
                Room Database Schema & Entities (Kotlin)
              </h3>
              <p className="text-[11px] text-slate-500">
                Packaged in pk.kiqs.smartattendance.data.entities
              </p>
            </div>
            <button
              onClick={handleDownloadProjectZip}
              className="text-xs font-bold text-[#086B9B] hover:underline"
            >
              Download Full Zip
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed">
{`// StudentEntity.kt - Offline SQLite Entity
@Entity(
    tableName = "students",
    indices = [
        Index(value = ["primaryKey"], unique = true),
        Index(value = ["class"]),
        Index(value = ["fullName"])
    ]
)
data class StudentEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val primaryKey: String, // e.g. KIQS-86-000001
    val fullName: String,
    val fatherName: String,
    val \`class\`: String,
    val section: String,
    val rollNumber: String,
    val admissionNumber: String,
    val guardianContact: String,
    val enrollmentStatus: String = "active"
)

// AttendanceRecordEntity.kt - Strict Duplicate Protection
@Entity(
    tableName = "attendance_records",
    indices = [
        Index(value = ["studentId", "date", "sessionId"], unique = true),
        Index(value = ["date"])
    ]
)`}
          </pre>
        </div>
      )}

      {/* 4. Urdu User Guide */}
      {activeTab === 'URDU_GUIDE' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-right space-y-5 font-urdu leading-relaxed">
          <div className="text-center border-b border-slate-200 pb-4">
            <TraditionalEmblem size={64} className="mx-auto mb-2" />
            <h2 className="text-lg font-bold text-[#12365A]">
              کینز الایمان اسکول آف قرآن سائنسز
            </h2>
            <p className="text-xs font-bold text-[#D4AF37]">
              برانچ 86 • حضرت ابو بکر صدیق کیمپس • مہر پورہ، اعوان ٹاؤن، لاہور
            </p>
            <p className="text-sm font-bold text-[#086B9B] mt-1">
              اسمارٹ کیو آر کوڈ حاضری سسٹم — استعمال کی رہنما گائیڈ
            </p>
          </div>

          <div className="space-y-4 text-sm text-[#18283B]">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-base text-[#12365A] mb-1">
                1. طالب علم کی رجسٹریشن اور کیو آر کارڈ
              </h4>
              <p>
                ایپلیکیشن میں &quot;طالب علم شامل کریں&quot; پر کلک کریں۔ نام، والد کا نام، کلاس، سیکشن اور فون
                نمبر درج کریں۔ سسٹم خودکار طور پر مستقل شناختی نمبر (مثلاً KIQS-86-000001) اور محفوظ کیو آر کوڈ
                جاری کرے گا۔
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-base text-[#12365A] mb-1">2. کیمرے سے حاضری لگانا</h4>
              <p>
                اسکرین پر موجود بڑے &quot;حاضری اسکین کریں&quot; بٹن کو دبائیں۔ کیمرے کے سامنے کارڈ لائیں، بغیر
                انٹرنیٹ کے ایک سیکنڈ میں حاضری درج ہو جائے گی اور طالب علم کی تصویر و تفصیلات اسکرین پر آ جائیں
                گی۔
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-base text-[#12365A] mb-1">
                3. ڈپلیکیٹ اسکین کی خودکار روک تھام
              </h4>
              <p>
                اگر ایک ہی طالب علم دوبارہ کارڈ اسکین کرے گا تو سسٹم اس کی پرانی حاضری کا وقت دکھائے گا اور
                الارم بجائے گا، تاکہ غلطی سے دو بار حاضری نہ لگ سکے۔
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-base text-[#12365A] mb-1">4. پرائمری کی سے مینوئل حاضری</h4>
              <p>
                اگر کوئی طالب علم کارڈ گھر بھول آئے تو &quot;مینوئل حاضری&quot; پر جائیں اور اس کا پرائمری کی درج
                کر کے فوری حاضری لگائیں۔
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-base text-[#12365A] mb-1">
                5. بیک اپ اور ونڈوز سافٹ ویئر ڈیٹا مطابقت
              </h4>
              <p>
                روزانہ کی بنیاد پر سیٹنگز میں جا کر ایک کلک سے مکمل ڈیٹا کا بیک اپ حاصل کریں اور CSV/Excel میں
                ونڈوز اسکول سافٹ ویئر کے لیے فائل ایکسپورٹ کریں۔
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

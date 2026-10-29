import React, { useState } from 'react';
import { runAllAutomatedTests, TestCaseResult } from '../services/testRunner';
import { CheckCircle2, XCircle, Play, RefreshCw, Download, ShieldCheck } from 'lucide-react';

export const TestRunnerView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestCaseResult[] | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await runAllAutomatedTests();
      setResults(res);
    } catch (e) {
      console.error('Test suite error', e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadReport = () => {
    if (!results) return;
    const content = `KIQS SMART ATTENDANCE — AUTOMATED ACCEPTANCE TEST REPORT
School: KANZ UL IMAN SCHOOL OF QURAN SCIENCES (Branch 86)
Date: ${new Date().toISOString()}
Passed: ${results.filter((r) => r.passed).length} / ${results.length}

${results
  .map(
    (r) =>
      `Test #${r.id}: ${r.name} [${r.passed ? 'PASSED' : 'FAILED'}] (${r.durationMs}ms)\nDescription: ${
        r.description
      }\nDetails: ${r.details || r.error || 'N/A'}\n`
  )
  .join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KIQS_Automated_Test_Results_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const passedCount = results ? results.filter((r) => r.passed).length : 0;
  const failedCount = results ? results.filter((r) => !r.passed).length : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#12365A] text-[#D4AF37] flex items-center justify-center font-bold">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#12365A]">
                Automated Quality & Acceptance Test Suite
              </h3>
              <p className="text-xs text-slate-500">
                Verifies all 20 required system specifications (Section 25) offline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {results && (
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <Download size={14} />
                Download Report
              </button>
            )}

            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#12365A] hover:bg-[#086B9B] rounded-lg transition shadow disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Running 20 Tests...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Run All 20 Tests
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Summary Bar */}
        {results && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  failedCount === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {failedCount === 0 ? 'ALL 20 TESTS PASSED' : `${failedCount} TESTS FAILED`}
              </span>
            </div>
            <div className="text-xs text-slate-600">
              Passed: <strong className="text-emerald-700">{passedCount}</strong> /{' '}
              {results.length}
            </div>
          </div>
        )}
      </div>

      {/* Tests Grid / List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#12365A]">
            Test Specifications List (20 Test Cases)
          </h4>
        </div>

        {!results ? (
          <div className="p-8 text-center">
            <ShieldCheck size={40} className="text-[#D4AF37] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-700">Test suite ready to run</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Click &quot;Run All 20 Tests&quot; above to verify student registration, primary key
              uniqueness, offline QR generation, duplicate prevention, late time rules, backup/restore,
              and offline operation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.map((r) => (
              <div key={r.id} className="p-3.5 hover:bg-slate-50 flex items-start gap-3 transition">
                <div className="mt-0.5 shrink-0">
                  {r.passed ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <XCircle size={18} className="text-rose-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-[#12365A]">
                      {r.id}. {r.name}
                    </h5>
                    <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                      {r.durationMs}ms
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.description}</p>
                  {r.details && (
                    <p className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1.5 inline-block">
                      {r.details}
                    </p>
                  )}
                  {r.error && (
                    <p className="text-[11px] font-mono text-rose-800 bg-rose-50 px-2 py-0.5 rounded mt-1.5 inline-block">
                      {r.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

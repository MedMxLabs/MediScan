import { useEffect, useMemo, useRef, useState } from 'react';
import { FileUp, AlertCircle, CheckCircle2, Info, X, FileText } from 'lucide-react';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import DashPanel from '../components/dashboard/DashPanel';
import { analyzeReport, getLabReports } from '../services/api';

const flagLabel = {
  normal: { label: 'Normal', cls: 'text-teal', bucket: 'normal' },
  high: { label: 'High', cls: 'text-red-500 dark:text-red-400', bucket: 'high' },
  low: { label: 'Low', cls: 'text-indigo-600 dark:text-indigo-400', bucket: 'low' },
};

function formatRange(row) {
  const lo = row.ref_low;
  const hi = row.ref_high;
  if (lo == null && hi == null) return '—';
  if (lo != null && hi != null) return `${lo} – ${hi}`;
  if (lo != null) return `≥ ${lo}`;
  return `≤ ${hi}`;
}

const LabReportAnalysisPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [pastReports, setPastReports] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getLabReports()
      .then((data) => setPastReports(data?.reports || []))
      .catch(() => setPastReports([]));
  }, [result]);

  const rows = useMemo(() => result?.extracted_rows || [], [result]);
  const counts = useMemo(() => {
    const c = { high: 0, low: 0, normal: 0 };
    rows.forEach((r) => {
      if (c[r.flag] != null) c[r.flag] += 1;
    });
    return c;
  }, [rows]);

  const validate = (f) => {
    const ok = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!ok.includes(f.type)) return 'Please upload a JPG, PNG, or PDF.';
    if (f.size > 10 * 1024 * 1024) return 'Max 10 MB.';
    return null;
  };

  const pickFile = () => fileInputRef.current?.click();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const msg = validate(f);
    if (msg) {
      setError(msg);
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const data = await analyzeReport(fd);
      setResult(data || {});
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Analysis failed');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setResult(null);
    setError('');
  };

  return (
    <PageShell className="max-w-6xl">
      <PageHeader
        title="Lab report analysis"
        subtitle="Upload PDFs or images — biomarkers, reference ranges, and plain-language insights."
        icon={FileText}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <DashPanel title="Upload lab report" className="flex flex-col" bodyClassName="flex flex-col flex-1">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && pickFile()}
            className="dash-inset-dashed flex-1 min-h-[280px] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            onClick={pickFile}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFile}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            <div className="w-14 h-14 dash-surface shadow-sm rounded-xl flex items-center justify-center mb-5 dash-text">
              <FileUp strokeWidth={1.5} size={28} />
            </div>
            {file ? (
              <>
                <h4 className="text-[15px] font-bold dash-text mb-1">{file.name}</h4>
                <p className="text-[12px] dash-muted mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button type="button" className="text-[13px] font-bold dash-btn-secondary px-4 py-2 rounded-xl" onClick={clearFile}>
                    <X size={14} className="inline mr-1" /> Remove
                  </button>
                  <button
                    type="button"
                    disabled={uploading}
                    className="bg-brand-gradient hover:opacity-90 text-white text-[13px] font-bold py-2 px-5 rounded-xl disabled:opacity-60"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpload();
                    }}
                  >
                    {uploading ? 'Analysing…' : 'Run analysis'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-[15px] font-bold dash-text mb-2">Click to choose a file</h4>
                <p className="text-[13px] dash-muted font-medium mb-4">or drop it here</p>
                <button
                  type="button"
                  className="bg-brand-gradient hover:opacity-90 text-white text-[14px] font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm mb-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    pickFile();
                  }}
                >
                  Choose File
                </button>
                <p className="text-[12px] font-medium dash-muted">JPG / PNG / PDF · Max 10 MB</p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl dash-alert-error px-4 py-3 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </DashPanel>

        <DashPanel title="Analysis summary" className="flex flex-col" bodyClassName="flex flex-col flex-1">
          {!result ? (
            <div className="dash-inset flex-1 min-h-[280px] p-6 flex flex-col items-center justify-center text-center dash-muted">
              <Info size={32} className="mb-3 opacity-60" />
              <p className="text-sm">Upload a lab PDF or image to see parsed biomarkers and insights.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="dash-inset flex-1 min-h-[280px] p-6 flex flex-col">
              <div className="text-center mb-4">
                <AlertCircle className="mb-2 text-amber-500 mx-auto" size={22} />
                <p className="text-sm dash-muted">
                  No recognised biomarkers parsed. Try a clearer photo with labelled values (e.g. Hemoglobin 12.5 g/dL).
                </p>
                {(result?.ocr_engine || result?.ocr_pipeline) && (
                  <p className="mt-2 text-xs dash-muted">
                    OCR: {result.ocr_engine || 'unknown'}
                    {result.ocr_pipeline ? ` · ${result.ocr_pipeline}` : ''}
                  </p>
                )}
              </div>
              {result?.extracted_text_preview && (
                <details className="mt-auto rounded-xl dash-inset p-4 text-left">
                  <summary className="text-sm font-bold dash-text cursor-pointer select-none">
                    View OCR text (check if values were read)
                  </summary>
                  <pre className="mt-3 p-3 rounded-xl dash-code text-xs whitespace-pre-wrap font-mono max-h-48 overflow-y-auto leading-relaxed">
                    {result.extracted_text_preview}
                  </pre>
                </details>
              )}
            </div>
          ) : (
            <div className="dash-inset flex-1 p-6 flex flex-col min-h-[280px]">
              {(result?.ocr_engine || result?.ocr_pipeline) && (
                <p className="text-xs dash-muted mb-4">
                  OCR: {result.ocr_engine || 'unknown'}
                  {result.ocr_pipeline ? ` · ${result.ocr_pipeline}` : ''}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-[13px] font-bold px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-1.5">
                  High <span className="text-red-500 dark:text-red-400 text-[14px]">{counts.high}</span>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/40 dash-text text-[13px] font-bold px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-1.5">
                  Low <span className="text-indigo-600 dark:text-indigo-400 text-[14px]">{counts.low}</span>
                </div>
                <div className="bg-teal/10 dark:bg-teal/15 dash-text text-[13px] font-bold px-4 py-2 rounded-xl border border-teal/20 flex items-center gap-1.5">
                  Normal <span className="text-teal text-[14px]">{counts.normal}</span>
                </div>
              </div>

              <div className="w-full overflow-x-auto -mx-1 px-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-1 py-3 text-[13px] font-bold dash-text whitespace-nowrap">Parameter</th>
                      <th className="px-4 py-3 text-[13px] font-bold dash-text whitespace-nowrap">Value</th>
                      <th className="px-4 py-3 text-[13px] font-bold dash-text whitespace-nowrap">Range</th>
                      <th className="px-4 py-3 text-[13px] font-bold dash-text whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {rows.map((r, idx) => {
                      const meta = flagLabel[r.flag] || flagLabel.normal;
                      return (
                        <tr key={idx} className="dash-row-hover transition-colors">
                          <td
                            className={`px-1 py-3 text-[13px] font-bold whitespace-nowrap ${
                              r.flag === 'normal' ? 'dash-text' : 'text-red-500 dark:text-red-400'
                            }`}
                          >
                            {r.name}
                          </td>
                          <td className="px-4 py-3 text-[13px] font-bold dash-text whitespace-nowrap">
                            {r.value} {r.unit}
                          </td>
                          <td className="px-4 py-3 text-[13px] font-medium dash-muted whitespace-nowrap">
                            {formatRange(r)} {r.unit}
                          </td>
                          <td className={`px-4 py-3 text-[13px] font-bold whitespace-nowrap ${meta.cls}`}>
                            {meta.label}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result?.insights && (
            <div className="mt-5 rounded-2xl dash-alert-success p-5 flex items-start gap-3">
              <CheckCircle2 className="shrink-0 mt-0.5 text-teal" size={20} />
              <div>
                <p className="text-[14px] font-bold dash-text mb-1">Plain-language notes</p>
                <p className="text-[13px] dash-text whitespace-pre-wrap leading-relaxed">{result.insights}</p>
                <p className="text-[11px] dash-muted mt-2">Informational only — not medical advice.</p>
              </div>
            </div>
          )}
        </DashPanel>
      </div>

      {pastReports.length > 0 && (
        <DashPanel title="Past lab reports" className="mt-6">
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {pastReports.map((r) => (
              <li key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 dash-row-hover px-1 rounded-lg">
                <div>
                  <p className="text-sm font-semibold dash-text">
                    Report #{r.id} · {(r.extracted_rows || []).length} markers
                  </p>
                  <p className="text-xs dash-muted line-clamp-2">{r.insights || '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setResult(r)}
                  className="text-xs font-bold text-teal hover:underline shrink-0"
                >
                  View again
                </button>
              </li>
            ))}
          </ul>
        </DashPanel>
      )}
    </PageShell>
  );
};

export default LabReportAnalysisPage;

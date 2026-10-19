import { Link } from 'react-router-dom';
import { CheckCircle2, FileType, Loader2, Sparkles } from 'lucide-react';
import MedicineResultItem from './MedicineResultItem';

const EXTRACTION_LABELS = {
  smart_nlp: 'Smart filter (Rx patterns + medicine catalog)',
  'smart_nlp+catalog_compact': 'Smart filter + OCR catalog recovery',
  'smart_nlp+llm': 'Smart filter + AI accuracy pass',
  'smart_nlp+catalog_compact+llm': 'Smart filter + catalog + AI pass',
  llm_filter: 'AI medicine filter',
  combination_formulation: 'Combination formulation detection',
  'catalog_compact+combination': 'OCR catalog + combination merge',
  'smart_nlp+catalog_compact+combination': 'Smart scan + combination merge',
  catalog_compact: 'OCR catalog recovery',
};

const PrescriptionResults = ({
  result,
  isUploading,
  priceByMed,
  comparing,
  compareErr,
  onCompare,
  comparePageBase,
  publicMode,
}) => {
  if (isUploading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 dash-muted" role="status">
        <Loader2 className="animate-spin text-teal mb-4" size={36} />
        <h4 className="text-lg font-medium dash-text mb-2">Reading prescription…</h4>
        <p className="text-sm max-w-xs">
          OCR → filters headers, dates, and junk using Rx patterns + medicine catalog.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 dash-muted min-h-[280px]">
        <FileType size={48} className="mb-4 opacity-50" />
        <p>Upload a prescription to see filtered medicine names here.</p>
        <p className="text-xs mt-2">Click &quot;Compare prices&quot; on each name when ready.</p>
      </div>
    );
  }

  const medicineNames = Array.isArray(result.medicine_names)
    ? result.medicine_names
    : (result.medicines || []).map((m) => m?.name).filter(Boolean);
  const medicineItems =
    Array.isArray(result.medicines) && result.medicines.length
      ? result.medicines
      : medicineNames.map((name) => ({ name, kind: 'single' }));
  const extractedPreview = (result.extracted_text || '').slice(0, 1200);
  const extractionLabel = EXTRACTION_LABELS[result.extraction_engine] || result.extraction_engine || 'Smart filter';

  return (
    <div className="space-y-5 flex-1 flex flex-col">
      <div className="dash-alert-success p-4 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="shrink-0 mt-0.5 text-teal" size={20} />
        <div>
          <p className="font-medium dash-text">
            Found {medicineNames.length} medicine{medicineNames.length === 1 ? '' : 's'}
          </p>
          <p className="text-sm dash-muted mt-1 flex items-center gap-1 flex-wrap">
            <Sparkles size={14} />
            {extractionLabel}
            {result.ocr_engine ? ` · OCR: ${result.ocr_engine}` : ''}
          </p>
        </div>
      </div>

      {extractedPreview ? (
        <details className="rounded-xl dash-inset p-4">
          <summary className="text-sm font-bold dash-text cursor-pointer select-none">View raw OCR text</summary>
          <pre className="mt-3 p-3 rounded-xl dash-code text-xs whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
            {extractedPreview}
            {result.extracted_text?.length > 1200 ? '…' : ''}
          </pre>
        </details>
      ) : null}

      <div className="space-y-3 flex-1">
        {medicineItems.map((med, index) => (
          <MedicineResultItem
            key={`${med?.name || ''}-${index}`}
            med={med}
            index={index}
            priceData={priceByMed[med?.name || '']}
            comparing={comparing}
            err={compareErr[med?.name || '']}
            onCompare={onCompare}
            comparePageBase={comparePageBase}
          />
        ))}
      </div>

      {publicMode && (
        <p className="text-xs dash-muted">
          <Link to="/signup" className="dash-link">
            Create an account
          </Link>{' '}
          to save this prescription to your history.
        </p>
      )}
    </div>
  );
};

export default PrescriptionResults;

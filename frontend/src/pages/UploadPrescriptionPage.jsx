import { useState, useRef } from 'react';

import {

  UploadCloud,

  FileType,

  CheckCircle2,

  AlertCircle,

  X,

  Sparkles,

  IndianRupee,

  Loader2,

  ExternalLink,

} from 'lucide-react';

import { uploadPrescription, compareMedicine } from '../services/api';

import Button from '../components/ui/Button';

import { Link } from 'react-router-dom';

import PageShell from '../components/dashboard/PageShell';

import PageHeader from '../components/dashboard/PageHeader';

import DashPanel from '../components/dashboard/DashPanel';



const MAX_BYTES = 10 * 1024 * 1024;



const UploadPrescriptionPage = ({ publicMode = false }) => {

  const comparePageBase = publicMode ? '/compare' : '/dashboard/compare';

  const [file, setFile] = useState(null);

  const [isDragging, setIsDragging] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const [result, setResult] = useState(null);

  const [error, setError] = useState(null);

  const [priceByMed, setPriceByMed] = useState({});

  const [compareErr, setCompareErr] = useState({});

  const [comparing, setComparing] = useState({});

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);



  const medicineNames = Array.isArray(result?.medicine_names)
    ? result.medicine_names
    : (result?.medicines || []).map((m) => m?.name).filter(Boolean);

  const medicineItems =
    Array.isArray(result?.medicines) && result.medicines.length
      ? result.medicines
      : medicineNames.map((name) => ({ name, kind: 'single' }));

  const extractedPreview = (result?.extracted_text || '').slice(0, 1200);



  const handleDragOver = (e) => {

    e.preventDefault();

    setIsDragging(true);

  };



  const handleDragLeave = () => setIsDragging(false);



  const handleDrop = (e) => {

    e.preventDefault();

    setIsDragging(false);

    validateAndSetFile(e.dataTransfer.files[0]);

  };



  const handleFileChange = (e) => validateAndSetFile(e.target.files[0]);



  const validateAndSetFile = (selectedFile) => {

    setError(null);

    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (!validTypes.includes(selectedFile.type)) {

      setError('Please upload a valid JPG, PNG, or PDF file.');

      return;

    }

    if (selectedFile.size > MAX_BYTES) {

      setError('File size should not exceed 10 MB.');

      return;

    }

    setFile(selectedFile);

    setResult(null);

    setPriceByMed({});

    setCompareErr({});

    setComparing({});

  };



  const handleUpload = async () => {

    if (!file) return;

    setIsUploading(true);

    setError(null);

    setPriceByMed({});

    setCompareErr({});

    try {

      const formData = new FormData();

      formData.append('file', file);

      const data = await uploadPrescription(formData);

      setResult(data || {});

      if (!data?.medicine_names?.length && !data?.medicines?.length) {

        setError('OCR completed but no medicine names were found. Try a clearer photo or PDF.');

      }

    } catch (err) {

      const detail = err.response?.data?.data?.detail;

      const msg =

        err.response?.data?.message ||

        err.response?.data?.error ||

        detail ||

        err.message ||

        'Failed to process prescription. Please try again.';

      setError(msg);

    } finally {

      setIsUploading(false);

    }

  };



  const handleComparePrices = async (name) => {

    if (!name?.trim()) return;

    setComparing((c) => ({ ...c, [name]: true }));

    setCompareErr((e) => ({ ...e, [name]: '' }));

    try {

      const data = await compareMedicine(name);

      setPriceByMed((p) => ({ ...p, [name]: data }));

    } catch (err) {

      const msg =

        err.response?.data?.message ||

        err.message ||

        'Could not fetch prices. Check backend / Playwright.';

      setCompareErr((e) => ({ ...e, [name]: msg }));

    } finally {

      setComparing((c) => ({ ...c, [name]: false }));

    }

  };



  const extractionLabels = {
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
  const extractionLabel =
    extractionLabels[result?.extraction_engine] ||
    result?.extraction_engine ||
    'Smart filter';

  return (

    <PageShell className="max-w-6xl">

      <PageHeader
        title="Upload prescription"
        subtitle="OCR reads your file → smart filter extracts medicine names → compare prices when you choose."
        icon={UploadCloud}
        lightSurface={publicMode}
      />



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        <DashPanel
          title="Upload prescription file"
          lightSurface={publicMode}
          className={publicMode ? 'dna-pattern border-lime/15' : ''}
          bodyClassName="flex flex-col flex-1"
        >

          <div

            role="button"

            tabIndex={0}

            onKeyDown={(e) => e.key === 'Enter' && !file && fileInputRef.current?.click()}

            className={`dash-inset-dashed flex-1 min-h-[280px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${

              isDragging ? 'border-teal bg-teal/10' : ''

            } ${file ? 'border-teal bg-teal/5 dark:bg-teal/10' : ''}`}

            onDragOver={handleDragOver}

            onDragLeave={handleDragLeave}

            onDrop={handleDrop}

            onClick={() => !file && fileInputRef.current?.click()}

          >

            <input

              type="file"

              ref={fileInputRef}

              onChange={handleFileChange}

              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"

              className="hidden"

            />

            <input

              type="file"

              ref={cameraInputRef}

              onChange={handleFileChange}

              accept="image/*"

              capture="environment"

              className="hidden"

            />

            {!file ? (

              <>

                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">

                  <UploadCloud size={32} className="dash-muted" />

                </div>

                <h4 className="text-lg font-medium dash-text mb-2">Drag & drop your file here</h4>

                <p className="text-sm dash-muted mb-6">or</p>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">

                  <Button

                    variant="outline"

                    className="min-h-11 flex-1"

                    onClick={(e) => {

                      e.stopPropagation();

                      fileInputRef.current?.click();

                    }}

                  >

                    Choose file

                  </Button>

                  <Button

                    variant="outline"

                    className="min-h-11 flex-1 sm:hidden"

                    onClick={(e) => {

                      e.stopPropagation();

                      cameraInputRef.current?.click();

                    }}

                  >

                    Take photo

                  </Button>

                </div>

                <p className="text-xs dash-muted mt-6">JPG, PNG, PDF · max 10 MB</p>

              </>

            ) : (

              <div className="w-full flex flex-col items-center">

                <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mb-4 text-teal">

                  <FileType size={32} />

                </div>

                <p className="font-medium dash-text truncate w-full max-w-xs mb-1">{file.name}</p>

                <p className="text-sm dash-muted mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                <div className="flex gap-3 flex-wrap justify-center">

                  <Button

                    variant="outline"

                    onClick={(e) => {

                      e.stopPropagation();

                      setFile(null);

                      setResult(null);

                      setError(null);

                      setPriceByMed({});

                      setCompareErr({});

                    }}

                    className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"

                  >

                    <X size={16} className="mr-1" /> Remove

                  </Button>

                  <Button

                    variant="primary"

                    onClick={(e) => {

                      e.stopPropagation();

                      handleUpload();

                    }}

                    disabled={isUploading}

                  >

                    {isUploading ? 'Extracting names…' : 'Extract medicine names'}

                  </Button>

                </div>

              </div>

            )}

          </div>

          {error && (

            <div className="mt-4 rounded-xl dash-alert-error px-4 py-3 flex items-start gap-2 text-sm">

              <AlertCircle size={18} className="shrink-0 mt-0.5" />

              <p>{error}</p>

            </div>

          )}

        </DashPanel>



        <DashPanel
          title="Medicine names"
          lightSurface={publicMode}
          className={publicMode ? 'dna-pattern border-teal/15' : ''}
          bodyClassName="flex flex-col flex-1"
        >

          {isUploading ? (

            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 dash-muted">

              <Loader2 className="animate-spin text-teal mb-4" size={36} />

              <h4 className="text-lg font-medium dash-text mb-2">Reading prescription…</h4>

              <p className="text-sm max-w-xs">

                OCR → filters headers, dates, and junk using Rx patterns + medicine catalog.

              </p>

            </div>

          ) : result ? (

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

                  <summary className="text-sm font-bold dash-text cursor-pointer select-none">

                    View raw OCR text

                  </summary>

                  <pre className="mt-3 p-3 rounded-xl dash-code text-xs whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">

                    {extractedPreview}

                    {result.extracted_text?.length > 1200 ? '…' : ''}

                  </pre>

                </details>

              ) : null}



              <div className="space-y-3 flex-1">

                {medicineItems.map((med, index) => {
                  const name = med?.name || '';
                  const prices = priceByMed[name]?.prices || [];
                  const isLoading = comparing[name];
                  const err = compareErr[name];
                  const sorted = [...prices].sort((a, b) => Number(a.price) - Number(b.price));
                  const ingredients = Array.isArray(med?.ingredients) ? med.ingredients : [];
                  const brandEquivalents = Array.isArray(med?.brand_equivalents) ? med.brand_equivalents : [];

                  return (

                    <div

                      key={`${name}-${index}`}

                      className="dash-list-row space-y-3"

                    >

                      <div className="flex items-center justify-between gap-3">

                        <div className="flex items-center gap-3 min-w-0">

                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal text-sm font-bold">

                            {index + 1}

                          </span>

                          <div className="min-w-0">
                            <h4 className="font-bold dash-text">{name}</h4>
                            {med?.kind === 'combination' ? (
                              <p className="text-xs dash-muted mt-0.5">Combination formulation</p>
                            ) : null}
                          </div>

                        </div>

                        <Button

                          variant="primary"

                          size="sm"

                          disabled={isLoading}

                          onClick={() => handleComparePrices(name)}

                          className="shrink-0 gap-1.5"

                        >

                          {isLoading ? (

                            <>

                              <Loader2 size={14} className="animate-spin" /> Fetching…

                            </>

                          ) : (

                            <>

                              <IndianRupee size={14} /> Compare prices

                            </>

                          )}

                        </Button>

                      </div>

                      {ingredients.length ? (
                        <details className="rounded-xl dash-inset px-3 py-2">
                          <summary className="text-xs font-bold dash-text cursor-pointer select-none">
                            View ingredients ({ingredients.length})
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs dash-muted list-disc pl-4">
                            {ingredients.map((ing) => (
                              <li key={ing}>{ing}</li>
                            ))}
                          </ul>
                        </details>
                      ) : null}

                      {brandEquivalents.length ? (
                        <div className="space-y-2">
                          <p className="text-xs font-bold dash-muted">Equivalent brands for price comparison</p>
                          <div className="flex flex-wrap gap-2">
                            {brandEquivalents.map((brand) => (
                              <Button
                                key={brand}
                                variant="outline"
                                size="sm"
                                disabled={comparing[brand]}
                                onClick={() => handleComparePrices(brand)}
                                className="text-xs font-semibold"
                              >
                                {comparing[brand] ? 'Fetching…' : brand}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : null}



                      {err && (

                        <p className="text-xs text-red-600 dark:text-red-400 pl-11">{err}</p>

                      )}



                      {sorted.length > 0 && (

                        <ul className="pl-11 space-y-2 border-t border-slate-200 dark:border-slate-600 pt-3">

                          {sorted.slice(0, 6).map((row, i) => (

                            <li

                              key={`${row.pharmacy_name}-${i}`}

                              className="flex flex-wrap items-center justify-between gap-2 text-sm"

                            >

                              <span className="dash-muted">

                                {row.pharmacy_name}

                                {row.pack_size ? ` · ${row.pack_size}` : ''}

                              </span>

                              <span className="flex items-center gap-2">

                                <span className="font-bold text-teal tabular-nums">

                                  ₹{Number(row.price).toFixed(2)}

                                </span>

                                {row.url ? (

                                  <a

                                    href={row.url}

                                    target="_blank"

                                    rel="noopener noreferrer"

                                    className="text-teal hover:underline inline-flex items-center gap-0.5 text-xs"

                                  >

                                    Buy <ExternalLink size={12} />

                                  </a>

                                ) : null}

                              </span>

                            </li>

                          ))}

                          <li className="pt-1">

                            <Link

                              to={`${comparePageBase}?m=${encodeURIComponent(name)}`}

                              className="text-xs dash-link"

                            >

                              Full comparison →

                            </Link>

                          </li>

                        </ul>

                      )}

                    </div>

                  );

                })}

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

          ) : (

            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 dash-muted min-h-[280px]">

              <FileType size={48} className="mb-4 opacity-50" />

              <p>Upload a prescription to see filtered medicine names here.</p>

              <p className="text-xs mt-2">Click &quot;Compare prices&quot; on each name when ready.</p>

            </div>

          )}

        </DashPanel>

      </div>

    </PageShell>

  );

};



export default UploadPrescriptionPage;



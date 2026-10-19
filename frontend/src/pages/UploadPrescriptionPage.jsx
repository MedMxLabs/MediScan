import { useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { uploadPrescription, compareMedicine } from '../services/api';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import DashPanel from '../components/dashboard/DashPanel';
import PrescriptionDropzone from '../components/prescription/PrescriptionDropzone';
import PrescriptionResults from '../components/prescription/PrescriptionResults';

const MAX_BYTES = 10 * 1024 * 1024;

const UploadPrescriptionPage = ({ publicMode = false }) => {
  const comparePageBase = publicMode ? '/compare' : '/dashboard/compare';
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [priceByMed, setPriceByMed] = useState({});
  const [compareErr, setCompareErr] = useState({});
  const [comparing, setComparing] = useState({});

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

  const handleRemove = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setPriceByMed({});
    setCompareErr({});
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
          <PrescriptionDropzone
            file={file}
            onFileSelected={validateAndSetFile}
            onRemove={handleRemove}
            onExtract={handleUpload}
            isUploading={isUploading}
          />
          {error && (
            <div className="mt-4 rounded-xl dash-alert-error px-4 py-3 flex items-start gap-2 text-sm" role="alert">
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
          <PrescriptionResults
            result={result}
            isUploading={isUploading}
            priceByMed={priceByMed}
            comparing={comparing}
            compareErr={compareErr}
            onCompare={handleComparePrices}
            comparePageBase={comparePageBase}
            publicMode={publicMode}
          />
        </DashPanel>
      </div>
    </PageShell>
  );
};

export default UploadPrescriptionPage;

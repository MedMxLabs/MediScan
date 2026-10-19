import { useRef, useState } from 'react';
import { UploadCloud, FileType, X } from 'lucide-react';
import Button from '../ui/Button';
import { activateOnEnterOrSpace } from '../../utils/a11y';

const PrescriptionDropzone = ({ file, onFileSelected, onRemove, onExtract, isUploading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const pickFile = () => fileInputRef.current?.click();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    onFileSelected(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => onFileSelected(e.target.files[0]);

  return (
    <div
      role={file ? undefined : 'button'}
      tabIndex={file ? undefined : 0}
      aria-label={file ? undefined : 'Choose or drop a prescription file (JPG, PNG or PDF, max 10 MB)'}
      onKeyDown={file ? undefined : (e) => activateOnEnterOrSpace(e, pickFile)}
      className={`dash-inset-dashed flex-1 min-h-[280px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
        isDragging ? 'border-teal bg-teal/10' : ''
      } ${file ? 'border-teal bg-teal/5 dark:bg-teal/10' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && pickFile()}
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
                pickFile();
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
                onRemove();
              }}
              className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
            >
              <X size={16} className="mr-1" /> Remove
            </Button>
            <Button
              variant="primary"
              onClick={(e) => {
                e.stopPropagation();
                onExtract();
              }}
              disabled={isUploading}
            >
              {isUploading ? 'Extracting names…' : 'Extract medicine names'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionDropzone;

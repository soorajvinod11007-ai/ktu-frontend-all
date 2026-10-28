import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, X, UploadCloud } from 'lucide-react';
import { clsx } from 'clsx';
import { uploadApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Button, Card, Badge, Select, Spinner } from '../../components/UI/index';
import { FILE_TYPES } from '../../utils/formatters';

const STEPS = ['Select & Upload', 'Preview', 'Confirmed'];

export default function UploadScreen() {
  const toast = useToast();
  const fileRef = useRef(null);

  const [step, setStep] = useState(0);
  const [fileType, setFileType] = useState('result');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [skipErrors, setSkipErrors] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const reset = () => { setStep(0); setFile(null); setPreview(null); setSkipErrors(false); };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('file_type', fileType);
    try {
      const { data } = await uploadApi.preview(fd);
      setPreview(data);
      setStep(1);
    } catch (err) {
      toast(err.response?.data?.error?.message ?? 'Upload failed', 'error');
    } finally { setUploading(false); }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await uploadApi.confirm(preview.upload_id);
      setStep(2);
      toast('Data saved successfully!', 'success');
    } catch (err) {
      toast(err.response?.data?.error?.message ?? 'Confirm failed', 'error');
    } finally { setConfirming(false); }
  };

  const handleCancel = async () => {
    if (preview?.upload_id) {
      try { await uploadApi.cancel(preview.upload_id); } catch (_) {}
    }
    reset();
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-fg">Upload Files</h1>
        <p className="text-sm text-fg-muted mt-0.5">Import student lists, results, grade cards and more</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
              i < step ? 'bg-accent text-background' : i === step ? 'bg-accent/20 text-accent border border-accent' : 'bg-muted text-fg-muted'
            )}>
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={clsx('text-sm', i === step ? 'text-fg font-medium' : 'text-fg-muted')}>{label}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 0: Select file */}
      {step === 0 && (
        <Card className="flex flex-col gap-5">
          <Select label="File Type" value={fileType} onChange={(e) => setFileType(e.target.value)}>
            {FILE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all',
              dragging || file ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-white/2'
            )}
            role="button"
            aria-label="Upload file"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.csv,.pdf" hidden onChange={(e) => setFile(e.target.files[0])} />
            <UploadCloud size={40} className={clsx('transition-colors', file ? 'text-accent' : 'text-fg-muted')} />
            {file ? (
              <div className="text-center">
                <p className="text-fg font-medium">{file.name}</p>
                <p className="text-xs text-fg-muted mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-fg text-sm font-medium">Drop file here or click to browse</p>
                <p className="text-xs text-fg-muted mt-1">Supports .xlsx, .csv, .pdf</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpload} loading={uploading} disabled={!file} icon={Upload}>
              Upload & Preview
            </Button>
          </div>
        </Card>
      )}

      {/* Step 1: Preview */}
      {step === 1 && preview && (
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Rows',    value: preview.summary.rows_total,       color: 'rgb(var(--color-fg-muted))' },
              { label: 'Valid',         value: preview.summary.rows_ok,           color: '#22C55E' },
              { label: 'Errors',        value: preview.summary.rows_with_errors,  color: '#EF4444' },
              { label: 'Updates',       value: preview.summary.updates,           color: '#F59E0B' },
            ].map((s) => (
              <Card key={s.label} className="text-center py-4">
                <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-fg-muted mt-1">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Errors */}
          {preview.errors?.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-fg">Parse Errors</h3>
              </div>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {preview.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-xs">
                    <XCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                    <div>
                      <span className="text-fg-muted">Page {err.page}, Row {err.row}: </span>
                      <span className="text-fg">{err.message}</span>
                    </div>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm text-fg cursor-pointer">
                <input type="checkbox" checked={skipErrors} onChange={(e) => setSkipErrors(e.target.checked)} className="accent-accent" />
                Skip error rows and import valid rows only
              </label>
            </Card>
          )}

          {/* Sample rows */}
          {preview.sample_rows?.length > 0 && (
            <Card noPad>
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-fg">Sample Rows (preview)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {Object.keys(preview.sample_rows[0]).map((k) => (
                        <th key={k} className="px-4 py-2 text-left text-fg-muted uppercase tracking-wider">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample_rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 table-row-hover">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-4 py-2 text-fg font-mono">{String(val ?? '—')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="danger" icon={X} onClick={handleCancel}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              loading={confirming}
              disabled={preview.errors?.length > 0 && !skipErrors}
              icon={CheckCircle}
            >
              Confirm & Import
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Success */}
      {step === 2 && (
        <Card className="flex flex-col items-center gap-4 py-12">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
            <CheckCircle size={36} className="text-accent" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-fg">Import Successful!</h2>
            <p className="text-sm text-fg-muted mt-1">
              {preview?.summary.rows_ok} rows imported successfully.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={reset}>Upload Another</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

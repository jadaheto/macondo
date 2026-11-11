'use client';

import { useId, useRef, useState, type DragEvent } from 'react';
import type { ResourceDTO } from '@macondo/shared';
import { apiFetch } from '@/lib/api';
import { formatBytes, localUploadProblem, uploadErrorMessage, UPLOAD_RULES, type UploadKind } from '@/lib/adminData';
import { Ri } from './ui';

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'file-pdf-2-line';
  if (ext === 'mp3') return 'file-music-line';
  if (ext === 'epub') return 'book-open-line';
  if (ext === 'zip') return 'folder-zip-line';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image-line';
  return 'file-text-line';
}

/**
 * Zona de carga con el lenguaje de adjuntos PQR (§6 «Carga, avisos y adjuntos»): botón y arrastre,
 * lista con nombre y tamaño, eliminación real y mensaje por archivo rechazado. Comportamiento en
 * React (sin pqr-attachments.js); un archivo por carga, como exige la API.
 */
export function UploadZone({ token, kind, label, accept, url, current, onUploaded }: {
  token: string; kind: UploadKind; label: string; accept: string; url: string; current: string;
  onUploaded: (r: ResourceDTO | null) => void;
}) {
  const rule = UPLOAD_RULES[kind];
  const uid = useId().replace(/:/g, '');
  const inputId = `up-${kind}-${uid}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const pick = (f: File | null | undefined) => {
    setResult(null);
    if (!f) return;
    setFile(f);
    setProblem(localUploadProblem(f, kind));
  };

  const clear = () => {
    setFile(null);
    setProblem(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const upload = async () => {
    if (!file || problem) return;
    const fd = new FormData();
    fd.append('file', file);
    setBusy(true);
    setResult(null);
    try {
      const r = await apiFetch<ResourceDTO>(url, { method: 'POST', formData: fd, token, timeoutMs: 10 * 60_000 });
      setResult({ ok: true, text: `«${file.name}» se subió y el servidor validó su contenido.` });
      onUploaded(r && typeof r === 'object' && 'id' in r ? r : null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (e) {
      setResult({ ok: false, text: uploadErrorMessage(e as { status?: number | null; message?: string; details?: unknown }, file.name, kind) });
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const files = Array.from(e.dataTransfer.files);
    pick(files[0]);
    if (files.length > 1) {
      const extra = files.slice(1).map((f) => `«${f.name}»`).join(', ');
      setResult({ ok: false, text: `Solo se admite un archivo por carga: se descartó ${extra}.` });
    }
  };

  const rejected = problem ?? (result && !result.ok ? result.text : null);

  return (
    <div className={`pqr-attachments madm-upload${file ? ' has-files' : ''}${dragging ? ' is-dragging' : ''}`}>
      <label htmlFor={inputId}>{label}</label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="visually-hidden"
        tabIndex={-1}
        aria-describedby={`${inputId}-help ${inputId}-status`}
        onChange={(e) => pick(e.target.files?.[0])}
        disabled={busy}
      />
      <div className="pqr-attachments-layout">
        <div
          className="pqr-files-drop"
          onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <Ri name="upload-cloud-2-line" className="pqr-files-cloud" />
          <span>
            <strong>Arrastra y suelta el archivo aquí</strong>
            <small>O selecciónalo desde tu equipo · {rule.label}</small>
          </span>
          <button type="button" className="btn btn-outline-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {file ? 'Cambiar archivo' : 'Seleccionar archivo'}
          </button>
        </div>
        {file && (
          <ul className="pqr-files-list" aria-label={`${label}: archivo seleccionado`}>
            <li className="pqr-file-item">
              <Ri name={fileIcon(file.name)} className="pqr-file-type" />
              <span className="pqr-file-name" title={file.name}>{file.name}</span>
              <small className="pqr-file-size">{formatBytes(file.size)}</small>
              {problem
                ? <i className="ri-error-warning-line pqr-file-invalid" role="img" aria-label={problem} title={problem} />
                : <i className="ri-checkbox-circle-fill pqr-file-valid" role="img" aria-label="Formato y tamaño comprobados localmente" title="Formato y tamaño comprobados localmente" />}
              <button type="button" className="pqr-file-remove" aria-label={`Quitar ${file.name}`} title={`Quitar ${file.name}`} onClick={clear} disabled={busy}>
                <Ri name="close-line" />
              </button>
            </li>
          </ul>
        )}
      </div>
      <small id={`${inputId}-help`} className="text-muted d-block mt-1">
        Un archivo de máximo {rule.maxMb} MB. Formatos: {rule.label}. {current}.
      </small>
      <div className="pqr-files-footer">
        <small id={`${inputId}-status`} aria-live="polite">
          {busy ? 'Subiendo y validando en el servidor…' : file ? '1 archivo seleccionado' : 'Ningún archivo seleccionado'}
        </small>
        <button type="button" className="btn btn-pqr madm-upload-btn" disabled={!file || !!problem || busy} onClick={upload}>
          {busy
            ? <><span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />Subiendo…</>
            : <><Ri name="upload-2-line" className="me-1" />Subir {kind === 'cover' ? 'portada' : 'archivo'}</>}
        </button>
      </div>
      {rejected && (
        <div className="pqr-files-messages madm-files-error" role="alert">
          <p><Ri name="error-warning-line" className="me-1" />{rejected}</p>
        </div>
      )}
      {result?.ok && (
        <div className="pqr-files-messages madm-files-ok" role="status">
          <p><Ri name="checkbox-circle-line" className="me-1" />{result.text}</p>
        </div>
      )}
    </div>
  );
}

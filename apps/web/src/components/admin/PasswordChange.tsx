'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { API_ROUTES, ChangePasswordSchema, PASSWORD_MIN_LENGTH } from '@macondo/shared';
import { Ri, AdminNotice, type Notice } from './ui';

/**
 * Diálogo «Cambiar contraseña» del panel (marcado PQR / Bootstrap, como el resto del admin).
 * Valida con el mismo esquema que la API, muestra el error junto al campo y enfoca el primero
 * con error. Tras el cambio exitoso la sesión actual sigue siendo válida (JWT de 8 h).
 */
export function PasswordChange({ token, onClose, onChanged }: { token: string; onClose: () => void; onChanged: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const currentRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);
  const repeatRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    currentRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const parsed = ChangePasswordSchema.safeParse({ currentPassword: current, newPassword: next });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] === 'currentPassword' ? 'current' : 'next';
        if (!errs[k]) errs[k] = issue.path[0] === 'currentPassword' ? 'Escribe tu contraseña actual' : issue.message;
      }
    }
    if (next !== repeat) errs.repeat = 'Las contraseñas no coinciden';
    setErrors(errs);
    if (Object.keys(errs).length) {
      (errs.current ? currentRef : errs.next ? nextRef : repeatRef).current?.focus();
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(API_ROUTES.password, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(parsed.success ? parsed.data : {}),
      });
      if (res.status === 401) {
        setErrors({ current: 'La contraseña actual no es correcta' });
        currentRef.current?.focus();
        return;
      }
      if (res.status === 429) {
        setNotice({ tone: 'warning', text: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.' });
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
        const msg = Array.isArray(body?.message) ? body?.message.join(' ') : body?.message;
        setNotice({ tone: 'danger', text: msg || `No se pudo cambiar la contraseña (error ${res.status}).` });
        return;
      }
      onChanged();
    } catch {
      setNotice({ tone: 'danger', text: 'Sin conexión con el servidor. Inténtalo de nuevo.' });
    } finally {
      setBusy(false);
    }
  }

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    ref: React.RefObject<HTMLInputElement | null>,
    err?: string,
    help?: string,
    autoComplete?: string,
  ) => (
    <div className="mb-3">
      <label htmlFor={id} className="form-label fw-semibold">
        {label} <span className="text-danger" aria-hidden="true">*</span>
      </label>
      <input
        ref={ref}
        id={id}
        type="password"
        className={`form-control pqr-input${err ? ' is-invalid' : ''}`}
        value={value}
        onChange={(e) => set(e.target.value)}
        required
        autoComplete={autoComplete}
        aria-invalid={Boolean(err)}
        aria-describedby={err ? `${id}-err` : help ? `${id}-help` : undefined}
      />
      {err ? (
        <div id={`${id}-err`} className="invalid-feedback d-block">{err}</div>
      ) : help ? (
        <div id={`${id}-help`} className="form-text">{help}</div>
      ) : null}
    </div>
  );

  return (
    <div className="modal d-block madm-modal" role="dialog" aria-modal="true" aria-labelledby="pwd-title" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content pqr-card">
          <form onSubmit={submit} noValidate>
            <div className="modal-header">
              <h2 id="pwd-title" className="modal-title h5 mb-0">
                <Ri name="lock-password-line" className="me-2" />
                Cambiar contraseña
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <AdminNotice notice={notice} onClose={() => setNotice(null)} />
              {field('pwd-current', 'Contraseña actual', current, setCurrent, currentRef, errors.current, undefined, 'current-password')}
              {field('pwd-next', 'Nueva contraseña', next, setNext, nextRef, errors.next, `Mínimo ${PASSWORD_MIN_LENGTH} caracteres, con letras y números.`, 'new-password')}
              {field('pwd-repeat', 'Repite la nueva contraseña', repeat, setRepeat, repeatRef, errors.repeat, undefined, 'new-password')}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose} disabled={busy}>Cancelar</button>
              <button type="submit" className="btn btn-pqr" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar nueva contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { API_ROUTES, LoginSchema, type LoginResponse } from '@macondo/shared';
import { apiFetch, ApiError, errorMessage, setUnauthorizedHandler } from '@/lib/api';
import { clearSession, getSession, setSession } from '@/lib/adminAuth';
import { AdminLoading, Ri } from '@/components/admin/ui';
import { Dashboard } from '@/components/admin/Dashboard';
import { ResourcesAdmin } from '@/components/admin/ResourcesAdmin';
import { TvAdmin } from '@/components/admin/TvAdmin';
import { AuditAdmin } from '@/components/admin/AuditAdmin';
import { ChallengesAdmin } from '@/components/admin/ChallengesAdmin';
import { CuentosAdmin } from '@/components/admin/CuentosAdmin';
import { PasswordChange } from '@/components/admin/PasswordChange';

type Tab = 'resumen' | 'recursos' | 'retos' | 'cuentos' | 'tv' | 'auditoria';

const LOGO = '/brand/images/logo_comfasucre.png';

export default function AdminPage() {
  const [session, setSess] = useState<LoginResponse | null>(null);
  const [checked, setChecked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('resumen');
  const [pwdOpen, setPwdOpen] = useState(false);

  const logout = useCallback((msg?: string) => {
    clearSession();
    setSess(null);
    setNotice(msg ?? null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout('Tu sesión expiró. Ingresa de nuevo.'));
    const s = getSession();
    setSess(s);
    setChecked(true);
    if (s) {
      // Validar el token guardado; un 401 dispara el manejador y vuelve al login.
      apiFetch(API_ROUTES.me, { token: s.accessToken }).catch(() => undefined);
    }
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  if (!checked) {
    return (
      <div className="madm-login">
        <div className="pqr-shell"><AdminLoading label="Comprobando sesión…" /></div>
      </div>
    );
  }
  if (!session) return <Login notice={notice} onLogin={(s) => { setSession(s); setSess(s); setNotice(null); }} />;

  const isAdmin = session.user.role === 'ADMIN';
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'resumen', label: 'Resumen', icon: 'bar-chart-box-line' },
    { id: 'recursos', label: 'Recursos', icon: 'book-2-line' },
    { id: 'retos', label: 'Retos', icon: 'trophy-line' },
    { id: 'cuentos', label: 'Taller de cuentos', icon: 'quill-pen-line' },
    { id: 'tv', label: 'Macondo TV', icon: 'tv-2-line' },
    ...(isAdmin ? [{ id: 'auditoria' as Tab, label: 'Auditoría', icon: 'shield-check-line' }] : []),
  ];
  const token = session.accessToken;

  return (
    <div id="layout-wrapper" className="madm">
      <a className="madm-skip" href="#contenido">Saltar al contenido</a>
      {pwdOpen && (
        <PasswordChange
          token={token}
          onClose={() => setPwdOpen(false)}
          onChanged={() => {
            setPwdOpen(false);
            setNotice('Contraseña actualizada. Úsala la próxima vez que ingreses.');
          }}
        />
      )}
      <header id="page-topbar" className="madm-topbar">
        <div className="layout-width">
          <div className="navbar-header madm-header">
            <div className="madm-brand">
              <img className="madm-logo" src={LOGO} alt="Comfasucre" width={136} height={56} />
              <span className="madm-app">
                <strong>Macondo Digital</strong>
                <span aria-hidden="true"> · </span>
                <span>Administración</span>
              </span>
            </div>
            <div className="madm-user">
              <span className="madm-user-name">
                <Ri name="user-line" />
                <span className="madm-ellipsis">{session.user.name}</span>
                <span className="pqr-badge info">{isAdmin ? 'Administrador' : 'Bibliotecario'}</span>
              </span>
              <button type="button" className="btn btn-light madm-logout" onClick={() => setPwdOpen(true)}>
                <Ri name="lock-password-line" className="me-1" />
                Cambiar contraseña
              </button>
              <button type="button" className="btn btn-light madm-logout" onClick={() => logout('Cerraste sesión.')}>
                <Ri name="logout-box-r-line" className="me-1" />
                Cerrar sesión
              </button>
            </div>
          </div>
          <nav aria-label="Secciones del panel" className="madm-nav">
            <ul role="tablist">
              {tabs.map((t) => (
                <li key={t.id} role="presentation">
                  <button
                    type="button"
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-controls="contenido"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                  >
                    <Ri name={t.icon} />
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="main-content">
        <div className="page-content" id="contenido" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={-1}>
          {tab === 'resumen' && <Dashboard token={token} onOpenResources={() => setTab('recursos')} onOpenChallenges={() => setTab('retos')} onOpenCuentos={() => setTab('cuentos')} />}
          {tab === 'recursos' && <ResourcesAdmin token={token} />}
          {tab === 'retos' && <ChallengesAdmin token={token} />}
          {tab === 'cuentos' && <CuentosAdmin token={token} />}
          {tab === 'tv' && <TvAdmin token={token} />}
          {tab === 'auditoria' && isAdmin && <AuditAdmin token={token} />}
        </div>
      </main>
    </div>
  );
}

function Login({ onLogin, notice }: { onLogin: (s: LoginResponse) => void; notice: string | null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = LoginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      const fe: { email?: string; password?: string } = {};
      for (const i of parsed.error.issues) {
        if (i.path[0] === 'email') fe.email ??= 'Escribe un correo válido (ej.: nombre@colegio.edu.co).';
        if (i.path[0] === 'password') fe.password ??= 'La contraseña tiene al menos 8 caracteres.';
      }
      setFieldErr(fe);
      setError('Escribe un correo válido y una contraseña de al menos 8 caracteres.');
      (fe.email ? emailRef : passRef).current?.focus();
      return;
    }
    setFieldErr({});
    setBusy(true);
    try {
      const res = await apiFetch<LoginResponse>(API_ROUTES.login, { method: 'POST', body: parsed.data });
      if (!res?.accessToken) throw new ApiError('parse', 'Respuesta de inicio de sesión inesperada.');
      onLogin(res);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Correo o contraseña incorrectos.' : errorMessage(err));
    } finally {
      setBusy(false);
      setPassword('');
    }
  };

  return (
    <main id="contenido" className="madm-login">
      <div className="container-fluid pqr-shell madm-login-shell">
        <section className="card pqr-card madm-login-card">
          <div className="madm-login-head">
            <img className="madm-logo" src={LOGO} alt="Comfasucre" width={136} height={56} />
            <span className="pqr-kicker">Macondo Digital · Administración</span>
            <h1 className="madm-login-title">Ingreso para bibliotecarios</h1>
            <p>Acceso solo para personal autorizado. Los estudiantes no necesitan cuenta.</p>
          </div>
          <div className="card-body madm-login-body">
            {notice && (
              <div className="madm-alert info" role="status">
                <Ri name="information-line" />
                <p>{notice}</p>
              </div>
            )}
            <form onSubmit={submit} noValidate>
              <div className="mb-3">
                <label htmlFor="email" className="required">Correo electrónico</label>
                <div className="input-group pqr-icon-field">
                  <span className="input-group-text"><Ri name="mail-line" /></span>
                  <input
                    ref={emailRef}
                    id="email"
                    type="email"
                    autoComplete="username"
                    className={`form-control${fieldErr.email ? ' is-invalid' : ''}`}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErr((f) => ({ ...f, email: undefined })); }}
                    aria-invalid={!!fieldErr.email || undefined}
                    aria-describedby={fieldErr.email ? 'email-err' : undefined}
                    required
                  />
                </div>
                {fieldErr.email && <div id="email-err" className="invalid-feedback d-block">{fieldErr.email}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="required">Contraseña</label>
                <div className="input-group pqr-icon-field">
                  <span className="input-group-text"><Ri name="lock-line" /></span>
                  <input
                    ref={passRef}
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className={`form-control${fieldErr.password ? ' is-invalid' : ''}`}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErr((f) => ({ ...f, password: undefined })); }}
                    aria-invalid={!!fieldErr.password || undefined}
                    aria-describedby={fieldErr.password ? 'password-err' : 'password-help'}
                    required
                    minLength={8}
                  />
                </div>
                {fieldErr.password
                  ? <div id="password-err" className="invalid-feedback d-block">{fieldErr.password}</div>
                  : <small id="password-help" className="pqr-help">Mínimo 8 caracteres. La sesión se cierra al cerrar la pestaña.</small>}
              </div>
              {error && (
                <div className="madm-alert danger" role="alert">
                  <Ri name="error-warning-line" />
                  <p>{error}</p>
                </div>
              )}
              <button type="submit" className="btn btn-pqr w-100" disabled={busy}>
                {busy
                  ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Ingresando…</>
                  : <><Ri name="login-box-line" className="me-1" />Ingresar</>}
              </button>
            </form>
          </div>
        </section>
        <p className="madm-login-foot">Biblioteca Macondo · Comfasucre</p>
      </div>
    </main>
  );
}

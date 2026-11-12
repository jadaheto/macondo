'use client';

import Link from 'next/link';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { API_ROUTES, type CuentoCreadoDTO, type CuentoDTO, type CuentoOpcionInfo, type CuentosDisponibleDTO } from '@macondo/shared';
import { useGradeBand } from '@/components/GradeBandProvider';
import { BandChooser } from '@/components/BandChooser';
import { Cargando } from '@/components/StateViews';
import { Icon } from '@/components/Icon';
import { TriviaQuiz } from '@/components/ChallengePlayers';
import { CuentoCover } from '@/components/CuentoCover';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import {
  bandaHabilitada, COPY, cuentoListo, deviceId, estaGuardado, guardadoADTO, guardarMiCuento, INITIAL_STATE, listarMisCuentos, LUGARES, opcionesParaEnviar,
  seguirConsultando, TIPOS, VALORES, wizardReducer,
} from '@/lib/cuentos';

const POLL_MS = 2500;
const MAX_POLL_MS = 180_000;

/** Taller de cuentos (ADR-018): asistente de 3 pasos → generación → resultado. Solo bandas 1-3 y 4-5. */
export default function ConstruyeTuCuentoPage() {
  const { band, config, ready } = useGradeBand();
  const [disp, setDisp] = useState<CuentosDisponibleDTO | null | undefined>(undefined);
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);
  const [cuento, setCuento] = useState<CuentoDTO | null>(null);
  const [desdeLocal, setDesdeLocal] = useState(false);
  const xl = config.density === 'xl';

  useEffect(() => {
    let alive = true;
    apiFetch<CuentosDisponibleDTO>(API_ROUTES.cuentosDisponible, { timeoutMs: 8000 })
      .then((d) => { if (alive) setDisp(d); })
      .catch(() => { if (alive) setDisp(null); });
    // Abrir un cuento guardado en esta tablet: /construye-tu-cuento?cuento=<id>
    const wanted = new URLSearchParams(window.location.search).get('cuento');
    if (wanted) {
      const local = listarMisCuentos().find((c) => c.id === wanted);
      if (local) {
        setCuento(guardadoADTO(local));
        setDesdeLocal(true);
        dispatch({ type: 'enviado', id: local.id });
        dispatch({ type: 'listo' });
      }
    }
    return () => { alive = false; };
  }, []);

  // Envío al pasar a «generando» (una sola vez por cuento) y sondeo del estado.
  const sentFor = useRef<string | null>(null);
  useEffect(() => {
    if (state.paso !== 'generando' || state.cuentoId || !band) return;
    const key = `${state.protagonista}|${state.tipo}|${state.lugar}|${state.valor}|${state.autorNombre}`;
    if (sentFor.current === key) return;
    sentFor.current = key;
    let alive = true;
    apiFetch<CuentoCreadoDTO>(API_ROUTES.cuentos, { method: 'POST', body: opcionesParaEnviar(state, band, deviceId()), timeoutMs: 20_000 })
      .then((r) => { if (alive) dispatch({ type: 'enviado', id: r.id }); })
      .catch((e: unknown) => {
        if (!alive) return;
        sentFor.current = null;
        const msg = e instanceof ApiError && e.status === 429 ? (extract(e.details) ?? errorMessage(e)) : e instanceof ApiError && e.status === 400 ? (extract(e.details) ?? errorMessage(e)) : errorMessage(e);
        dispatch({ type: 'fallo', message: msg });
      });
    return () => { alive = false; };
  }, [state, band]);

  useEffect(() => {
    if (state.paso !== 'generando' || !state.cuentoId || desdeLocal) return;
    const id = state.cuentoId;
    let alive = true;
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const c = await apiFetch<CuentoDTO>(API_ROUTES.cuento(id), { timeoutMs: 10_000 });
        if (!alive) return;
        setCuento(c);
        if (c.status === 'FAILED') { dispatch({ type: 'fallo', message: c.error ?? 'No pudimos terminar tu cuento.' }); return; }
        if (cuentoListo(c)) { dispatch({ type: 'listo' }); return; }
      } catch {
        /* reintenta en el próximo tick */
      }
      if (Date.now() - started > MAX_POLL_MS) { dispatch({ type: 'fallo', message: 'El cuento está tardando demasiado. Inténtalo de nuevo en un momento.' }); return; }
      timer = setTimeout(tick, POLL_MS);
    };
    void tick();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [state.paso, state.cuentoId, desdeLocal]);

  // En el resultado, seguir consultando hasta que llegue el audio.
  useEffect(() => {
    if (state.paso !== 'resultado' || !cuento || desdeLocal || !seguirConsultando(cuento)) return;
    let alive = true;
    const id = cuento.id;
    const timer = setTimeout(async () => {
      try {
        const c = await apiFetch<CuentoDTO>(API_ROUTES.cuento(id), { timeoutMs: 10_000 });
        if (alive) setCuento(c);
      } catch { /* siguiente intento */ }
    }, POLL_MS);
    return () => { alive = false; clearTimeout(timer); };
  }, [state.paso, cuento, desdeLocal]);

  const reiniciar = useCallback(() => {
    sentFor.current = null;
    setCuento(null);
    setDesdeLocal(false);
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
    dispatch({ type: 'reiniciar' });
  }, []);

  if (!ready) return <Cargando />;
  if (!band) return <BandChooser />;
  if (disp === undefined && state.paso === 'portada') return <Cargando label="Preparando el taller…" />;
  if (!bandaHabilitada(band, disp ?? null) && !desdeLocal) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Grados {config.label}</p>
        <h1 className="mt-1 text-3xl font-bold">{COPY.portadaTitulo}</h1>
        <div role="status" className="tarjeta mt-4 flex items-start gap-3 p-5">
          <Icon name="info" className="h-8 w-8 shrink-0 text-brand-secondary" />
          <div>
            <p className="text-lg">{COPY.proximamente}</p>
            <p className="mt-1 text-sm text-brand-muted">Mientras tanto, en el catálogo hay cuentos originales de la biblioteca y retos lectores para tu grado.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/catalogo?type=BOOK" className="btn-primario"><Icon name="libro" className="h-5 w-5" /> Ir al catálogo</Link>
              <Link href="/retos" className="btn-secundario"><Icon name="trofeo" className="h-5 w-5" /> Retos lectores</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.paso === 'portada') {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Grados {config.label}</p>
        <h1 className={`mt-1 font-bold ${xl ? 'text-4xl' : 'text-3xl'}`}>{COPY.portadaTitulo}</h1>
        <p className={`mt-3 leading-relaxed ${xl ? 'text-2xl' : 'text-lg'}`}>{COPY.portadaIntro}</p>
        {disp?.modo === 'plantilla' && <p role="status" className="mt-3 rounded-card border border-brand-border bg-brand-info-bg p-3 text-brand-text">{COPY.plantillaAviso}</p>}
        <button type="button" className={`btn-primario mt-6 min-h-touch-lg ${xl ? 'px-8 text-2xl' : 'px-6 text-xl'}`} onClick={() => dispatch({ type: 'empezar' })} autoFocus>
          <Icon name="letra" className="h-7 w-7" /> Empezar mi cuento
        </button>
        <MisCuentosResumen onOpen={(id) => { window.location.href = `/construye-tu-cuento?cuento=${encodeURIComponent(id)}`; }} />
      </div>
    );
  }

  if (state.paso === 'generando') {
    return (
      <div className="mx-auto max-w-2xl text-center" role="status" aria-live="polite">
        <div className="mx-auto mt-6 flex h-28 w-28 items-center justify-center rounded-full bg-brand-soft motion-safe:animate-pulse" aria-hidden="true">
          <Icon name="letra" className="h-14 w-14 text-brand-secondary" />
        </div>
        <h1 className={`mt-6 font-bold ${xl ? 'text-3xl' : 'text-2xl'}`}>{COPY.generando}</h1>
        <p className={`mt-2 text-brand-muted ${xl ? 'text-xl' : ''}`}>{COPY.generandoDetalle}</p>
        <p className="mt-6 text-sm text-brand-muted">Protagonista: <strong>{state.protagonista}</strong> · {LUGARES.find((l) => l.id === state.lugar)?.titulo} · {VALORES.find((v) => v.id === state.valor)?.titulo}</p>
      </div>
    );
  }

  if (state.paso === 'error') {
    return (
      <div className="mx-auto max-w-2xl">
        <div role="alert" className="tarjeta flex items-start gap-3 border-brand-danger-text p-5">
          <Icon name="error" className="h-8 w-8 shrink-0 text-brand-danger-text" />
          <div>
            <p className="text-lg font-bold text-brand-primary">No pudimos hacer el cuento</p>
            <p className="mt-1">{state.error}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-primario" onClick={() => dispatch({ type: 'atras' })}><Icon name="refrescar" className="h-5 w-5" /> Volver a intentar</button>
              <Link href="/" className="btn-secundario"><Icon name="casa" className="h-5 w-5" /> Inicio</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.paso === 'resultado' && cuento?.contenido) {
    return <Resultado cuento={cuento} desdeLocal={desdeLocal} xl={xl} onOtro={reiniciar} />;
  }

  // Asistente (creadores → lugar → enseñanza)
  const pasoN = state.paso === 'creadores' ? 1 : state.paso === 'lugar' ? 2 : 3;
  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">{COPY.portadaTitulo} · Paso {pasoN} de 3</p>
      <ol className="mt-2 flex gap-2" aria-label="Progreso">
        {[COPY.paso1, COPY.paso2, COPY.paso3].map((t, i) => (
          <li key={t} aria-current={i + 1 === pasoN ? 'step' : undefined} className={`flex-1 rounded-control border px-2 py-1 text-center text-sm ${i + 1 === pasoN ? 'border-brand-secondary bg-brand-info-bg font-semibold text-brand-primary' : i + 1 < pasoN ? 'border-brand-positive bg-brand-success-bg text-brand-success-text' : 'border-brand-border text-brand-muted'}`}>{t}</li>
        ))}
      </ol>

      {state.paso === 'creadores' && (
        <form className="mt-4 space-y-5" noValidate onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'siguiente' }); }}>
          <h1 className={`font-bold ${xl ? 'text-3xl' : 'text-2xl'}`}>{COPY.paso1}</h1>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={`font-semibold ${xl ? 'text-xl' : ''}`}>{COPY.autorPregunta}</span>
              <span className="block text-sm text-brand-muted">Tu nombre de autor (si quieres). Solo se guarda en la biblioteca.</span>
              <input type="text" className="campo mt-1 min-h-touch-lg w-full text-xl" value={state.autorNombre} maxLength={30} autoComplete="off" onChange={(e) => dispatch({ type: 'autor', value: e.target.value })} />
            </label>
            <label className="block">
              <span className={`font-semibold ${xl ? 'text-xl' : ''}`}>{COPY.protagonistaPregunta}</span>
              <span className="block text-sm text-brand-muted">Inventa un nombre bonito.</span>
              <input type="text" className="campo mt-1 min-h-touch-lg w-full text-xl" value={state.protagonista} maxLength={30} required autoComplete="off" onChange={(e) => dispatch({ type: 'protagonista', value: e.target.value })} />
            </label>
          </div>
          <fieldset>
            <legend className={`font-semibold ${xl ? 'text-xl' : ''}`}>{COPY.tipoPregunta}</legend>
            <Tiles options={TIPOS} selected={state.tipo} xl={xl} name="tipo" onSelect={(id) => dispatch({ type: 'tipo', value: id as never })} />
          </fieldset>
          {state.aviso && <p role="alert" className="rounded-card border border-brand-danger-text bg-brand-danger-bg p-3 text-brand-danger-text">{state.aviso}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-fantasma" onClick={() => dispatch({ type: 'atras' })}><Icon name="volver" className="h-5 w-5" /> Atrás</button>
            <button type="submit" className="btn-primario min-h-touch-lg px-6 text-xl">Siguiente <Icon name="siguiente" className="h-6 w-6" /></button>
          </div>
        </form>
      )}

      {state.paso === 'lugar' && (
        <fieldset className="mt-4">
          <legend className={`font-bold ${xl ? 'text-3xl' : 'text-2xl'}`}>{COPY.lugarPregunta}</legend>
          <Tiles options={LUGARES} selected={state.lugar} xl={xl} name="lugar" onSelect={(id) => dispatch({ type: 'lugar', value: id as never })} />
          {state.aviso && <p role="alert" className="mt-3 rounded-card border border-brand-danger-text bg-brand-danger-bg p-3 text-brand-danger-text">{state.aviso}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-fantasma" onClick={() => dispatch({ type: 'atras' })}><Icon name="volver" className="h-5 w-5" /> Atrás</button>
            <button type="button" className="btn-primario min-h-touch-lg px-6 text-xl" onClick={() => dispatch({ type: 'siguiente' })}>Siguiente <Icon name="siguiente" className="h-6 w-6" /></button>
          </div>
        </fieldset>
      )}

      {state.paso === 'ensenanza' && (
        <fieldset className="mt-4">
          <legend className={`font-bold ${xl ? 'text-3xl' : 'text-2xl'}`}>{COPY.valorPregunta}</legend>
          <Tiles options={VALORES} selected={state.valor} xl={xl} name="valor" onSelect={(id) => dispatch({ type: 'valor', value: id as never })} />
          {state.aviso && <p role="alert" className="mt-3 rounded-card border border-brand-danger-text bg-brand-danger-bg p-3 text-brand-danger-text">{state.aviso}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-fantasma" onClick={() => dispatch({ type: 'atras' })}><Icon name="volver" className="h-5 w-5" /> Atrás</button>
            <button type="button" className="btn-primario min-h-touch-lg px-6 text-xl" onClick={() => dispatch({ type: 'siguiente' })} disabled={!state.valor}>
              <Icon name="letra" className="h-6 w-6" /> ¡Escribir mi cuento!
            </button>
          </div>
        </fieldset>
      )}
    </div>
  );
}

function extract(details: unknown): string | null {
  if (details && typeof details === 'object' && typeof (details as { message?: unknown }).message === 'string') return (details as { message: string }).message;
  return null;
}

/** Mosaicos grandes (≥ 72 px), accesibles por teclado (radio group) y por toque. */
function Tiles({ options, selected, xl, name, onSelect }: { options: CuentoOpcionInfo[]; selected: string | null; xl: boolean; name: string; onSelect: (id: string) => void }) {
  return (
    <div className="mt-2 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={name}>
      {options.map((o) => {
        const on = selected === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onSelect(o.id)}
            className={`tarjeta flex min-h-touch-lg w-full items-center gap-4 p-4 text-left transition duration-brand hover:-translate-y-0.5 hover:shadow-card-hover ${on ? 'border-2 border-brand-secondary bg-brand-info-bg' : ''}`}
          >
            <span className={`flex shrink-0 items-center justify-center rounded-full bg-brand-soft ${xl ? 'h-16 w-16 text-4xl' : 'h-14 w-14 text-3xl'}`} aria-hidden="true">{o.emoji}</span>
            <span className="min-w-0">
              <span className={`block font-bold text-brand-primary ${xl ? 'text-2xl' : 'text-xl'}`}>{o.titulo}</span>
              <span className={`block text-brand-muted ${xl ? 'text-base' : 'text-sm'}`}>{o.detalle}</span>
            </span>
            {on && <Icon name="check" className="ml-auto h-7 w-7 shrink-0 text-brand-secondary" label="Elegido" />}
          </button>
        );
      })}
    </div>
  );
}

function Resultado({ cuento, desdeLocal, xl, onOtro }: { cuento: CuentoDTO; desdeLocal: boolean; xl: boolean; onOtro: () => void }) {
  const c = cuento.contenido!;
  const [guardado, setGuardado] = useState(false);
  useEffect(() => setGuardado(estaGuardado(cuento.id)), [cuento.id]);
  const preguntas = c.preguntas.map((q) => ({ prompt: q.pregunta, options: q.opciones, answer: q.respuesta, explanation: q.explicacion }));
  return (
    <article className="mx-auto max-w-3xl">
      <p className="eyebrow">{COPY.portadaTitulo}</p>
      <h1 className={`mt-1 font-bold ${xl ? 'text-4xl' : 'text-3xl'}`}>{cuento.titulo}</h1>
      <p className="mt-1 text-brand-muted">Escrito por {cuento.autorNombre ?? 'un autor del taller'} con ayuda del taller</p>
      {cuento.modo === 'plantilla' && <p role="status" className="mt-2 rounded-card border border-brand-border bg-brand-info-bg p-3 text-sm text-brand-text">{COPY.plantillaAviso}</p>}
      <div className="mt-4 grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="mx-auto w-full max-w-[220px]">
          {cuento.imagen?.listo && cuento.imagen.url ? (
            // Ilustración con IA (ADR-020), generada solo con las opciones cerradas; la bibliotecaria puede ocultarla.
            <img src={cuento.imagen.url} alt={COPY.ilustracionAlt} width={600} height={900} className="block h-auto w-full rounded-card shadow-card" data-testid="cuento-ilustracion" />
          ) : (
            <CuentoCover titulo={cuento.titulo} autorNombre={cuento.autorNombre} lugar={cuento.lugar} tipo={cuento.tipo} />
          )}
          {cuento.imagen?.pendiente && (
            <p className="mt-2 text-center text-sm text-brand-muted" role="status"><Icon name="cargando" className="mr-1 inline h-4 w-4 motion-safe:animate-spin" /> {COPY.ilustrando}</p>
          )}
        </div>
        <div>
          <p className="italic text-brand-muted">{c.sinopsis}</p>
          {cuento.audio.listo && cuento.audio.url ? (
            <section className="tarjeta mt-3 p-3" aria-label="Escuchar el cuento">
              <p className="mb-1 flex items-center gap-2 font-semibold text-brand-primary"><Icon name="audifonos" className="h-5 w-5" /> {COPY.escuchar}</p>
              <audio controls preload="none" src={cuento.audio.url} className="w-full" data-testid="cuento-audio">Tu navegador no puede reproducir el audio.</audio>
            </section>
          ) : cuento.audio.pendiente ? (
            <p className="mt-3 text-sm text-brand-muted" role="status"><Icon name="cargando" className="mr-1 inline h-4 w-4 motion-safe:animate-spin" /> La voz de la biblioteca está grabando tu cuento…</p>
          ) : null}
        </div>
      </div>
      <div className={`mt-6 space-y-4 leading-relaxed ${xl ? 'text-2xl' : 'text-xl'}`}>
        {c.parrafos.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <p className="mt-6 rounded-card border-l-4 border-brand-positive bg-brand-success-bg p-4 text-lg italic">{c.valorRecordatorio}</p>

      <section className="mt-8" aria-labelledby="preguntas">
        <h2 id="preguntas" className="flex items-center gap-2 text-2xl font-bold"><Icon name="trivia" className="h-7 w-7 text-brand-secondary" /> ¿Leíste con atención?</h2>
        <TriviaQuiz questions={preguntas} idPrefix={`cuento-${cuento.id}`} />
      </section>

      <section className="mt-8" aria-labelledby="glosario">
        <h2 id="glosario" className="flex items-center gap-2 text-2xl font-bold"><Icon name="bombillo" className="h-7 w-7 text-brand-secondary" /> Palabras nuevas</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {c.glosario.map((g) => (
            <div key={g.palabra} className="tarjeta p-3">
              <dt className="font-bold text-brand-primary">{g.palabra}</dt>
              <dd className="text-brand-text">{g.significado}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn-secundario min-h-touch-lg" onClick={() => { guardarMiCuento(cuento); setGuardado(true); }} disabled={guardado}>
          <Icon name={guardado ? 'check' : 'descarga'} className="h-6 w-6" /> {guardado ? 'Guardado en esta tablet' : COPY.guardar}
        </button>
        <button type="button" className="btn-primario min-h-touch-lg" onClick={onOtro}><Icon name="refrescar" className="h-6 w-6" /> {COPY.otro}</button>
      </div>
      {!desdeLocal && <p className="mt-4 text-sm text-brand-muted">{COPY.notaRevision}</p>}
    </article>
  );
}

function MisCuentosResumen({ onOpen }: { onOpen: (id: string) => void }) {
  const [items, setItems] = useState<ReturnType<typeof listarMisCuentos>>([]);
  useEffect(() => setItems(listarMisCuentos()), []);
  if (items.length === 0) return null;
  return (
    <section className="mt-8" aria-labelledby="mis-cuentos">
      <h2 id="mis-cuentos" className="text-xl font-bold">Mis cuentos en esta tablet</h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.slice(0, 6).map((c) => (
          <li key={c.id}>
            <button type="button" className="tarjeta flex min-h-touch w-full items-center gap-3 p-3 text-left" onClick={() => onOpen(c.id)}>
              {c.imagenUrl
                ? <img src={c.imagenUrl} alt="" width={40} height={60} className="h-[60px] w-[40px] shrink-0 rounded object-cover" />
                : <Icon name="libro" className="h-6 w-6 shrink-0 text-brand-secondary" />}
              <span className="min-w-0"><span className="block font-semibold text-brand-primary">{c.titulo}</span><span className="block text-sm text-brand-muted">Protagonista: {c.protagonista}</span></span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

import { beforeEach, describe, expect, it } from 'vitest';
import type { CuentoDTO } from '@macondo/shared';
import {
  bandaHabilitada, cuentoListo, deviceId, DEVICE_KEY, estaGuardado, guardadoADTO, guardarMiCuento, INITIAL_STATE, listarMisCuentos, LUGARES, MAX_MIS_CUENTOS,
  MIS_CUENTOS_KEY, opcionesParaEnviar, quitarMiCuento, seguirConsultando, TIPOS, validarNombreLocal, VALORES, wizardReducer, type WizardState,
} from './cuentos';

const run = (acts: Parameters<typeof wizardReducer>[1][], from: WizardState = INITIAL_STATE) => acts.reduce(wizardReducer, from);

const cuento = (over: Partial<CuentoDTO> = {}): CuentoDTO => ({
  id: 'c1', status: 'PENDING_REVIEW', modo: 'ia', banda: '1-3', titulo: 'Lía y el mar', autorNombre: 'Sofía', protagonista: 'Lía', tipo: 'nino', lugar: 'covenas', valor: 'amistad',
  contenido: { titulo: 'Lía y el mar', sinopsis: 's', parrafos: ['a', 'b', 'c'], preguntas: [], glosario: [], valorRecordatorio: 'v' },
  audio: { listo: true, url: '/api/cuentos/c1/audio', durationSeconds: 60, pendiente: false },
  imagen: { listo: true, url: '/api/cuentos/c1/imagen', pendiente: false }, error: null, createdAt: '2026-11-05T00:00:00.000Z', ...over,
});

describe('asistente: máquina de estados', () => {
  it('portada → creadores; no avanza sin protagonista ni tipo; avanza con ambos', () => {
    let s = run([{ type: 'empezar' }]);
    expect(s.paso).toBe('creadores');
    s = wizardReducer(s, { type: 'siguiente' });
    expect(s.paso).toBe('creadores');
    expect(s.aviso).toMatch(/nombre de tu protagonista/);
    s = run([{ type: 'protagonista', value: 'Lía' }, { type: 'siguiente' }], s);
    expect(s.aviso).toMatch(/Elige quién/);
    s = run([{ type: 'tipo', value: 'robot' }, { type: 'siguiente' }], s);
    expect(s.paso).toBe('lugar');
    expect(s.aviso).toBeNull();
  });
  it('valida el nombre del autor (opcional) y el del protagonista', () => {
    const s = run([{ type: 'empezar' }, { type: 'autor', value: 'S0f1a' }, { type: 'protagonista', value: 'Lía' }, { type: 'tipo', value: 'nino' }, { type: 'siguiente' }]);
    expect(s.paso).toBe('creadores');
    expect(s.aviso).toMatch(/Tu nombre/);
    expect(validarNombreLocal('', false)).toBeNull();
    expect(validarNombreLocal('', true)).toMatch(/Escribe/);
    expect(validarNombreLocal('L', true)).toMatch(/2 letras/);
    expect(validarNombreLocal('x'.repeat(31), true)).toMatch(/hasta 30/);
    expect(validarNombreLocal('Lía<', true)).toMatch(/solo letras/);
    expect(validarNombreLocal("María-José D'Ávila", true)).toBeNull();
  });
  it('elegir lugar avanza solo; enseñanza exige valor; atrás recorre los pasos', () => {
    const base = run([{ type: 'empezar' }, { type: 'protagonista', value: 'Lía' }, { type: 'tipo', value: 'nino' }, { type: 'siguiente' }]);
    let s = wizardReducer(base, { type: 'siguiente' });
    expect(s.aviso).toMatch(/dónde/);
    s = wizardReducer(base, { type: 'lugar', value: 'mojana' });
    expect(s.paso).toBe('ensenanza');
    s = wizardReducer(s, { type: 'siguiente' });
    expect(s.aviso).toMatch(/enseñar/);
    s = run([{ type: 'valor', value: 'cuidado' }, { type: 'siguiente' }], s);
    expect(s.paso).toBe('generando');
    expect(run([{ type: 'atras' }], { ...s, paso: 'ensenanza' }).paso).toBe('lugar');
    expect(run([{ type: 'atras' }, { type: 'atras' }], { ...s, paso: 'ensenanza' }).paso).toBe('creadores');
    expect(run([{ type: 'atras' }], { ...s, paso: 'creadores' }).paso).toBe('portada');
  });
  it('enviado → listo → reiniciar conserva el autor; fallo → error → atrás vuelve a enseñanza', () => {
    const s = run([{ type: 'empezar' }, { type: 'autor', value: 'Sofía' }, { type: 'protagonista', value: 'Lía' }, { type: 'tipo', value: 'nino' }, { type: 'siguiente' }, { type: 'lugar', value: 'covenas' }, { type: 'valor', value: 'amistad' }, { type: 'siguiente' }]);
    const enviado = wizardReducer(s, { type: 'enviado', id: 'abc' });
    expect(enviado).toMatchObject({ paso: 'generando', cuentoId: 'abc' });
    expect(wizardReducer(enviado, { type: 'listo' }).paso).toBe('resultado');
    const r = wizardReducer(enviado, { type: 'reiniciar' });
    expect(r).toMatchObject({ paso: 'creadores', autorNombre: 'Sofía', protagonista: '', tipo: null, cuentoId: null });
    const f = wizardReducer(s, { type: 'fallo', message: 'Demasiados' });
    expect(f).toMatchObject({ paso: 'error', error: 'Demasiados' });
    expect(wizardReducer(f, { type: 'atras' })).toMatchObject({ paso: 'ensenanza', error: null });
  });
  it('opcionesParaEnviar: autor vacío → null; nombres recortados; banda y deviceId', () => {
    const s = run([{ type: 'empezar' }, { type: 'autor', value: '  ' }, { type: 'protagonista', value: ' Lía ' }, { type: 'tipo', value: 'animal' }, { type: 'lugar', value: 'espacio' }, { type: 'valor', value: 'curiosidad' }]);
    expect(opcionesParaEnviar(s, '4-5', 'dev123456')).toEqual({ banda: '4-5', autorNombre: null, protagonista: 'Lía', tipo: 'animal', lugar: 'espacio', valor: 'curiosidad', deviceId: 'dev123456' });
  });
  it('opciones: 4 × 4 × 4 con los textos del proyecto', () => {
    expect(TIPOS.map((t) => t.titulo)).toEqual(['Una niña o un niño', 'Un animal ingenioso', 'Un robot curioso', 'Un ser de leyenda']);
    expect(LUGARES.map((l) => l.titulo)).toEqual(['Playas de Coveñas', 'Ciénagas de la Mojana', 'Sincelejo', 'Una estación en el espacio']);
    expect(VALORES.map((v) => v.titulo)).toEqual(['Juntos llegamos más lejos', 'Atreverse da miedo, y se puede', 'Preguntar es el primer paso', 'Cuidar lo que nos rodea']);
  });
});

describe('estado del cuento y disponibilidad', () => {
  it('cuentoListo / seguirConsultando', () => {
    expect(cuentoListo(cuento({ status: 'GENERATING', contenido: null }))).toBe(false);
    expect(cuentoListo(cuento({ status: 'GENERATED' }))).toBe(true);
    expect(cuentoListo(cuento({ status: 'FAILED' }))).toBe(false);
    expect(seguirConsultando(cuento({ status: 'GENERATED', audio: { listo: false, url: null, durationSeconds: null, pendiente: true } }))).toBe(true);
    // La ilustración pendiente también mantiene la consulta; sin ilustración (sin proveedor) no.
    expect(seguirConsultando(cuento({ status: 'PENDING_REVIEW', imagen: { listo: false, url: null, pendiente: true } }))).toBe(true);
    expect(seguirConsultando(cuento({ status: 'PENDING_REVIEW', imagen: { listo: false, url: null, pendiente: false } }))).toBe(false);
    expect(seguirConsultando(cuento())).toBe(false);
  });
  it('bandaHabilitada usa la API si existe y, si no, las bandas por defecto', () => {
    expect(bandaHabilitada('1-3', null)).toBe(true);
    expect(bandaHabilitada('6-8', null)).toBe(false);
    expect(bandaHabilitada(null, null)).toBe(false);
    expect(bandaHabilitada('6-8', { habilitado: true, bandas: ['1-3', '4-5', '6-8'], modo: 'ia' })).toBe(true);
    expect(bandaHabilitada('1-3', { habilitado: false, bandas: ['1-3'], modo: 'plantilla' })).toBe(false);
  });
});

describe('dispositivo y «Mis cuentos» (localStorage)', () => {
  beforeEach(() => {
    localStorage.removeItem(DEVICE_KEY);
    localStorage.removeItem(MIS_CUENTOS_KEY);
  });
  it('deviceId se crea una vez y se reutiliza; valores corruptos se reemplazan', () => {
    const a = deviceId();
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,80}$/);
    expect(deviceId()).toBe(a);
    localStorage.setItem(DEVICE_KEY, JSON.stringify('x y'));
    const b = deviceId(() => 'nuevoToken123');
    expect(b).toBe('nuevoToken123');
  });
  it('guardar, listar (recientes primero), estaGuardado, quitar y tope de 12', () => {
    expect(listarMisCuentos()).toEqual([]);
    guardarMiCuento(cuento({ id: 'a' }), new Date('2026-11-05T10:00:00Z'));
    guardarMiCuento(cuento({ id: 'b', titulo: 'Segundo' }), new Date('2026-11-05T11:00:00Z'));
    expect(listarMisCuentos().map((c) => c.id)).toEqual(['b', 'a']);
    expect(estaGuardado('a')).toBe(true);
    guardarMiCuento(cuento({ id: 'a', titulo: 'Actualizado' }));
    expect(listarMisCuentos().map((c) => c.id)).toEqual(['a', 'b']);
    expect(listarMisCuentos()[0]!.titulo).toBe('Actualizado');
    expect(quitarMiCuento('b').map((c) => c.id)).toEqual(['a']);
    for (let i = 0; i < 20; i++) guardarMiCuento(cuento({ id: `x${i}` }));
    expect(listarMisCuentos()).toHaveLength(MAX_MIS_CUENTOS);
    expect(guardarMiCuento(cuento({ contenido: null }))).toHaveLength(MAX_MIS_CUENTOS); // sin contenido no se guarda
  });
  it('basura en localStorage no rompe; guardadoADTO reconstruye la vista', () => {
    localStorage.setItem(MIS_CUENTOS_KEY, '{"no":"lista"}');
    expect(listarMisCuentos()).toEqual([]);
    localStorage.setItem(MIS_CUENTOS_KEY, JSON.stringify([{ id: 'sin-contenido' }, 7, null]));
    expect(listarMisCuentos()).toEqual([]);
    const g = guardarMiCuento(cuento())[0]!;
    const dto = guardadoADTO(g);
    expect(dto).toMatchObject({ id: 'c1', titulo: 'Lía y el mar', audio: { listo: true, url: '/api/cuentos/c1/audio' }, imagen: { listo: true, url: '/api/cuentos/c1/imagen', pendiente: false } });
  });
});

import { describe, it, expect } from 'vitest';
import { isLicenseActive, isResourceAccessible, canDownloadOffline, gradeBand, ResourceInputSchema, CAPACITY_TARGETS, ChangePasswordSchema } from './index';

const lic = { rightsHolder: 'X', licenseName: 'CC0', authorizedDevices: 30, offlineAllowed: true, territory: 'CO' };
describe('reglas de licencia', () => {
  const now = new Date('2026-10-31T12:00:00Z');
  it('vigente sin fechas', () => expect(isLicenseActive({}, now)).toBe(true));
  it('vencida', () => expect(isLicenseActive({ validUntil: '2026-01-01T00:00:00Z' }, now)).toBe(false));
  it('aún no inicia', () => expect(isLicenseActive({ validFrom: '2027-01-01T00:00:00Z' }, now)).toBe(false));
  it('borrador no es accesible', () => expect(isResourceAccessible({ status: 'DRAFT', license: lic }, now)).toBe(false));
  it('offline requiere permiso y archivo', () => {
    expect(canDownloadOffline({ status: 'PUBLISHED', hasFile: true, license: lic }, now)).toBe(true);
    expect(canDownloadOffline({ status: 'PUBLISHED', hasFile: true, license: { ...lic, offlineAllowed: false } }, now)).toBe(false);
    expect(canDownloadOffline({ status: 'PUBLISHED', hasFile: false, license: lic }, now)).toBe(false);
  });
});
describe('grados y esquemas', () => {
  it('bandas', () => { expect(gradeBand(1)).toBe('1-3'); expect(gradeBand(5)).toBe('4-5'); expect(gradeBand(8)).toBe('6-8'); expect(gradeBand(11)).toBe('9-11'); });
  it('rechaza gradeMin > gradeMax', () => {
    const r = ResourceInputSchema.safeParse({ title: 'a', creator: 'b', type: 'BOOK', gradeMin: 5, gradeMax: 2, license: lic });
    expect(r.success).toBe(false);
  });
  it('cambio de contraseña: mínimo 10, letras+números, distinta de la actual', () => {
    const ok = ChangePasswordSchema.safeParse({ currentPassword: 'MacondoDev2026!', newPassword: 'Biblioteca2027x' });
    expect(ok.success).toBe(true);
    expect(ChangePasswordSchema.safeParse({ currentPassword: 'a', newPassword: 'corta1' }).success).toBe(false);
    expect(ChangePasswordSchema.safeParse({ currentPassword: 'a', newPassword: 'solo-letras-largas' }).success).toBe(false);
    expect(ChangePasswordSchema.safeParse({ currentPassword: 'Igual12345', newPassword: 'Igual12345' }).success).toBe(false);
  });
  it('capacidad suma 570 (metas del 2026-10-31)', () => {
    expect(Object.values(CAPACITY_TARGETS).reduce((a, b) => a + b, 0)).toBe(570);
    expect(CAPACITY_TARGETS).toEqual({ BOOK: 300, AUDIOBOOK: 100, AUDIOBIOGRAPHY: 50, AUDIOSUMMARY: 20, GALLERY: 100 });
  });
});

import { ChallengeImportSchema, GalleryManifestSchema, ResourcePatchSchema, TriviaQuestionSchema } from './index';
describe('galerías, retos y extras', () => {
  const q = { prompt: '¿?', options: ['a', 'b'], answer: 1, explanation: '' };
  it('trivia: answer dentro de options', () => {
    expect(TriviaQuestionSchema.safeParse(q).success).toBe(true);
    expect(TriviaQuestionSchema.safeParse({ ...q, answer: 2 }).success).toBe(false);
  });
  it('gallery.json válido y nombres de archivo seguros', () => {
    const item = { file: '01-iguana.jpg', alt: 'Iguana', caption: 'x', credit: 'Autor', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', sourceUrl: null };
    expect(GalleryManifestSchema.safeParse({ title: 'Fauna', items: [item], activity: { kind: 'trivia', questions: [q] } }).success).toBe(true);
    for (const file of ['../x.jpg', 'sub/x.jpg', 'x.gif', '.x.png', 'x.jpg/']) {
      expect(GalleryManifestSchema.safeParse({ title: 'Fauna', items: [{ ...item, file }] }).success, file).toBe(false);
    }
  });
  it('retos: los tres tipos y slug obligatorio', () => {
    expect(ChallengeImportSchema.safeParse({ id: 'a-1', kind: 'match', title: 't', bands: ['1-3'], pairs: [{ left: 'a', right: 'b' }, { left: 'c', right: 'd' }] }).success).toBe(true);
    expect(ChallengeImportSchema.safeParse({ id: 'a-1', kind: 'sequence', title: 't', bands: ['4-5'], steps: ['1', '2'] }).success).toBe(true);
    expect(ChallengeImportSchema.safeParse({ id: 'a-1', kind: 'trivia', title: 't', bands: ['9-11'], questions: [q] }).success).toBe(true);
    expect(ChallengeImportSchema.safeParse({ id: 'A B', kind: 'trivia', title: 't', bands: ['9-11'], questions: [q] }).success).toBe(false);
    expect(ChallengeImportSchema.safeParse({ id: 'x', kind: 'match', title: 't', bands: ['1-3'], pairs: [] }).success).toBe(false);
    expect(ChallengeImportSchema.safeParse({ id: 'x', kind: 'otro', title: 't', bands: ['1-3'] }).success).toBe(false);
  });
  it('PATCH acepta extra y rechaza claves desconocidas', () => {
    expect(ResourcePatchSchema.safeParse({ extra: { funFacts: ['a'], timeline: [{ year: 1900, event: 'x' }] } }).success).toBe(true);
    expect(ResourcePatchSchema.safeParse({ hacker: 1 }).success).toBe(false);
  });
});

import { CHALLENGE_TARGET, TV_BLOCKS, TV_KIND_BLOCK, TvSlideKindSchema } from './index';
describe('metas de retos y bloques de TV', () => {
  it('meta explícita de 100 retos', () => expect(CHALLENGE_TARGET).toBe(100));
  it('todo tipo de diapositiva cae en uno de los 6 bloques (incluido TUTORIAL)', () => {
    expect(TV_BLOCKS).toHaveLength(6);
    expect(TvSlideKindSchema.options).toContain('TUTORIAL');
    for (const k of TvSlideKindSchema.options) expect(TV_BLOCKS).toContain(TV_KIND_BLOCK[k]);
  });
});

import { API_ROUTES, NarrateInputSchema, TTS_LIMITS, TTS_VOICE_CREDIT } from './index';
describe('narración sintética (ADR-017)', () => {
  it('rutas y crédito de la voz', () => {
    expect(API_ROUTES.adminResourceNarrate('abc')).toBe('/api/admin/resources/abc/narrar');
    expect(API_ROUTES.adminTtsStatus).toBe('/api/admin/tts/estado');
    expect(TTS_VOICE_CREDIT).toMatch(/Piper es_ES-davefx-medium/);
    expect(TTS_VOICE_CREDIT).toMatch(/CC0/);
  });
  it('NarrateInput: cuerpo vacío válido, límites de texto y parámetros, sin claves desconocidas', () => {
    expect(NarrateInputSchema.safeParse({}).success).toBe(true);
    expect(NarrateInputSchema.safeParse({ text: 'Hola', lengthScale: 1.1, sentenceSilence: 0.3 }).success).toBe(true);
    expect(NarrateInputSchema.safeParse({ text: '' }).success).toBe(false);
    expect(NarrateInputSchema.safeParse({ text: 'x'.repeat(TTS_LIMITS.maxChars + 1) }).success).toBe(false);
    expect(NarrateInputSchema.safeParse({ lengthScale: 3 }).success).toBe(false);
    expect(NarrateInputSchema.safeParse({ velocidad: 1 }).success).toBe(false);
  });
});

import {
  API_ROUTES, CUENTO_LUGARES, CUENTO_OPCIONES, CUENTO_TIPOS, CUENTO_VALORES, CuentoGeneradoSchema, CuentoNombreSchema, CuentoOpcionesSchema, CuentoRevisarSchema,
  cuentoCoverSvg, cuentoGrades, cuentoPalabras, ResourceExtraSchema,
} from './index';

describe('Taller de cuentos (ADR-018)', () => {
  it('4 tipos × 4 lugares × 4 valores con textos de la interfaz', () => {
    expect(CUENTO_TIPOS).toEqual(['nino', 'animal', 'robot', 'leyenda']);
    expect(CUENTO_LUGARES).toEqual(['covenas', 'mojana', 'sincelejo', 'espacio']);
    expect(CUENTO_VALORES).toEqual(['amistad', 'valentia', 'curiosidad', 'cuidado']);
    expect(CUENTO_OPCIONES.lugares.mojana.titulo).toBe('Ciénagas de la Mojana');
    expect(CUENTO_OPCIONES.valores.valentia.titulo).toBe('Atreverse da miedo, y se puede');
    for (const t of CUENTO_TIPOS) expect(CUENTO_OPCIONES.tipos[t].id).toBe(t);
  });
  it('rutas públicas y de administración', () => {
    expect(API_ROUTES.cuentos).toBe('/api/cuentos');
    expect(API_ROUTES.cuento('x')).toBe('/api/cuentos/x');
    expect(API_ROUTES.cuentoAudio('x')).toBe('/api/cuentos/x/audio');
    expect(API_ROUTES.cuentosDisponible).toBe('/api/cuentos/disponible');
    expect(API_ROUTES.adminCuentoRevisar('x')).toBe('/api/admin/cuentos/x/revisar');
  });
  it('nombres: letras/espacios/apóstrofo/guion, 2–30', () => {
    expect(CuentoNombreSchema.safeParse('Lía').success).toBe(true);
    expect(CuentoNombreSchema.safeParse("María-José D'Ávila").success).toBe(true);
    expect(CuentoNombreSchema.safeParse('L').success).toBe(false);
    expect(CuentoNombreSchema.safeParse('Lía1').success).toBe(false);
    expect(CuentoNombreSchema.safeParse('-Lía').success).toBe(false);
    expect(CuentoNombreSchema.safeParse('a'.repeat(31)).success).toBe(false);
  });
  it('opciones: solo ids cerrados, deviceId obligatorio, sin claves extra (nunca IP)', () => {
    const ok = { banda: '1-3', autorNombre: null, protagonista: 'Lía', tipo: 'nino', lugar: 'covenas', valor: 'amistad', deviceId: 'abcdefgh' };
    expect(CuentoOpcionesSchema.safeParse(ok).success).toBe(true);
    expect(CuentoOpcionesSchema.safeParse({ ...ok, tipo: 'dragon' }).success).toBe(false);
    expect(CuentoOpcionesSchema.safeParse({ ...ok, deviceId: 'corto' }).success).toBe(false);
    expect(CuentoOpcionesSchema.safeParse({ ...ok, ip: '1.1.1.1' }).success).toBe(false);
  });
  it('cuento generado: 3 preguntas × 3 opciones, glosario 2–4, párrafos 3–14', () => {
    const q = { pregunta: '¿Dónde pasa?', opciones: ['A', 'B', 'C'], respuesta: 0, explicacion: '' };
    const c = { titulo: 'Título', sinopsis: 'Resumen corto del cuento.', parrafos: ['Párrafo uno.', 'Párrafo dos.', 'Párrafo tres.'], preguntas: [q, q, q], glosario: [{ palabra: 'mar', significado: 'agua salada' }, { palabra: 'sol', significado: 'estrella' }], valorRecordatorio: 'Juntos llegamos más lejos.' };
    expect(CuentoGeneradoSchema.safeParse(c).success).toBe(true);
    expect(CuentoGeneradoSchema.safeParse({ ...c, preguntas: [q, q] }).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse({ ...c, preguntas: [q, q, { ...q, respuesta: 3 }] }).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse({ ...c, glosario: [] }).success).toBe(false);
    expect(cuentoPalabras(c)).toBe(6);
    expect(CuentoRevisarSchema.safeParse({ decision: 'APROBAR', nota: 'ok' }).success).toBe(true);
    expect(CuentoRevisarSchema.safeParse({ decision: 'BORRAR' }).success).toBe(false);
  });
  it('grados por banda, extra.cuentoId y portada SVG', () => {
    expect(cuentoGrades('1-3')).toEqual([1, 3]);
    expect(cuentoGrades('4-5')).toEqual([4, 5]);
    expect(ResourceExtraSchema.parse({ cuentoId: 'abc' }).cuentoId).toBe('abc');
    const svg = cuentoCoverSvg({ titulo: 'Lía <y> el mar', autorNombre: null, lugar: 'covenas', tipo: 'animal' });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('&lt;y&gt;');
    expect(svg).toContain('Escrito en el Taller de cuentos');
  });
});

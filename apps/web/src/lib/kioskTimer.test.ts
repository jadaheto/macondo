import {
  clearKioskSession, createInactivityTimer, KIOSK_CONFIG_KEY, kioskConfigFromSearch, kioskLayout, kioskScaleStyle, parseKioskConfig, parseKioskScale,
  resolveKioskConfig, toStoredConfig,
} from './kioskTimer';

describe('temporizador de inactividad del kiosco', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('avisa a los 90 s y reinicia tras 10 s más de inactividad', () => {
    const onWarning = vi.fn();
    const onTick = vi.fn();
    const onExpire = vi.fn();
    const t = createInactivityTimer({ onWarning, onTick, onExpire });
    t.start();
    vi.advanceTimersByTime(89_999);
    expect(onWarning).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onWarning).toHaveBeenCalledWith(10);
    expect(t.phase()).toBe('warning');
    vi.advanceTimersByTime(9_000);
    expect(onTick).toHaveBeenLastCalledWith(1);
    expect(onExpire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_000);
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(t.phase()).toBe('active');
  });

  it('la actividad reinicia la cuenta y cancela el aviso', () => {
    const onExpire = vi.fn();
    const onResume = vi.fn();
    const onWarning = vi.fn();
    const t = createInactivityTimer({ timeoutMs: 5_000, warningMs: 3_000, onExpire, onResume, onWarning });
    t.start();
    vi.advanceTimersByTime(4_000);
    t.activity();
    vi.advanceTimersByTime(4_000);
    expect(onWarning).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_000);
    expect(onWarning).toHaveBeenCalledTimes(1);
    t.activity();
    expect(onResume).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(4_999);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('sigue vigilando tras expirar (siguiente visitante)', () => {
    const onExpire = vi.fn();
    const t = createInactivityTimer({ timeoutMs: 2_000, warningMs: 1_000, onExpire });
    t.start();
    vi.advanceTimersByTime(3_000);
    vi.advanceTimersByTime(3_000);
    expect(onExpire).toHaveBeenCalledTimes(2);
    t.stop();
    vi.advanceTimersByTime(10_000);
    expect(onExpire).toHaveBeenCalledTimes(2);
    t.activity(); // detenido: no rearma
    vi.advanceTimersByTime(10_000);
    expect(onExpire).toHaveBeenCalledTimes(2);
  });

  it('configuración: valores por defecto y límites', () => {
    expect(parseKioskConfig(null)).toEqual({ timeoutMs: 90_000, warningMs: 10_000, scale: 1 });
    expect(parseKioskConfig({ timeoutSeconds: 120, warningSeconds: 15, scale: 1.5 })).toEqual({ timeoutMs: 120_000, warningMs: 15_000, scale: 1.5 });
    expect(parseKioskConfig({ timeoutSeconds: 1, warningSeconds: 999, scale: 3 })).toEqual({ timeoutMs: 90_000, warningMs: 10_000, scale: 1 });
  });

  it('escala: solo 1, 1.25, 1.5 y 1.75 (acepta coma decimal); lo demás vuelve a 1', () => {
    expect(parseKioskScale('1.5')).toBe(1.5);
    expect(parseKioskScale('1,25')).toBe(1.25);
    expect(parseKioskScale(1.75)).toBe(1.75);
    expect(parseKioskScale('2')).toBe(1);
    expect(parseKioskScale('abc')).toBe(1);
    expect(parseKioskScale(undefined)).toBe(1);
  });

  it('la URL pisa la configuración guardada y solo en las claves que trae', () => {
    expect(kioskConfigFromSearch('?inactividad=120&aviso=15&escala=1.5')).toEqual({ timeoutSeconds: 120, warningSeconds: 15, scale: 1.5 });
    expect(kioskConfigFromSearch('?escala=1.25')).toEqual({ scale: 1.25 });
    expect(kioskConfigFromSearch('')).toEqual({});
    const r = resolveKioskConfig({ timeoutSeconds: 60, warningSeconds: 10, scale: 1.75 }, '?escala=1.25');
    expect(r.config).toEqual({ timeoutMs: 60_000, warningMs: 10_000, scale: 1.25 });
    expect(r.stored).toEqual({ timeoutSeconds: 60, warningSeconds: 10, scale: 1.25 });
    expect(toStoredConfig(r.config)).toEqual({ timeoutSeconds: 60, warningSeconds: 10, scale: 1.25 });
  });

  it('maquetación: tótem vertical 1080×1920 y horizontal 1920×1080 con y sin escala', () => {
    const v1 = kioskLayout(1080, 1920, 1);
    expect(v1).toMatchObject({ orientation: 'vertical', width: 1080, height: 1920, categoryCols: 2, gridCols: 3, qrSize: 320 });
    expect(kioskLayout(1080, 1920, 1.5)).toMatchObject({ orientation: 'vertical', width: 720, height: 1280, categoryCols: 2, gridCols: 2, qrSize: 320 });
    expect(kioskLayout(1080, 1920, 1.75)).toMatchObject({ orientation: 'vertical', width: 617, gridCols: 2, qrSize: 260 });
    expect(kioskLayout(1200, 1920, 1.25)).toMatchObject({ orientation: 'vertical', width: 960, gridCols: 2 });
    const h1 = kioskLayout(1920, 1080, 1);
    expect(h1).toMatchObject({ orientation: 'horizontal', categoryCols: 5, gridCols: 5, qrSize: 240 });
    expect(kioskLayout(1920, 1080, 1.5)).toMatchObject({ orientation: 'horizontal', width: 1280, categoryCols: 5, gridCols: 3 });
    expect(kioskLayout(1280, 800, 1.75)).toMatchObject({ orientation: 'horizontal', width: 731, categoryCols: 3, gridCols: 2 });
    expect(kioskLayout(1080, 1920, 0)).toMatchObject({ width: 1080 }); // escala inválida → 1
  });

  it('estilo de escala: zoom cuando se admite; transform como respaldo; nada en ×1', () => {
    expect(kioskScaleStyle(1, true)).toEqual({});
    expect(kioskScaleStyle(1.5, true)).toEqual({ zoom: 1.5 });
    expect(kioskScaleStyle(1.25, false)).toEqual({ transform: 'scale(1.25)', transformOrigin: '0 0', width: '80.0000%', minHeight: 'calc(100vh / 1.25)' });
  });

  it('limpia el estado de sesión pero conserva la configuración del kiosco', () => {
    vi.useRealTimers();
    localStorage.setItem(KIOSK_CONFIG_KEY, '{"timeoutSeconds":60}');
    localStorage.setItem('macondo.favorites', '["a"]');
    localStorage.setItem('macondo.audio.kiosk-x', '{}');
    localStorage.setItem('otra-app', 'x');
    sessionStorage.setItem('algo', '1');
    clearKioskSession();
    expect(localStorage.getItem(KIOSK_CONFIG_KEY)).not.toBeNull();
    expect(localStorage.getItem('macondo.favorites')).toBeNull();
    expect(localStorage.getItem('macondo.audio.kiosk-x')).toBeNull();
    expect(localStorage.getItem('otra-app')).toBe('x');
    expect(sessionStorage.length).toBe(0);
  });
});

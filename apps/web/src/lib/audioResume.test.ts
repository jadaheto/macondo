import { computeResumePosition, formatTime, getResumePosition, saveAudioPosition, clearAudioPosition, loadAudioPosition } from './audioResume';

describe('reanudación de audio', () => {
  beforeEach(() => localStorage.clear());

  it('no reanuda si casi no se escuchó', () => {
    expect(computeResumePosition(null, 300)).toBe(0);
    expect(computeResumePosition(3, 300)).toBe(0);
    expect(computeResumePosition(Number.NaN, 300)).toBe(0);
  });
  it('reanuda con 3 s de contexto', () => {
    expect(computeResumePosition(120, 300)).toBe(117);
    expect(computeResumePosition(120, null)).toBe(117);
  });
  it('empieza de nuevo si estaba casi al final', () => {
    expect(computeResumePosition(295, 300)).toBe(0);
  });
  it('guarda y recupera por recurso', () => {
    saveAudioPosition('r1', 200.44, 600);
    expect(loadAudioPosition('r1')?.position).toBe(200.4);
    expect(getResumePosition('r1', 600)).toBeCloseTo(197.4);
    expect(getResumePosition('r2', 600)).toBe(0);
    clearAudioPosition('r1');
    expect(getResumePosition('r1', 600)).toBe(0);
  });
  it('ignora datos corruptos', () => {
    localStorage.setItem('macondo.audio.r3', '{no json');
    expect(getResumePosition('r3', 100)).toBe(0);
  });
  it('formatea tiempos', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(75)).toBe('1:15');
    expect(formatTime(3725)).toBe('1:02:05');
    expect(formatTime(-1)).toBe('0:00');
  });
});

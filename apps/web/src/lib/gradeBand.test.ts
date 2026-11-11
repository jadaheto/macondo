import { BAND_CONFIG, GRADE_BANDS, bandConfig, bandForGrade, isGradeBand, parseStoredBand, resourceFitsBand } from './gradeBand';

describe('gradeBand', () => {
  it('asigna cada grado a su banda', () => {
    expect([1, 2, 3].map(bandForGrade)).toEqual(['1-3', '1-3', '1-3']);
    expect([4, 5].map(bandForGrade)).toEqual(['4-5', '4-5']);
    expect([6, 7, 8].map(bandForGrade)).toEqual(['6-8', '6-8', '6-8']);
    expect([9, 10, 11].map(bandForGrade)).toEqual(['9-11', '9-11', '9-11']);
  });
  it('acota grados fuera de rango', () => {
    expect(bandForGrade(0)).toBe('1-3');
    expect(bandForGrade(15)).toBe('9-11');
  });
  it('interpreta valores guardados de forma segura', () => {
    expect(parseStoredBand('"4-5"')).toBe('4-5');
    expect(parseStoredBand('9-11')).toBe('9-11');
    expect(parseStoredBand('"12-13"')).toBeNull();
    expect(parseStoredBand('{malformado')).toBeNull();
    expect(parseStoredBand(null)).toBeNull();
    expect(isGradeBand('6-8')).toBe(true);
    expect(isGradeBand(7)).toBe(false);
  });
  it('la configuración diferencia densidad y tono por edad', () => {
    expect(BAND_CONFIG['1-3'].density).toBe('xl');
    expect(BAND_CONFIG['1-3'].showDescriptions).toBe(false);
    expect(BAND_CONFIG['9-11'].density).toBe('compact');
    expect(BAND_CONFIG['9-11'].subtitle).toMatch(/Saber 11/);
    for (const b of GRADE_BANDS) {
      const c = BAND_CONFIG[b];
      expect(c.defaultGrade).toBeGreaterThanOrEqual(c.grades[0]);
      expect(c.defaultGrade).toBeLessThanOrEqual(c.grades[1]);
      expect(Object.keys(c.moduleCopy)).toHaveLength(7); // 6 módulos + Taller de cuentos (ADR-018)
    }
    expect(bandConfig(null).id).toBe('6-8');
  });
  it('determina si un recurso encaja en la banda (intersección de rangos)', () => {
    expect(resourceFitsBand({ gradeMin: 1, gradeMax: 2 }, '1-3')).toBe(true);
    expect(resourceFitsBand({ gradeMin: 3, gradeMax: 6 }, '4-5')).toBe(true);
    expect(resourceFitsBand({ gradeMin: 9, gradeMax: 11 }, '6-8')).toBe(false);
  });
});

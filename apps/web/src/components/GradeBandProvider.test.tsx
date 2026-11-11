import { act, render, screen } from '@testing-library/react';
import { GradeBandProvider, useGradeBand } from './GradeBandProvider';
import { GRADE_BAND_STORAGE_KEY } from '@/lib/gradeBand';

function Probe() {
  const { band, config, setBand } = useGradeBand();
  return (
    <div>
      <span data-testid="band">{band ?? 'ninguna'}</span>
      <span data-testid="density">{config.density}</span>
      <button onClick={() => setBand('1-3')}>elegir</button>
      <button onClick={() => setBand(null)}>borrar</button>
    </div>
  );
}

describe('GradeBandProvider', () => {
  beforeEach(() => localStorage.clear());

  it('lee la banda guardada y ajusta <html data-band>', () => {
    localStorage.setItem(GRADE_BAND_STORAGE_KEY, JSON.stringify('9-11'));
    render(<GradeBandProvider><Probe /></GradeBandProvider>);
    expect(screen.getByTestId('band').textContent).toBe('9-11');
    expect(screen.getByTestId('density').textContent).toBe('compact');
    expect(document.documentElement.dataset.band).toBe('9-11');
  });

  it('guarda y borra la banda en localStorage', () => {
    render(<GradeBandProvider><Probe /></GradeBandProvider>);
    expect(screen.getByTestId('band').textContent).toBe('ninguna');
    act(() => screen.getByText('elegir').click());
    expect(localStorage.getItem(GRADE_BAND_STORAGE_KEY)).toBe('"1-3"');
    expect(screen.getByTestId('density').textContent).toBe('xl');
    act(() => screen.getByText('borrar').click());
    expect(localStorage.getItem(GRADE_BAND_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.dataset.band).toBeUndefined();
  });

  it('ignora valores corruptos', () => {
    localStorage.setItem(GRADE_BAND_STORAGE_KEY, 'basura');
    render(<GradeBandProvider><Probe /></GradeBandProvider>);
    expect(screen.getByTestId('band').textContent).toBe('ninguna');
  });
});

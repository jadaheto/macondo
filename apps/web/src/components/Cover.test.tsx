import { fireEvent, render, screen } from '@testing-library/react';
import { Cover, coverSrcSet } from './Cover';

const base = { id: 'abc', title: 'Fábulas', type: 'BOOK' as const, hasCover: true };

describe('Cover (miniaturas de portada, 2026-11-01)', () => {
  it('en cuadrícula pide la miniatura de 240 px con srcset/sizes y dimensiones fijas (sin saltos)', () => {
    render(<Cover resource={base} />);
    const img = screen.getByRole('img', { name: 'Portada de Fábulas' }) as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/api/resources/abc/cover?w=240');
    expect(img.getAttribute('srcset')).toBe('/api/resources/abc/cover?w=240 240w, /api/resources/abc/cover?w=480 480w');
    expect(img.getAttribute('sizes')).toContain('240px');
    expect(img.getAttribute('width')).toBe('240');
    expect(img.getAttribute('height')).toBe('320');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('en ficha/TV pide la miniatura de 480 px', () => {
    render(<Cover resource={base} size="large" />);
    const img = screen.getByRole('img', { name: 'Portada de Fábulas' });
    expect(img.getAttribute('src')).toBe('/api/resources/abc/cover?w=480');
    expect(img.getAttribute('width')).toBe('480');
    expect(img.getAttribute('height')).toBe('640');
  });

  it('sin portada o si la imagen falla, muestra el respaldo por tipo', () => {
    const { rerender } = render(<Cover resource={{ ...base, hasCover: false }} />);
    expect(screen.getByRole('img', { name: 'Libro digital: Fábulas (sin portada)' })).toBeInTheDocument();
    expect(coverSrcSet({ id: 'abc', hasCover: false })).toBeUndefined();

    rerender(<Cover resource={{ ...base, id: 'otra', type: 'GALLERY' }} />);
    fireEvent.error(screen.getByRole('img', { name: 'Portada de Fábulas' }));
    expect(screen.getByRole('img', { name: 'Galería interactiva: Fábulas (sin portada)' })).toBeInTheDocument();
  });
});

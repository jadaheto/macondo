export const metadata = { title: 'Kiosco' };

/** Perfil kiosco táctil Digiturno (branding.md §3.4): fuente del sistema, controles ≥56px. */
export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-brand-profile="kiosco" className="min-h-screen select-none bg-brand-bg font-sans text-brand-text">
      {children}
    </div>
  );
}

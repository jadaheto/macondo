export const metadata = { title: 'Macondo TV' };

/** Perfil pantalla de sala (branding.md §3.5): Inter local, fondo ambiental. */
export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* React 19 eleva esta hoja al <head> (precedence). */}
      <link rel="stylesheet" href="/brand/css/inter-local.css" precedence="default" />
      <div
        data-brand-profile="sala"
        className="modo-tv h-screen w-screen overflow-hidden font-sans text-brand-text"
        style={{ background: 'var(--sala-ambient)' }}
      >
        {children}
      </div>
    </>
  );
}

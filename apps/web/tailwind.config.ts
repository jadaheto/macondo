import type { Config } from 'tailwindcss';

/**
 * Tokens por ROL de la identidad Comfasucre (branding/branding.md §3, §5, §10).
 * Los valores viven como variables CSS en `src/app/globals.css`:
 *   - `:root`                          → perfil estudiante (paleta PQR §3.1 + Outfit, escalas infantiles grandes: PROPUESTA)
 *   - `[data-brand-profile="kiosco"]`  → perfil kiosco táctil Digiturno (§3.4)
 *   - `[data-brand-profile="sala"]`    → perfil pantalla de sala (§3.5)
 * Los componentes usan solo roles (bg-brand-primary, text-brand-text, border-brand-border,
 * ring-brand-focus…), nunca hex sueltos. Contraste verificado: docs/BRANDING-PUBLICO.md.
 */
const role = (v: string) => `rgb(var(--brand-${v}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: role('primary'),
          'primary-hover': role('primary-hover'),
          secondary: role('secondary'),
          accent: role('accent'),
          'accent-strong': role('accent-strong'),
          positive: role('positive'),
          'positive-strong': role('positive-strong'),
          heading: role('heading'),
          text: role('text'),
          muted: role('muted'),
          surface: role('surface'),
          soft: role('soft'),
          bg: role('bg'),
          border: role('border'),
          'control-border': role('control-border'),
          'control-hover': role('control-hover'),
          focus: role('focus'),
          'on-primary': role('on-primary'),
          'success-bg': role('success-bg'),
          'success-text': role('success-text'),
          'warning-bg': role('warning-bg'),
          'warning-text': role('warning-text'),
          'danger-bg': role('danger-bg'),
          'danger-text': role('danger-text'),
          'info-bg': role('info-bg'),
          'info-text': role('info-text'),
          'disabled-bg': role('disabled-bg'),
          'disabled-text': role('disabled-text'),
          /* Acento secundario Macondo (mariposa): solo decorativo, nunca compite con la marca. */
          macondo: '#F2C230',
        },
      },
      fontFamily: {
        sans: ['var(--brand-font)'],
        brand: ['var(--brand-font)'],
      },
      minHeight: { touch: 'var(--brand-touch)', 'touch-lg': '72px', kiosk: '56px' },
      minWidth: { touch: 'var(--brand-touch)', kiosk: '56px' },
      borderRadius: {
        control: 'var(--brand-radius-control)',
        card: 'var(--brand-radius-card)',
        panel: 'var(--brand-radius-panel)',
      },
      boxShadow: {
        card: 'var(--brand-shadow)',
        'card-hover': 'var(--brand-shadow-hover)',
        halo: '0 0 0 3px var(--brand-focus-halo)',
      },
      transitionDuration: { brand: '180ms' },
      keyframes: {
        aparecer: { from: { opacity: '0' }, to: { opacity: '1' } },
        girar: { to: { transform: 'rotate(360deg)' } },
        'tv-entrar': { from: { opacity: '0', transform: 'translateY(1.5%) scale(0.995)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        aparecer: 'aparecer 600ms ease-out both',
        girar: 'girar 1s linear infinite',
        'tv-entrar': 'tv-entrar 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;

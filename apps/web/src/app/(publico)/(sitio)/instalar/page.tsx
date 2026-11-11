'use client';

/**
 * /instalar — instalación de la app Android (APK) en tablets Fire HD 10 y en el kiosco Android de 32".
 * Página pública sin enlace en la cabecera: se llega por URL o desde el tutorial/manual.
 * Lee /descargas/macondo-digital.json (versión, SHA-256, tamaño) generado al compilar el APK
 * (apps/android/README.md §Publicar) y construye el QR con el origen actual del navegador.
 */
import { useEffect, useState } from 'react';
import { QrCode } from '@/components/QrCode';
import { Icon } from '@/components/Icon';
import { AvisoParcial } from '@/components/StateViews';
import { formatBytes } from '@/lib/resource';

type ApkInfo = { version: string; versionCode?: number; sha256: string; sizeBytes: number; builtAt: string; minAndroid?: string };

const APK_PATH = '/descargas/macondo-digital.apk';
/** Dirección principal del servidor (la app 1.1.0 la trae por defecto) y respaldo en la red local sin internet. */
const SERVER_PUBLIC = 'https://macondo.comfasucre.co';
const SERVER_LAN = 'https://192.168.31.240:3443';

const PASOS: { titulo: string; detalle: string }[] = [
  {
    titulo: 'Conecta la tablet al Wi-Fi de la biblioteca',
    detalle: 'Ajustes → Internet → red de la biblioteca. La tablet debe ver el servidor de Macondo Digital.',
  },
  {
    titulo: 'Permite instalar apps desconocidas en Silk',
    detalle:
      'Ajustes → Seguridad y privacidad → Aplicaciones de origen desconocido → Silk Browser → activar. (En Fire OS 5/6: Ajustes → Seguridad → «Aplicaciones de origen desconocido».)',
  },
  {
    titulo: 'Descarga el APK',
    detalle: 'Abre Silk, escanea el QR de esta página o escribe la dirección del APK. Pulsa «Aceptar» cuando Silk avise de la descarga.',
  },
  {
    titulo: 'Instala y abre',
    detalle: 'Barra de notificaciones → «macondo-digital.apk descargado» → Instalar → Abrir. Aparecerá el icono «Macondo Digital» en el inicio.',
  },
  {
    titulo: 'Configura la dirección (solo si cambia el servidor)',
    detalle:
      `La app ya trae la dirección principal ${SERVER_PUBLIC}. Si la biblioteca se queda sin internet y el servidor está en la red local, cámbiala por ${SERVER_LAN}: mantén pulsado el logotipo en la pantalla de arranque → Configuración. El PIN inicial está en el manual del bibliotecario.`,
  },
  {
    titulo: 'Comprueba la descarga sin conexión',
    detalle: 'En la ficha de un libro pulsa «Descargar para uso sin conexión»; activa el modo avión y ábrelo desde «Sin conexión».',
  },
];

export default function InstalarPage() {
  const [origin, setOrigin] = useState<string>('');
  const [info, setInfo] = useState<ApkInfo | null | 'error'>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch('/descargas/macondo-digital.json', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<ApkInfo>) : Promise.reject(new Error(String(r.status)))))
      .then(setInfo)
      .catch(() => setInfo('error'));
  }, []);

  const apkUrl = origin ? `${origin}${APK_PATH}` : APK_PATH;
  const isHttps = origin.startsWith('https://');

  return (
    <div>
      <h1 className="text-3xl font-bold">Instalar la app en tablets Fire HD 10 y en el kiosco</h1>
      <p className="mt-2 text-brand-muted">
        Macondo Digital funciona en el navegador, pero en las tablets Amazon Fire la aplicación Android (APK) es la que permite guardar libros y
        audios para usarlos sin Wi-Fi y fijar la tablet en modo kiosco. Se instala sin Google Play, directamente desde este servidor. La misma app
        se usa en el <strong>tótem táctil Android de 32"</strong>: en Configuración elige el modo <strong>Kiosco</strong> y una escala de
        <strong> 125–150 %</strong> para que botones y textos sean grandes.
      </p>

      <section className="mt-6 grid gap-6 md:grid-cols-[auto,1fr]">
        <div className="tarjeta flex flex-col items-center gap-3 p-5">
          {origin ? <QrCode value={apkUrl} label={`Código QR para descargar ${apkUrl}`} size={220} /> : <div className="h-[220px] w-[220px] animate-pulse rounded-control bg-brand-soft" aria-hidden="true" />}
          <a href={APK_PATH} className="btn-primario" download="macondo-digital.apk">
            <Icon name="descarga" className="h-5 w-5" /> Descargar APK
          </a>
          <code className="break-all text-center text-xs text-brand-muted">{apkUrl}</code>
        </div>

        <div className="tarjeta p-5">
          <h2 className="text-xl font-bold text-brand-primary">Datos del paquete</h2>
          {info === null && <p className="mt-2 text-brand-muted">Cargando…</p>}
          {info === 'error' && (
            <div className="mt-2">
              <AvisoParcial>
                Aún no hay un APK publicado en este servidor (<code>/descargas/macondo-digital.json</code>). Ver <code>apps/android/README.md</code>.
              </AvisoParcial>
            </div>
          )}
          {info !== null && info !== 'error' && (
            <dl className="mt-3 grid grid-cols-[max-content,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-semibold">Versión</dt>
              <dd>
                {info.version}
                {info.versionCode ? <span className="text-brand-muted"> (código {info.versionCode})</span> : null}
              </dd>
              <dt className="font-semibold">Tamaño</dt>
              <dd>{formatBytes(info.sizeBytes)}</dd>
              <dt className="font-semibold">Compilado</dt>
              <dd>{new Date(info.builtAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
              <dt className="font-semibold">Android mínimo</dt>
              <dd>{info.minAndroid ?? 'Android 9 (Fire OS 7) o superior'}</dd>
              <dt className="font-semibold">SHA-256</dt>
              <dd>
                <code className="break-all text-xs">{info.sha256}</code>
              </dd>
            </dl>
          )}
          <p className="mt-4 text-sm text-brand-muted">
            Paquete <code>co.com.comfasucre.macondo</code>, firmado por la biblioteca. Permisos: solo Internet, estado de red y mantener la pantalla
            encendida. Para verificar la descarga en un PC: <code>shasum -a 256 macondo-digital.apk</code> debe coincidir con el SHA-256.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Pasos en la tablet</h2>
        <ol className="mt-3 space-y-3">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="tarjeta flex gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-brand-on-primary" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-brand-primary">{p.titulo}</h3>
                <p className="mt-1 text-sm text-brand-muted">{p.detalle}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 tarjeta p-5">
        <h2 className="flex items-center gap-2 text-xl font-bold text-brand-primary">
          <Icon name="candado" className="h-6 w-6" /> Dirección del servidor
        </h2>
        <p className="mt-2 text-sm text-brand-muted">
          Para que la tablet pueda guardar recursos sin conexión, el servidor debe abrirse por <strong>https://</strong>. La dirección principal es{' '}
          <code>{SERVER_PUBLIC}</code> (dominio público con certificado válido; la app la trae configurada). Si la biblioteca se queda sin internet y el
          servidor está en la red local, la dirección de respaldo es <code>{SERVER_LAN}</code>: la app ya confía en el certificado propio de la biblioteca,
          por eso tampoco hay que instalar nada más en la tablet. Para cambiar de una a otra: Configuración → Dirección del servidor.
        </p>
        {origin && !isHttps && (
          <div className="mt-3">
            <AvisoParcial>
              Estás viendo esta página por <code>{origin}</code> (sin HTTPS). Desde el navegador en esta dirección no funcionan las descargas sin
              conexión; la app Android sí las permite al usar la dirección https.
            </AvisoParcial>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Problemas frecuentes</h2>
        <ul className="mt-3 space-y-2 text-sm text-brand-muted">
          <li>
            <strong className="text-brand-text">«No se pudo conectar con la biblioteca»</strong>: revisa el Wi-Fi y que el servidor esté encendido; pulsa
            «Reintentar». Si cambió la IP del servidor, corrige la dirección en Configuración.
          </li>
          <li>
            <strong className="text-brand-text">Error de certificado</strong>: el certificado del servidor fue regenerado con otra CA. Hay que instalar el APK
            compilado con la nueva CA (o usar un dominio público con HTTPS).
          </li>
          <li>
            <strong className="text-brand-text">«Aplicación no instalada»</strong>: ya existe una versión firmada con otra clave. Desinstala la anterior
            (se pierden las descargas sin conexión) e instala de nuevo.
          </li>
          <li>
            <strong className="text-brand-text">Actualizar</strong>: descarga el nuevo APK desde esta misma página e instálalo encima; no hace falta desinstalar.
          </li>
        </ul>
      </section>
    </div>
  );
}

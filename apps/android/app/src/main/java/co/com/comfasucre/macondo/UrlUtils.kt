package co.com.comfasucre.macondo

import java.net.URI

/** Modo de uso elegido en Configuración; cada uno abre una ruta distinta de la web. */
enum class AppMode(val prefValue: String, val startPath: String) {
    TABLET("tablet", "/"),
    KIOSK("kiosco", "/kiosco"),
    TV("tv", "/tv");

    companion object {
        fun fromPref(value: String?): AppMode = entries.firstOrNull { it.prefValue == value } ?: TABLET
    }
}

/**
 * Validación de la URL del servidor y comprobación de origen. Sin dependencias Android para
 * poder probarlo con JUnit puro.
 */
object UrlUtils {
    /**
     * Normaliza la URL escrita por el bibliotecario: recorta espacios, exige http/https y un
     * host, elimina la barra final y descarta rutas/consultas (solo se configura el origen).
     * Devuelve null si no es válida.
     */
    fun normalizeServerUrl(input: String?): String? {
        val raw = input?.trim()?.trimEnd('/') ?: return null
        if (raw.isEmpty() || raw.any { it.isWhitespace() }) return null
        val uri = try { URI(raw) } catch (_: Exception) { return null }
        val scheme = uri.scheme?.lowercase() ?: return null
        if (scheme != "http" && scheme != "https") return null
        val host = uri.host ?: return null
        if (host.isEmpty() || uri.userInfo != null) return null
        if (!uri.path.isNullOrEmpty() && uri.path != "/") return null
        if (uri.query != null || uri.fragment != null) return null
        val port = if (uri.port == -1) "" else ":${uri.port}"
        val hostOut = if (host.contains(':') && !host.startsWith("[")) "[$host]" else host
        return "$scheme://${hostOut.lowercase()}$port"
    }

    /** true si [url] pertenece al mismo origen (esquema + host + puerto) que [serverUrl]. */
    fun isSameOrigin(url: String?, serverUrl: String): Boolean {
        if (url == null) return false
        val a = try { URI(url) } catch (_: Exception) { return false }
        val b = try { URI(serverUrl) } catch (_: Exception) { return false }
        if (a.scheme == null || a.host == null) return false
        return a.scheme.equals(b.scheme, ignoreCase = true) &&
            a.host.equals(b.host, ignoreCase = true) &&
            effectivePort(a) == effectivePort(b)
    }

    private fun effectivePort(u: URI): Int = when {
        u.port != -1 -> u.port
        u.scheme.equals("https", true) -> 443
        else -> 80
    }

    /** Escalas de pantalla admitidas (porcentaje). */
    val SCALES = listOf(100, 125, 150, 175)

    /**
     * URL de inicio según el modo: origen + ruta del modo. Si la escala no es 100 % se añade
     * `?escala=1.25` (la web la lee para agrandar su interfaz; el WebView aplica además textZoom).
     */
    fun startUrl(serverUrl: String, mode: AppMode, scalePercent: Int = 100): String {
        val base = serverUrl.trimEnd('/') + mode.startPath
        if (scalePercent == 100 || scalePercent !in SCALES) return base
        val factor = (scalePercent / 100.0).toString().trimEnd('0').trimEnd('.')
        return "$base?escala=$factor"
    }

    /** PIN válido: solo dígitos, entre 4 y 6. */
    fun isValidPin(pin: String?): Boolean = pin != null && pin.length in 4..6 && pin.all { it.isDigit() }
}

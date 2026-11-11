package co.com.comfasucre.macondo

import android.content.Context
import android.content.SharedPreferences

/** Orientación forzada de la pantalla (Configuración → Orientación). */
enum class Orientation(val prefValue: String) {
    AUTO("auto"), LANDSCAPE("horizontal"), PORTRAIT("vertical");

    companion object {
        fun fromPref(value: String?): Orientation? = entries.firstOrNull { it.prefValue == value }
    }
}

/**
 * Preferencias persistentes de la app (SharedPreferences). Varias tienen un valor por defecto que
 * depende del modo (Tablet/Kiosco/TV) mientras el bibliotecario no las fije explícitamente.
 */
class Prefs(context: Context) {
    private val sp: SharedPreferences = context.getSharedPreferences("macondo", Context.MODE_PRIVATE)

    var serverUrl: String
        get() = sp.getString(KEY_URL, null) ?: BuildConfig.DEFAULT_SERVER_URL
        set(value) = sp.edit().putString(KEY_URL, value).apply()

    var mode: AppMode
        get() = AppMode.fromPref(sp.getString(KEY_MODE, null))
        set(value) = sp.edit().putString(KEY_MODE, value.prefValue).apply()

    /** Modo kiosco (barras ocultas + pantalla fija si es device owner). Por defecto ON en modo Kiosco. */
    var kioskEnabled: Boolean
        get() = if (sp.contains(KEY_KIOSK)) sp.getBoolean(KEY_KIOSK, false) else Defaults.kiosk(mode)
        set(value) = sp.edit().putBoolean(KEY_KIOSK, value).apply()

    /** Arrancar la app al encender el dispositivo. Por defecto ON en Kiosco y TV. */
    var autostart: Boolean
        get() = if (sp.contains(KEY_AUTOSTART)) sp.getBoolean(KEY_AUTOSTART, false) else Defaults.autostart(mode)
        set(value) = sp.edit().putBoolean(KEY_AUTOSTART, value).apply()

    /** Mantener la pantalla encendida. Por defecto ON en Kiosco y TV. */
    var keepScreenOn: Boolean
        get() = if (sp.contains(KEY_KEEP_ON)) sp.getBoolean(KEY_KEEP_ON, false) else Defaults.keepScreenOn(mode)
        set(value) = sp.edit().putBoolean(KEY_KEEP_ON, value).apply()

    /** Orientación. Por defecto: TV horizontal, el resto automática. */
    var orientation: Orientation
        get() = Orientation.fromPref(sp.getString(KEY_ORIENTATION, null)) ?: Defaults.orientation(mode)
        set(value) = sp.edit().putString(KEY_ORIENTATION, value.prefValue).apply()

    /** Escala de pantalla en porcentaje (100/125/150/175). */
    var scalePercent: Int
        get() = sp.getInt(KEY_SCALE, 100).let { if (it in UrlUtils.SCALES) it else 100 }
        set(value) = sp.edit().putInt(KEY_SCALE, value).apply()

    /** La app actúa como pantalla de inicio (launcher) del dispositivo. */
    var useAsHome: Boolean
        get() = sp.getBoolean(KEY_HOME, false)
        set(value) = sp.edit().putBoolean(KEY_HOME, value).apply()

    var pin: String
        get() = sp.getString(KEY_PIN, null) ?: BuildConfig.DEFAULT_PIN
        set(value) = sp.edit().putString(KEY_PIN, value).apply()

    fun startUrl(): String = UrlUtils.startUrl(serverUrl, mode, scalePercent)

    /** Valores por defecto según el modo (también los usa la pantalla de Configuración). */
    object Defaults {
        fun kiosk(mode: AppMode) = mode == AppMode.KIOSK
        fun autostart(mode: AppMode) = mode != AppMode.TABLET
        fun keepScreenOn(mode: AppMode) = mode != AppMode.TABLET
        fun orientation(mode: AppMode) = if (mode == AppMode.TV) Orientation.LANDSCAPE else Orientation.AUTO
    }

    private companion object {
        const val KEY_URL = "server_url"
        const val KEY_MODE = "mode"
        const val KEY_KIOSK = "kiosk_enabled"
        const val KEY_AUTOSTART = "autostart"
        const val KEY_KEEP_ON = "keep_screen_on"
        const val KEY_ORIENTATION = "orientation"
        const val KEY_SCALE = "scale_percent"
        const val KEY_HOME = "use_as_home"
        const val KEY_PIN = "pin"
    }
}

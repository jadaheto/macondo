package co.com.comfasucre.macondo

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Arranque automático: al encender el dispositivo (BOOT_COMPLETED) o tras actualizar la app
 * (MY_PACKAGE_REPLACED) abre MainActivity si «Iniciar al encender» está activo.
 *
 * Nota: desde Android 10 el sistema puede impedir que un receptor en segundo plano abra una
 * actividad salvo que la app sea device owner o la pantalla de inicio (launcher). Por eso, en el
 * kiosco se recomienda además «Usar como pantalla de inicio» (ver README).
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action !in ACTIONS) return
        if (!Prefs(context).autostart) return
        val launch = Intent(context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        try {
            context.startActivity(launch)
        } catch (_: Exception) {
            // Bloqueado por el sistema (Android 10+ sin device owner/launcher): el usuario abre la app a mano.
        }
    }

    private companion object {
        val ACTIONS = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            "android.intent.action.QUICKBOOT_POWERON",
        )
    }
}

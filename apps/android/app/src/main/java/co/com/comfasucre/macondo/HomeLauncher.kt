package co.com.comfasucre.macondo

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager

/**
 * «Usar como pantalla de inicio»: activa/desactiva el alias HOME del manifiesto (.HomeActivity).
 * Si la app es device owner, además la fija como launcher por defecto sin preguntar al usuario
 * (addPersistentPreferredActivity); si no, Android mostrará el selector de launcher la próxima vez
 * que se pulse Inicio.
 */
object HomeLauncher {
    private fun alias(context: Context) = ComponentName(context, "${context.packageName}.HomeActivity")

    fun isEnabled(context: Context): Boolean =
        context.packageManager.getComponentEnabledSetting(alias(context)) == PackageManager.COMPONENT_ENABLED_STATE_ENABLED

    fun apply(context: Context, enabled: Boolean) {
        val pm = context.packageManager
        pm.setComponentEnabledSetting(
            alias(context),
            if (enabled) PackageManager.COMPONENT_ENABLED_STATE_ENABLED else PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP,
        )
        if (!MacondoDeviceAdminReceiver.isDeviceOwner(context)) return
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = MacondoDeviceAdminReceiver.component(context)
        if (enabled) {
            val filter = IntentFilter(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                addCategory(Intent.CATEGORY_DEFAULT)
            }
            dpm.addPersistentPreferredActivity(admin, filter, alias(context))
        } else {
            dpm.clearPackagePersistentPreferredActivities(admin, context.packageName)
        }
    }
}

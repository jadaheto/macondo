package co.com.comfasucre.macondo

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context

/**
 * Receptor de administración de dispositivo. No aplica políticas: solo existe para que la app
 * pueda ser "device owner" (adb shell dpm set-device-owner …) y así fijar la pantalla (lock task)
 * en modo kiosco. Ver README.md §Modo kiosco.
 */
class MacondoDeviceAdminReceiver : DeviceAdminReceiver() {
    companion object {
        fun component(context: Context) = ComponentName(context, MacondoDeviceAdminReceiver::class.java)

        fun isDeviceOwner(context: Context): Boolean {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            return dpm.isDeviceOwnerApp(context.packageName)
        }

        /** Autoriza a esta app para lock task. Solo surte efecto si somos device owner. */
        fun allowLockTask(context: Context) {
            if (!isDeviceOwner(context)) return
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            dpm.setLockTaskPackages(component(context), arrayOf(context.packageName))
        }
    }
}

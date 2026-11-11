package co.com.comfasucre.macondo

import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import co.com.comfasucre.macondo.databinding.ActivitySettingsBinding

/**
 * Configuración (solo bibliotecario): dirección del servidor, modo de uso, modo kiosco y PIN.
 * MainActivity ya pidió el PIN antes de abrir esta pantalla cuando el kiosco está activo.
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private lateinit var prefs: Prefs

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setTheme(R.style.Theme_Macondo_Settings)
        prefs = Prefs(this)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        supportActionBar?.setTitle(R.string.settings_title)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        with(binding) {
            urlInput.setText(prefs.serverUrl)
            when (prefs.mode) {
                AppMode.TABLET -> modeTablet.isChecked = true
                AppMode.KIOSK -> modeKiosk.isChecked = true
                AppMode.TV -> modeTv.isChecked = true
            }
            kioskSwitch.isChecked = prefs.kioskEnabled
            keepOnSwitch.isChecked = prefs.keepScreenOn
            autostartSwitch.isChecked = prefs.autostart
            homeSwitch.isChecked = prefs.useAsHome
            when (prefs.orientation) {
                Orientation.AUTO -> orientationAuto.isChecked = true
                Orientation.LANDSCAPE -> orientationLandscape.isChecked = true
                Orientation.PORTRAIT -> orientationPortrait.isChecked = true
            }
            when (prefs.scalePercent) {
                125 -> scale125.isChecked = true
                150 -> scale150.isChecked = true
                175 -> scale175.isChecked = true
                else -> scale100.isChecked = true
            }
            // Al cambiar de modo se proponen los valores por defecto de ese modo (se pueden ajustar antes de guardar).
            modeGroup.setOnCheckedChangeListener { _, id ->
                val m = modeFromId(id)
                kioskSwitch.isChecked = Prefs.Defaults.kiosk(m)
                keepOnSwitch.isChecked = Prefs.Defaults.keepScreenOn(m)
                autostartSwitch.isChecked = Prefs.Defaults.autostart(m)
                when (Prefs.Defaults.orientation(m)) {
                    Orientation.LANDSCAPE -> orientationLandscape.isChecked = true
                    else -> orientationAuto.isChecked = true
                }
            }
            val owner = MacondoDeviceAdminReceiver.isDeviceOwner(this@SettingsActivity)
            deviceOwnerStatus.setText(if (owner) R.string.settings_device_owner_yes else R.string.settings_device_owner_no)
            versionText.text = getString(R.string.settings_version, BuildConfig.VERSION_NAME, BuildConfig.APPLICATION_ID)

            presetMainButton.setOnClickListener { urlInput.setText(BuildConfig.DEFAULT_SERVER_URL) }
            presetLanButton.setOnClickListener { urlInput.setText(BuildConfig.LAN_SERVER_URL) }
            exitKioskButton.setOnClickListener { exitKiosk() }
            clearOwnerButton.isVisible = owner
            clearOwnerButton.setOnClickListener { confirmClearOwner() }
            saveButton.setOnClickListener { save() }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private fun save() {
        val url = UrlUtils.normalizeServerUrl(binding.urlInput.text.toString())
        if (url == null) {
            binding.urlInput.error = getString(R.string.error_url_invalid)
            binding.urlInput.requestFocus()
            return
        }
        val newPin = binding.pinInput.text.toString()
        if (newPin.isNotEmpty()) {
            if (!UrlUtils.isValidPin(newPin)) {
                binding.pinInput.error = getString(R.string.error_pin_invalid)
                return
            }
            if (newPin != binding.pinConfirmInput.text.toString()) {
                binding.pinConfirmInput.error = getString(R.string.error_pin_mismatch)
                return
            }
            prefs.pin = newPin
        }
        prefs.serverUrl = url
        prefs.mode = modeFromId(binding.modeGroup.checkedRadioButtonId)
        prefs.kioskEnabled = binding.kioskSwitch.isChecked
        prefs.keepScreenOn = binding.keepOnSwitch.isChecked
        prefs.autostart = binding.autostartSwitch.isChecked
        prefs.orientation = when (binding.orientationGroup.checkedRadioButtonId) {
            R.id.orientationLandscape -> Orientation.LANDSCAPE
            R.id.orientationPortrait -> Orientation.PORTRAIT
            else -> Orientation.AUTO
        }
        prefs.scalePercent = when (binding.scaleGroup.checkedRadioButtonId) {
            R.id.scale125 -> 125
            R.id.scale150 -> 150
            R.id.scale175 -> 175
            else -> 100
        }
        val home = binding.homeSwitch.isChecked
        if (home != prefs.useAsHome || HomeLauncher.isEnabled(this) != home) {
            prefs.useAsHome = home
            HomeLauncher.apply(this, home)
        }
        Toast.makeText(this, R.string.settings_saved, Toast.LENGTH_SHORT).show()
        restartMain()
    }

    private fun modeFromId(id: Int): AppMode = when (id) {
        R.id.modeKiosk -> AppMode.KIOSK
        R.id.modeTv -> AppMode.TV
        else -> AppMode.TABLET
    }

    /** Desactiva el kiosco y libera la pantalla fija si estaba activa. El PIN ya se validó al entrar. */
    private fun exitKiosk() {
        prefs.kioskEnabled = false
        binding.kioskSwitch.isChecked = false
        val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        if (am.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE) stopLockTask()
        Toast.makeText(this, R.string.kiosk_exited, Toast.LENGTH_SHORT).show()
    }

    /**
     * Renuncia a ser device owner (solo la propia app puede hacerlo sin restablecer de fábrica).
     * Tras esto el modo kiosco solo ocultará las barras.
     */
    private fun confirmClearOwner() {
        AlertDialog.Builder(this)
            .setTitle(R.string.settings_clear_owner)
            .setMessage(R.string.settings_clear_owner_confirm)
            .setPositiveButton(R.string.pin_dialog_ok) { _, _ ->
                exitKiosk()
                val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
                @Suppress("DEPRECATION")
                dpm.clearDeviceOwnerApp(packageName)
                binding.clearOwnerButton.isVisible = false
                binding.deviceOwnerStatus.setText(R.string.settings_device_owner_no)
                Toast.makeText(this, R.string.settings_clear_owner_done, Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton(R.string.pin_dialog_cancel, null)
            .show()
    }

    /** Vuelve a MainActivity limpiando la pila para que recargue con la nueva configuración. */
    private fun restartMain() {
        val intent = Intent(this, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        startActivity(intent)
        finish()
    }
}

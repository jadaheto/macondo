package co.com.comfasucre.macondo

import android.annotation.SuppressLint
import android.app.ActivityManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.graphics.Bitmap
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.text.InputType
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.PermissionRequest
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.isVisible
import co.com.comfasucre.macondo.databinding.ActivityMainBinding

/**
 * Pantalla única: un WebView que muestra la web de Macondo Digital servida por la biblioteca.
 *
 * - Navegación confinada al origen configurado; los enlaces externos abren el navegador del sistema.
 * - Error de red/TLS en el marco principal → página de error propia (assets/error.html) con
 *   «Reintentar» y «Configuración» (enlaces macondo://).
 * - Modo kiosco: barras del sistema ocultas, pantalla encendida y, si la app es device owner,
 *   pantalla fija (lock task) de la que solo se sale con el PIN desde Configuración.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: Prefs
    private lateinit var webView: WebView

    /** Vista a pantalla completa pedida por la web (video, galería). */
    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null

    /** true mientras se muestra la página de error nativa (no es parte del historial web). */
    private var showingError = false
    private var splashShownAt = 0L

    /** Pulsación larga (3 s) en la esquina superior izquierda → PIN → Configuración. */
    private val cornerPress = Runnable { openSettings() }
    private var cornerPressing = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = Prefs(this)
        // Salimos del tema de arranque (fondo con logotipo) al tema normal de la app.
        setTheme(R.style.Theme_Macondo)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        webView = binding.webView

        configureWebView()
        applyModeFlags()
        setupSplash()
        setupBackNavigation()
        // Mantiene coherente el alias HOME con la preferencia (p. ej. tras reinstalar).
        if (HomeLauncher.isEnabled(this) != prefs.useAsHome) HomeLauncher.apply(this, prefs.useAsHome)

        if (savedInstanceState == null) {
            loadStart()
        } else {
            webView.restoreState(savedInstanceState)
            hideSplash()
        }
    }

    override fun onResume() {
        super.onResume()
        applyKiosk()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        if (!showingError) webView.saveState(outState)
    }

    override fun onDestroy() {
        cancelCornerPress()
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus && prefs.kioskEnabled) hideSystemBars()
    }

    // ── WebView ────────────────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            @Suppress("DEPRECATION")
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            allowFileAccess = false
            allowContentAccess = false
            setSupportMultipleWindows(false)
            javaScriptCanOpenWindowsAutomatically = false
            // La web trae sus propios controles de tamaño de letra.
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "$userAgentString MacondoDigitalApp/${BuildConfig.VERSION_NAME}"
            // Escala de pantalla (Configuración): agranda el texto; la web recibe además ?escala=.
            textZoom = prefs.scalePercent
        }
        webView.isVerticalScrollBarEnabled = true
        if (prefs.kioskEnabled) {
            // Sin menú contextual ni selección de texto en el kiosco (pulsación larga tragada).
            webView.isLongClickable = false
            webView.setOnLongClickListener { true }
            webView.isHapticFeedbackEnabled = false
        }
        webView.webViewClient = MacondoWebViewClient()
        webView.webChromeClient = MacondoChromeClient()
    }

    private fun loadStart() {
        showingError = false
        webView.loadUrl(prefs.startUrl())
    }

    /** Muestra la página de error nativa con el detalle técnico (URL + motivo). */
    private fun showErrorPage(failingUrl: String?, reason: String) {
        if (showingError) return
        showingError = true
        hideSplash()
        val html = assets.open("error.html").bufferedReader().use { it.readText() }
            .replace("__DETALLE__", escapeHtml("${failingUrl ?: prefs.serverUrl}\n$reason").replace("\n", "<br>"))
        // baseUrl file:///android_res/ permite cargar el logotipo local sin habilitar acceso a archivos.
        webView.loadDataWithBaseURL("file:///android_res/drawable/", html, "text/html", "utf-8", null)
    }

    private fun escapeHtml(s: String) = s
        .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;")

    private inner class MacondoWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val url = request.url.toString()
            // Acciones de la página de error nativa.
            if (request.url.scheme == "macondo") {
                when (request.url.host) {
                    "reintentar" -> { webView.clearHistory(); loadStart() }
                    "configuracion" -> openSettings()
                }
                return true
            }
            // Dentro del origen configurado: navegación normal en el WebView.
            if (UrlUtils.isSameOrigin(url, prefs.serverUrl)) return false
            // Recursos locales de la propia app (página de error).
            if (url.startsWith("file:///android_res/") || url.startsWith("file:///android_asset/")) return false
            // Cualquier otro destino: navegador del sistema (si la tablet tiene uno disponible).
            openExternal(request.url)
            return true
        }

        override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
            if (!showingError && url != null && UrlUtils.isSameOrigin(url, prefs.serverUrl)) {
                binding.progress.isVisible = true
            }
        }

        override fun onPageFinished(view: WebView, url: String?) {
            binding.progress.isVisible = false
            hideSplash()
        }

        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
            // Solo el marco principal; los recursos secundarios (imágenes, fuentes) no tumban la página.
            if (!request.isForMainFrame) return
            showErrorPage(request.url.toString(), "${error.description} (código ${error.errorCode})")
        }

        // Errores TLS: NUNCA handler.proceed(). Se cancela la carga y se explica el motivo. Así un
        // certificado que no esté firmado por el sistema o por la CA de la biblioteca
        // (res/raw/macondo_ca.crt, declarada en network_security_config.xml) jamás se acepta.
        override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
            handler.cancel()
            val motivo = when (error.primaryError) {
                SslError.SSL_UNTRUSTED -> "Certificado no emitido por una entidad de confianza (¿CA de la biblioteca distinta a la del APK?)"
                SslError.SSL_IDMISMATCH -> "El certificado no corresponde a esta dirección IP/nombre"
                SslError.SSL_EXPIRED -> "Certificado caducado"
                SslError.SSL_NOTYETVALID -> "Certificado aún no válido (revisar fecha/hora de la tablet)"
                SslError.SSL_DATE_INVALID -> "Fecha del certificado no válida (revisar fecha/hora de la tablet)"
                else -> "Error de certificado TLS"
            }
            showErrorPage(error.url, motivo)
        }
    }

    private inner class MacondoChromeClient : WebChromeClient() {
        override fun onProgressChanged(view: WebView, newProgress: Int) {
            binding.progress.progress = newProgress
        }

        override fun onPermissionRequest(request: PermissionRequest) {
            // La biblioteca no usa cámara ni micrófono: se deniega todo.
            request.deny()
        }

        override fun onShowCustomView(view: View, callback: CustomViewCallback) {
            if (customView != null) { callback.onCustomViewHidden(); return }
            customView = view
            customViewCallback = callback
            binding.fullscreenContainer.addView(view, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
            binding.fullscreenContainer.isVisible = true
            webView.isVisible = false
            hideSystemBars()
        }

        override fun onHideCustomView() {
            val v = customView ?: return
            binding.fullscreenContainer.removeView(v)
            binding.fullscreenContainer.isVisible = false
            webView.isVisible = true
            customView = null
            customViewCallback?.onCustomViewHidden()
            customViewCallback = null
            if (prefs.kioskEnabled) hideSystemBars() else showSystemBars()
        }
    }

    private fun openExternal(uri: Uri) {
        // En lock task no se puede salir a otra app: se ignora en silencio.
        if (isInLockTask()) return
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(this, R.string.external_link_blocked, Toast.LENGTH_SHORT).show()
        }
    }

    // ── Pantalla de arranque y Configuración ──────────────────────────────────

    private fun setupSplash() {
        splashShownAt = System.currentTimeMillis()
        binding.splash.isVisible = true
        binding.splashLogo.setOnLongClickListener { openSettings(); true }
    }

    private fun hideSplash() {
        if (!binding.splash.isVisible) return
        // Mínimo 900 ms visible para dar tiempo a la pulsación larga.
        val remaining = 900 - (System.currentTimeMillis() - splashShownAt)
        binding.splash.postDelayed({ binding.splash.isVisible = false }, remaining.coerceAtLeast(0))
    }

    /** Abre Configuración; en modo kiosco pide antes el PIN. */
    private fun openSettings() {
        if (!prefs.kioskEnabled) {
            startActivity(Intent(this, SettingsActivity::class.java))
            return
        }
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = getString(R.string.pin_dialog_title)
        }
        AlertDialog.Builder(this)
            .setTitle(R.string.pin_dialog_title)
            .setMessage(R.string.pin_dialog_message)
            .setView(input)
            .setPositiveButton(R.string.pin_dialog_ok) { _, _ ->
                if (input.text.toString() == prefs.pin) {
                    startActivity(Intent(this, SettingsActivity::class.java))
                } else {
                    Toast.makeText(this, R.string.error_pin_wrong, Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton(R.string.pin_dialog_cancel, null)
            .show()
    }

    // ── Modos, kiosco y barras del sistema ────────────────────────────────────

    @SuppressLint("SourceLockedOrientationActivity")
    private fun applyModeFlags() {
        if (prefs.keepScreenOn) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        requestedOrientation = when (prefs.orientation) {
            Orientation.LANDSCAPE -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            Orientation.PORTRAIT -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
            Orientation.AUTO -> ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
        // Endurecimiento de kiosco: fuera de "Recientes", visible sobre la pantalla de bloqueo y
        // enciende la pantalla al arrancar (API 27+).
        val kiosk = prefs.kioskEnabled
        (getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).appTasks.forEach { it.setExcludeFromRecents(kiosk) }
        setShowWhenLocked(kiosk)
        setTurnScreenOn(kiosk)
    }

    /** Detecta la pulsación de 3 s en la esquina superior izquierda sin robar el toque a la web. */
    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        val corner = CORNER_DP * resources.displayMetrics.density
        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN -> if (ev.x <= corner && ev.y <= corner && binding.splash.isVisible.not()) {
                cornerPressing = true
                binding.root.postDelayed(cornerPress, CORNER_PRESS_MS)
            }
            MotionEvent.ACTION_MOVE -> if (cornerPressing && (ev.x > corner || ev.y > corner)) cancelCornerPress()
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> cancelCornerPress()
        }
        return super.dispatchTouchEvent(ev)
    }

    private fun cancelCornerPress() {
        cornerPressing = false
        binding.root.removeCallbacks(cornerPress)
    }

    private fun applyKiosk() {
        applyModeFlags()
        if (prefs.kioskEnabled) {
            hideSystemBars()
            if (MacondoDeviceAdminReceiver.isDeviceOwner(this) && !isInLockTask()) {
                MacondoDeviceAdminReceiver.allowLockTask(this)
                startLockTask()
            }
        } else {
            if (isInLockTask()) stopLockTask()
            showSystemBars()
        }
    }

    private fun isInLockTask(): Boolean {
        val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return am.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
    }

    private fun hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, binding.root).apply {
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            hide(WindowInsetsCompat.Type.systemBars())
        }
    }

    private fun showSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, true)
        WindowInsetsControllerCompat(window, binding.root).show(WindowInsetsCompat.Type.systemBars())
    }

    // ── Botón Atrás ───────────────────────────────────────────────────────────

    private companion object {
        const val CORNER_DP = 120f
        const val CORNER_PRESS_MS = 3000L
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    customView != null -> webView.webChromeClient?.onHideCustomView()
                    // En kiosco la pantalla de error y la raíz no se abandonan con Atrás.
                    prefs.kioskEnabled && !webView.canGoBack() -> Unit
                    showingError -> { webView.clearHistory(); loadStart() }
                    webView.canGoBack() -> webView.goBack()
                    // En kiosco/TV nunca se sale de la app con Atrás; en tablet se envía al fondo.
                    prefs.kioskEnabled || prefs.mode != AppMode.TABLET -> Unit
                    else -> moveTaskToBack(true)
                }
            }
        })
    }
}

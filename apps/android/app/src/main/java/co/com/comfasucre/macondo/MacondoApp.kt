package co.com.comfasucre.macondo

import android.app.Application
import android.webkit.WebView

/** Punto de entrada: habilita la depuración remota del WebView solo en compilaciones debug. */
class MacondoApp : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true)
    }
}

package co.com.comfasucre.macondo

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class UrlUtilsTest {

    @Test
    fun `normaliza URL valida con puerto`() {
        assertEquals("https://192.168.31.240:3443", UrlUtils.normalizeServerUrl("  https://192.168.31.240:3443/  "))
        assertEquals("http://192.168.31.240:3100", UrlUtils.normalizeServerUrl("http://192.168.31.240:3100"))
        assertEquals("https://macondo.comfasucre.com.co", UrlUtils.normalizeServerUrl("https://Macondo.Comfasucre.com.co/"))
    }

    @Test
    fun `rechaza URL sin esquema, con esquema raro, con ruta o vacia`() {
        assertNull(UrlUtils.normalizeServerUrl(null))
        assertNull(UrlUtils.normalizeServerUrl(""))
        assertNull(UrlUtils.normalizeServerUrl("192.168.31.240:3443"))
        assertNull(UrlUtils.normalizeServerUrl("ftp://192.168.31.240"))
        assertNull(UrlUtils.normalizeServerUrl("javascript:alert(1)"))
        assertNull(UrlUtils.normalizeServerUrl("https://192.168.31.240:3443/kiosco"))
        assertNull(UrlUtils.normalizeServerUrl("https://192.168.31.240:3443/?x=1"))
        assertNull(UrlUtils.normalizeServerUrl("https://user:pass@192.168.31.240"))
        assertNull(UrlUtils.normalizeServerUrl("https://192.168.31 .240"))
        assertNull(UrlUtils.normalizeServerUrl("https://"))
    }

    @Test
    fun `mismo origen compara esquema, host y puerto`() {
        val server = "https://192.168.31.240:3443"
        assertTrue(UrlUtils.isSameOrigin("https://192.168.31.240:3443/recurso/abc?x=1#y", server))
        assertTrue(UrlUtils.isSameOrigin("https://192.168.31.240:3443", server))
        assertFalse(UrlUtils.isSameOrigin("http://192.168.31.240:3443/", server))      // esquema distinto
        assertFalse(UrlUtils.isSameOrigin("https://192.168.31.240:3100/", server))     // puerto distinto
        assertFalse(UrlUtils.isSameOrigin("https://192.168.31.241:3443/", server))     // host distinto
        assertFalse(UrlUtils.isSameOrigin("https://evil.example/192.168.31.240:3443", server))
        assertFalse(UrlUtils.isSameOrigin("mailto:a@b.c", server))
        assertFalse(UrlUtils.isSameOrigin(null, server))
        assertFalse(UrlUtils.isSameOrigin("not a url", server))
    }

    @Test
    fun `puerto implicito se considera en el origen`() {
        assertTrue(UrlUtils.isSameOrigin("https://macondo.comfasucre.com.co:443/x", "https://macondo.comfasucre.com.co"))
        assertTrue(UrlUtils.isSameOrigin("http://macondo.local/x", "http://macondo.local:80"))
        assertFalse(UrlUtils.isSameOrigin("https://macondo.local:8443/x", "https://macondo.local"))
    }

    @Test
    fun `URL de inicio por modo`() {
        assertEquals("https://s:3443/", UrlUtils.startUrl("https://s:3443", AppMode.TABLET))
        assertEquals("https://s:3443/kiosco", UrlUtils.startUrl("https://s:3443/", AppMode.KIOSK))
        assertEquals("https://s:3443/tv", UrlUtils.startUrl("https://s:3443", AppMode.TV))
        assertEquals(AppMode.TABLET, AppMode.fromPref(null))
        assertEquals(AppMode.TV, AppMode.fromPref("tv"))
        assertEquals(AppMode.TABLET, AppMode.fromPref("otro"))
    }

    @Test
    fun `URL de inicio con escala`() {
        assertEquals("https://s:3443/kiosco", UrlUtils.startUrl("https://s:3443", AppMode.KIOSK, 100))
        assertEquals("https://s:3443/kiosco?escala=1.25", UrlUtils.startUrl("https://s:3443", AppMode.KIOSK, 125))
        assertEquals("https://s:3443/?escala=1.5", UrlUtils.startUrl("https://s:3443", AppMode.TABLET, 150))
        assertEquals("https://s:3443/tv?escala=1.75", UrlUtils.startUrl("https://s:3443", AppMode.TV, 175))
        // Escala no admitida → sin parámetro
        assertEquals("https://s:3443/kiosco", UrlUtils.startUrl("https://s:3443", AppMode.KIOSK, 137))
        assertEquals(listOf(100, 125, 150, 175), UrlUtils.SCALES)
    }

    @Test
    fun `PIN de 4 a 6 digitos`() {
        assertTrue(UrlUtils.isValidPin("2026"))
        assertTrue(UrlUtils.isValidPin("123456"))
        assertFalse(UrlUtils.isValidPin("123"))
        assertFalse(UrlUtils.isValidPin("1234567"))
        assertFalse(UrlUtils.isValidPin("12a4"))
        assertFalse(UrlUtils.isValidPin(null))
    }
}

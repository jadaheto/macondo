import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Firma de release: keystore.properties (junto a este proyecto) o variables de entorno.
// Ninguno de los dos se versiona; ver README.md §Firma.
val keystoreProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
fun signingValue(key: String, env: String): String? =
    keystoreProps.getProperty(key) ?: System.getenv(env)

val storeFilePath = signingValue("storeFile", "MACONDO_STORE_FILE")
val hasReleaseSigning = storeFilePath != null && file(storeFilePath).exists()

android {
    namespace = "co.com.comfasucre.macondo"
    compileSdk = 34
    buildToolsVersion = "34.0.0"

    defaultConfig {
        applicationId = "co.com.comfasucre.macondo"
        minSdk = 28          // Fire OS 7 = Android 9
        targetSdk = 34
        versionCode = 2
        versionName = "1.1.0"
        // Servidor principal (dominio público con certificado válido; no necesita la CA local).
        buildConfigField("String", "DEFAULT_SERVER_URL", "\"https://macondo.comfasucre.co\"")
        // Respaldo en la red local de la biblioteca (sin internet): HTTPS con la CA de res/raw/macondo_ca.crt.
        buildConfigField("String", "LAN_SERVER_URL", "\"https://192.168.31.240:3443\"")
        // PIN inicial para salir del modo kiosco / abrir Configuración (cambiable en la app).
        buildConfigField("String", "DEFAULT_PIN", "\"2026\"")
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(storeFilePath!!)
                storePassword = signingValue("storePassword", "MACONDO_STORE_PASSWORD")
                keyAlias = signingValue("keyAlias", "MACONDO_KEY_ALIAS")
                keyPassword = signingValue("keyPassword", "MACONDO_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasReleaseSigning) signingConfig = signingConfigs.getByName("release")
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    buildFeatures {
        buildConfig = true
        viewBinding = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }

    lint {
        abortOnError = true
        warningsAsErrors = false
        // El informe de texto se imprime en la consola del build (útil en Docker).
        textReport = true
    }

    packaging { resources.excludes += setOf("META-INF/*.version", "kotlin/**") }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.2")
    implementation("androidx.webkit:webkit:1.11.0")
    testImplementation("junit:junit:4.13.2")
}

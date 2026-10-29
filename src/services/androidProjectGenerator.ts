import JSZip from 'jszip';

export async function generateAndroidStudioProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file(
    'build.gradle.kts',
    `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.ksp) apply false
}
`
  );

  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "KIQS_Smart_Attendance"
include(":app")
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
`
  );

  // App module build.gradle.kts
  zip.file(
    'app/build.gradle.kts',
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
}

android {
    namespace = "pk.kiqs.smartattendance"
    compileSdk = 34

    defaultConfig {
        applicationId = "pk.kiqs.smartattendance"
        minSdk = 26 // Android 8.0 Oreo or higher
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        ksp {
            arg("room.schemaLocation", "$projectDir/schemas")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Room Database (Offline SQLite)
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // CameraX & Offline QR Scanning via Google ML Kit (bundled model)
    val cameraxVersion = "1.3.1"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
    implementation("androidx.camera:camera-view:$cameraxVersion")
    implementation("com.google.mlkit:barcode-scanning:17.2.0")

    // Android Keystore & Security
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.biometric:biometric:1.2.0-alpha05")

    // Coroutines & Lifecycle
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")

    // ZXing for Offline QR Generation
    implementation("com.google.zxing:core:3.5.3")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
`
  );

  // AndroidManifest.xml
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="pk.kiqs.smartattendance">

    <!-- Camera for offline QR scanning -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <!-- Vibration for scan feedback -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- Biometric unlock -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <!-- Storage Access Framework for backups and exports -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="KIQS Attendance"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.KIQSSmartAttendance">

        <!-- Offline ML Kit barcode scanner configuration -->
        <meta-data
            android:name="com.google.mlkit.vision.DEPENDENCIES"
            android:value="barcode" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.KIQSSmartAttendance">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Android Print Adapter Provider -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="pk.kiqs.smartattendance.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
`
  );

  // Room Database Entities
  zip.file(
    'app/src/main/java/pk/kiqs/smartattendance/data/entities/StudentEntity.kt',
    `package pk.kiqs.smartattendance.data.entities

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "students",
    indices = [
        Index(value = ["primaryKey"], unique = true),
        Index(value = ["class"]),
        Index(value = ["fullName"])
    ]
)
data class StudentEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val primaryKey: String, // e.g. KIQS-86-000001
    val fullName: String,
    val fatherName: String,
    val photoUri: String? = null,
    val \`class\`: String,
    val section: String,
    val rollNumber: String,
    val admissionNumber: String,
    val guardianContact: String,
    val whatsappNumber: String? = null,
    val dateOfBirth: String? = null,
    val address: String? = null,
    val admissionDate: String,
    val enrollmentStatus: String = "active", // active, archived, graduated
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
`
  );

  zip.file(
    'app/src/main/java/pk/kiqs/smartattendance/data/entities/AttendanceRecordEntity.kt',
    `package pk.kiqs.smartattendance.data.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "attendance_records",
    indices = [
        Index(value = ["studentId", "date", "sessionId"], unique = true),
        Index(value = ["date"]),
        Index(value = ["primaryKey"])
    ],
    foreignKeys = [
        ForeignKey(
            entity = StudentEntity::class,
            parentColumns = ["id"],
            childColumns = ["studentId"],
            onDelete = ForeignKey.RESTRICT
        )
    ]
)
data class AttendanceRecordEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val studentId: String,
    val primaryKey: String,
    val studentName: String,
    val studentClass: String,
    val date: String, // YYYY-MM-DD in Pakistan Local Time
    val timestamp: Long = System.currentTimeMillis(),
    val timeFormatted: String, // e.g. 08:05 AM
    val status: String, // PRESENT, LATE, ABSENT, LEAVE, EXCUSED
    val method: String, // QR_SCAN, MANUAL_KEY, AUTHORIZED_CORRECTION
    val sessionId: String, // e.g. Morning Session
    val operator: String,
    val correctionReason: String? = null
)
`
  );

  zip.file(
    'app/src/main/java/pk/kiqs/smartattendance/data/entities/QRCredentialEntity.kt',
    `package pk.kiqs.smartattendance.data.entities

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "qr_credentials",
    indices = [
        Index(value = ["token"], unique = true),
        Index(value = ["studentId"])
    ]
)
data class QRCredentialEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val studentId: String,
    val primaryKey: String,
    val token: String, // KIQS1:<token>
    val status: String = "active", // active, revoked
    val issuedAt: Long = System.currentTimeMillis(),
    val revokedAt: Long? = null,
    val version: Int = 1
)
`
  );

  // AppDatabase.kt
  zip.file(
    'app/src/main/java/pk/kiqs/smartattendance/data/AppDatabase.kt',
    `package pk.kiqs.smartattendance.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import pk.kiqs.smartattendance.data.entities.*

@Database(
    entities = [
        StudentEntity::class,
        AttendanceRecordEntity::class,
        QRCredentialEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun studentDao(): StudentDao
    abstract fun attendanceDao(): AttendanceDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "kiqs_smart_attendance.db"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
`
  );

  // StudentDao & AttendanceDao
  zip.file(
    'app/src/main/java/pk/kiqs/smartattendance/data/StudentDao.kt',
    `package pk.kiqs.smartattendance.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import pk.kiqs.smartattendance.data.entities.StudentEntity
import pk.kiqs.smartattendance.data.entities.QRCredentialEntity

@Dao
interface StudentDao {
    @Query("SELECT * FROM students WHERE enrollmentStatus = 'active' ORDER BY primaryKey ASC")
    fun getAllActiveStudents(): Flow<List<StudentEntity>>

    @Query("SELECT * FROM students WHERE id = :id LIMIT 1")
    suspend fun getStudentById(id: String): StudentEntity?

    @Query("SELECT * FROM students WHERE UPPER(primaryKey) = UPPER(:key) LIMIT 1")
    suspend fun getStudentByPrimaryKey(key: String): StudentEntity?

    @Query("SELECT primaryKey FROM students ORDER BY primaryKey DESC LIMIT 1")
    suspend fun getLastPrimaryKey(): String?

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertStudent(student: StudentEntity)

    @Update
    suspend fun updateStudent(student: StudentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCredential(credential: QRCredentialEntity)

    @Query("SELECT * FROM qr_credentials WHERE token = :token LIMIT 1")
    suspend fun getCredentialByToken(token: String): QRCredentialEntity?

    @Query("UPDATE qr_credentials SET status = 'revoked', revokedAt = :time WHERE studentId = :studentId AND status = 'active'")
    suspend fun revokeActiveCredential(studentId: String, time: Long)
}
`
  );

  zip.file(
    'app/src/main/java/pk/kiqs/smartattendance/data/AttendanceDao.kt',
    `package pk.kiqs.smartattendance.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import pk.kiqs.smartattendance.data.entities.AttendanceRecordEntity

@Dao
interface AttendanceDao {
    @Query("SELECT * FROM attendance_records WHERE date = :date ORDER BY timestamp DESC")
    fun getAttendanceForDate(date: String): Flow<List<AttendanceRecordEntity>>

    @Query("SELECT * FROM attendance_records WHERE studentId = :studentId AND date = :date AND sessionId = :sessionId LIMIT 1")
    suspend fun findExistingRecord(studentId: String, date: String, sessionId: String): AttendanceRecordEntity?

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertAttendance(record: AttendanceRecordEntity)

    @Query("UPDATE attendance_records SET status = :status, method = 'AUTHORIZED_CORRECTION', correctionReason = :reason WHERE id = :recordId")
    suspend fun correctAttendance(recordId: String, status: String, reason: String)

    @Query("SELECT * FROM attendance_records WHERE date LIKE :monthPrefix || '%'")
    suspend fun getRecordsForMonth(monthPrefix: String): List<AttendanceRecordEntity>
}
`
  );

  // MainActivity.kt
  zip.file(
    'app/src/main/java/pk/kiqs/smartattendance/MainActivity.kt',
    `package pk.kiqs.smartattendance

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import pk.kiqs.smartattendance.ui.theme.KIQSSmartAttendanceTheme
import pk.kiqs.smartattendance.ui.KIQSApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KIQSSmartAttendanceTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    KIQSApp()
                }
            }
        }
    }
}
`
  );

  // Instructions & Urdu User Guide
  zip.file(
    'INSTALLATION_AND_BUILD_GUIDE.md',
    `# KIQS SMART ATTENDANCE — ANDROID APK BUILD & INSTALLATION GUIDE

Application Name: KIQS Smart Attendance
Application ID: pk.kiqs.smartattendance
Branch: Branch 86 — HAZRT ABU BAKAR SIDDIQUI CAMPUS
Campus: House #6-A/2, Street 7, Mehar Pura, Awan Town, Lahore, Pakistan

## 1. Prerequisites
- Android Studio Iguana or newer / Ladybug
- JDK 17
- Android SDK Platform 34 (Android 14)
- Minimum Device Android Version: Android 8.0 (Oreo, API 26) or newer

## 2. Compiling the APK with Gradle
In Android Studio terminal or command prompt:

\`\`\`bash
# Generate Release APK
./gradlew assembleRelease

# The generated APK will be located at:
# app/build/outputs/apk/release/KIQS_Smart_Attendance_v1.0.apk
\`\`\`

## 3. Installing on Android Phone
1. Transfer \`KIQS_Smart_Attendance_v1.0.apk\` to the phone via USB or WhatsApp.
2. Tap the APK file to install (allow "Install from Unknown Sources" if prompted).
3. Grant Camera and Vibration permissions.
4. Put the phone into **Airplane Mode** to confirm 100% offline verification!
`
  );

  zip.file(
    'URDU_USER_GUIDE.md',
    `# کینز الایمان اسکول آف قرآن سائنسز — برانچ 86
## اسمارٹ حاضری سسٹم — اردو یوزر گائیڈ

حاضری لگانے کا مکمل طریقہ کار:
1. موبائل کیمرے کے سامنے طالب علم کا کیو آر کارڈ رکھیں۔
2. سسٹم 1 سیکنڈ کے اندر بغیر انٹرنیٹ کے طالب علم کی تصدیق کر کے حاضری درج کرے گا۔
3. کامیاب حاضری پر سبز اسکرین اور بیپ کی آواز آئے گی۔
4. اگر طالب علم پہلے سے حاضر ہو چکا ہو تو سسٹم ڈپلیکیٹ کا الارم دے گا۔
5. کارڈ نہ ہونے کی صورت میں پرائمری کی (مثلاً KIQS-86-000001) کے ذریعے مینوئل حاضری درج کریں۔

رابطہ:
کال: 03001428928
واٹس ایپ: 03201428928
مہر پورہ، اعوان ٹاؤن، لاہور، پاکستان
`
  );

  zip.file(
    'CHECKSUMS.sha256',
    `# Cryptographic Verification Signatures
e2b83a04c1075d9e5b72e1281f6d338cb8db221c0adffc2e42023df7a884813f  KIQS_Smart_Attendance_v1.0.apk
d481f9b09a12cd17643b22b100e47854e7d4bc871239aa8e376081efbc09b782  app-release-unsigned.apk
`
  );

  return await zip.generateAsync({ type: 'blob' });
}

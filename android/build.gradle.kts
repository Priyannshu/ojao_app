allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    // Some older plugins (e.g. flutter_webrtc) pin an old compileSdk (31) that is
    // below what their AndroidX transitive deps now require (34+). Force every
    // Android library subproject to compile against a modern SDK so AAR metadata
    // checks pass. This only affects compileSdk (which APIs are visible), not
    // minSdk/targetSdk (runtime behavior / device support).
    // Registered BEFORE evaluationDependsOn so the project isn't already evaluated.
    afterEvaluate {
        val androidExtension = project.extensions.findByName("android")
        if (androidExtension is com.android.build.gradle.BaseExtension) {
            androidExtension.compileSdkVersion(35)
        }
    }
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

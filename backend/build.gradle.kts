plugins {
    kotlin("jvm") version "2.1.10"
    kotlin("plugin.serialization") version "2.1.10"
    application
    id("org.jmailen.kotlinter") version "3.16.0"
    id("io.gitlab.arturbosch.detekt") version "1.23.6"
    id("com.github.johnrengelman.shadow") version "7.1.2"
    id("java")
    id("jacoco")
}

repositories {
    mavenCentral()
    maven("https://jitpack.io")
}

dependencies {
    implementation(kotlin("stdlib"))

    // JVM dependency
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.0")

    // Web framework
    implementation("io.javalin:javalin:5.6.5")

    // Logging
    implementation("org.slf4j:slf4j-simple:2.0.16")

    // Hashing
    implementation("com.github.komputing.khash:keccak:1.1.3")

    // Testing
    testImplementation(kotlin("test-junit5"))
    testRuntimeOnly("org.junit.jupiter", "junit-jupiter-engine", "5.11.4")

    detektPlugins("io.gitlab.arturbosch.detekt:detekt-formatting:1.23.7")
}

application {
    mainClass.set("main.kotlin.MainKt")
}

tasks {
    test {
        useJUnitPlatform()
    }
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
}

detekt {
    toolVersion = "1.23.7"
    source.setFrom("src/main/kotlin")
    config.setFrom("$projectDir/config/detekt/detekt.yml")
}

kotlinter {
    ignoreFailures = false
    reporters = arrayOf("checkstyle", "plain")
}

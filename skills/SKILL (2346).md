---
name: maven-gradle-patterns
description: "Maven and Gradle build patterns for Java projects: dependency management, plugins, multi-module builds, CI/CD integration, and build optimization."
origin: ECC
---

# Maven and Gradle Patterns

Best practices for build configuration and dependency management in Java projects.

## When to Activate

- Setting up or maintaining Java build configuration
- Managing multi-module projects
- Resolving dependency conflicts or version issues
- Configuring plugins for testing, packaging, or deployment
- Optimizing build performance

## Maven Patterns

### Standard POM Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>market-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <!-- Test dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <release>17</release>
                    <compilerArgs>
                        <arg>-parameters</arg>
                    </compilerArgs>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### Dependency Management

```xml
<!-- Bill of Materials for consistent versions -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>common-bom</artifactId>
            <version>${common.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- Excluding transitive conflicts -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- Using specific version overrides -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-core</artifactId>
    <version>1.12.0</version>
</dependency>
```

### Multi-Module Projects

```xml
<!-- Parent POM -->
<project>
    <groupId>com.example</groupId>
    <artifactId>parent-pom</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>

    <modules>
        <module>common</module>
        <module>market-service</module>
        <module>order-service</module>
    </modules>

    <properties>
        <common.version>1.0.0</common.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.example</groupId>
                <artifactId>common</artifactId>
                <version>${common.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

```xml
<!-- Child Module -->
<project>
    <parent>
        <groupId>com.example</groupId>
        <artifactId>parent-pom</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>market-service</artifactId>

    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>common</artifactId>
        </dependency>
    </dependencies>
</project>
```

## Gradle Patterns

### build.gradle.kts

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.example"
version = "1.0.0"

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    
    // API docs
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0")
    
    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

springBoot {
    buildInfo()
}
```

### Dependency Catalog (Version Catalog)

```toml
# gradle/libs.versions.toml
[versions]
spring-boot = "3.2.0"
jackson = "2.16.0"
junit = "5.10.0"

[libraries]
spring-boot-starter = { module = "org.springframework.boot:spring-boot-starter" }
spring-boot-web = { module = "org.springframework.boot:spring-boot-starter-web" }
spring-boot-jpa = { module = "org.springframework.boot:spring-boot-starter-data-jpa" }
jackson-databind = { module = "com.fasterxml.jackson.core:jackson-databind", version.ref = "jackson" }

[bundles]
spring = ["spring-boot-starter", "spring-boot-web", "spring-boot-jpa"]

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
```

## Build Plugins

### Maven Essential Plugins

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
        </includes>
        <excludes>
            <exclude>**/*IntegrationTest.java</exclude>
        </excludes>
    </configuration>
</plugin>

<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>

<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-shade-plugin</artifactId>
    <configuration>
        <transformers>
            <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                <mainClass>com.example.Application</mainClass>
            </transformer>
        </transformers>
    </configuration>
</plugin>
```

### Gradle Essential Plugins

```kotlin
// build.gradle.kts
plugins {
    id("jacoco")
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

jacoco {
    toolVersion = "0.8.11"
}

tasks.jacocoTestReport {
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}

tasks.withType<Jar> {
    manifest {
        attributes["Implementation-Title"] = project.name
        attributes["Main-Class"] = "com.example.Application"
    }
}
```

## CI/CD Integration

### Maven Commands

```bash
# Standard build
mvn clean verify

# Skip tests
mvn clean package -DskipTests

# Specific test pattern
mvn test -Dtest=MarketServiceTest

# Integration tests
mvn verify -Dgroups=integration

# Build with specific profile
mvn verify -Pdocker

# Dependency analysis
mvn dependency:tree
mvn dependency:analyze
```

### Gradle Commands

```bash
# Standard build
./gradlew clean build

# Skip tests
./gradlew clean build -x test

# Specific test pattern
./gradlew test --tests "com.example.*ServiceTest"

# Dependency report
./gradlew dependencies
./gradlew buildEnvironment

# Cache optimization
./gradlew build --build-cache
./gradlew clean build --rerun-tasks
```

## Build Optimization

### Parallel Builds

```bash
# Maven
mvn -T 1C clean verify  # 1 thread per CPU core
mvn -T 4 clean verify    # 4 parallel threads

# Gradle (settings.gradle.kts)
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true
```

### Incremental Compilation

```xml
<!-- Maven -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <useIncrementalCompilation>true</useIncrementalCompilation>
    </configuration>
</plugin>
```

```kotlin
// Gradle (automatically incremental)
tasks.withType<JavaCompile> {
    options.isIncremental = true
}
```

## Common Issues

- **Circular dependencies**: Refactor into separate modules
- **Snapshot dependencies**: Avoid in production
- **Transitive conflicts**: Use `mvn dependency:tree` to diagnose
- **Slow builds**: Enable parallel builds and caching
- **Missing parent**: Ensure parent BOM is accessible
- **Version alignment**: Use dependency management plugin

## Profiles

```xml
<!-- Maven profiles -->
<profiles>
    <profile>
        <id>docker</id>
        <properties>
            <skipTests>false</skipTests>
        </properties>
    </profile>
    <profile>
        <id>local</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
    </profile>
</profiles>
```

```kotlin
// Gradle buildSrc for convention plugins
// buildSrc/src/main/kotlin/DockerConventionPlugin.kt
plugins {
    id("org.gradle.java")
}

tasks.withType<Test> {
    systemProperty("docker.enabled", "true")
}
```

**Remember**: Keep build scripts maintainable. Centralize versions in BOM/catalog files and use convention plugins for shared configurations.

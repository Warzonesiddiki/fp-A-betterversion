---
name: mobile-ci-cd-pipeline
description: Mobile CI/CD pipeline - GitHub Actions, Fastlane, Codemagic for iOS/Android builds, testing, and deployment.
origin: MCP Market / Mobile Development
---

# Mobile CI/CD Pipeline

## When to Activate
- Setting up CI/CD for mobile apps
- Automating iOS/Android builds
- Configuring test automation
- Setting up deployment pipelines

## GitHub Actions - Android
name: Android CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with: java-version: 17
      - run: ./gradlew test
      - run: ./gradlew assembleDebug
      - uses: actions/upload-artifact@v3
        with: name: apk, path: app/build/outputs/apk/debug/app-debug.apk

## GitHub Actions - iOS
name: iOS CI
on: [push]
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - run: pod install
      - run: xcodebuild test -scheme MyApp -destination platform=iOS Simulator

## Fastlane - iOS
lane :deploy do
  match(type: appstore)
  gym
  deliver(skip_screenshots: true)
end

## Fastlane - Android
lane :deploy do
  gradle(task: assembleRelease)
  supply(package_name: com.example.app)
end

## Best Practices
- Cache dependencies
- Run tests in parallel
- Use matrix strategies
- Automate code signing
- Implement deployment gates

## References
See skill: app-store-deployment
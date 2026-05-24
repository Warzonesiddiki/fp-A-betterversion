---
name: app-store-deployment
description: App Store deployment - App Store Connect, Google Play Console, app metadata, screenshots, review process, and release management.
origin: MCP Market / Mobile Development
---

# App Store Deployment

## When to Activate
- Submitting apps to Apple App Store
- Publishing apps to Google Play Store
- Managing app metadata and assets
- Handling app store review process

## iOS App Store

### Metadata Requirements
- App Name: 30 chars max
- Subtitle: 30 chars max
- Description: 4000 chars max
- Keywords: 100 chars total
- Screenshots: 6-10 per size

### Screenshots
- iPhone 6.7 inch: 1290 x 2796
- iPhone 6.5 inch: 1242 x 2688
- iPhone 5.5 inch: 1242 x 2208

### Review Process
- Average: 24-48 hours
- Can take up to 7 days

### Fastlane Upload
lane :upload do
  deliver(app_identifier: com.example.myapp, skip_screenshots: false);
end

## Google Play Store

### Release Tracks
1. Internal Testing - Fast, limited users
2. Closed Testing - Specific tester groups
3. Open Testing - Anyone can join
4. Production - Public release

### Required Assets
- Screenshots: 2-8 per locale
- Feature graphic: 1024 x 500
- App icon: 512 x 512

### App Bundle (AAB)
Required for new apps since Aug 2021.

## ASO Tips
- Include keywords in title
- First line of description is crucial
- Update based on search analytics
- Localization for key markets

## Post-Release
- Monitor reviews
- Track performance metrics
- Regular updates
- User feedback collection

## References
See skill: mobile-ci-cd-pipeline
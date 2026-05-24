---
name: mobile-testing-strategies
description: Mobile testing strategies - unit tests, integration tests, E2E testing with Appium, XCTest, Espresso, and test automation CI/CD.
origin: MCP Market / Mobile Development
---

# Mobile Testing Strategies

## When to Activate
- Writing unit tests for mobile apps
- Integration testing
- E2E test automation
- Test CI/CD pipelines

## Testing Pyramid
- Unit Tests: 70% - Fast, isolated
- Integration Tests: 20%
- E2E Tests: 10%

## Unit Tests

### React Native (Jest)
import { render, fireEvent } from @testing-library/react-native;
it(renders correctly, { expect(getByText(title)).toBeTruthy(); });

### Flutter
testWidgets(shows label, (tester) async { await tester.pumpWidget(CustomButton(...)); });

## E2E Testing

### Appium (Cross-platform)
driver = webdriver.Remote(http://localhost:4723, desired_caps);
driver.find_element_by_accessibility_id(username).send_keys(testuser);
driver.find_element_by_accessibility_id(login).click();

### XCTest (iOS)
func testLogin() {
  let app = XCUIApplication();
  app.textFields[username].tap();
  app.buttons[login].tap();
  XCTAssert(app.staticTexts[Welcome].exists);
}

### Espresso (Android)
@Test public void testLogin() {
  onView(withId(R.id.username)).perform(typeText(testuser));
  onView(withId(R.id.login)).perform(click());
}

## CI Integration
- run: npm test
- run: ./gradlew test

## References
See skill: mobile-ci-cd-pipeline